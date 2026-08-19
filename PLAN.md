# Trade Blotter — Implementation Plan

A step-by-step plan to wire the backend and the frontend. Each step is one
session. Do the steps in order. Each step has a goal, the tasks to do, and a
verification block. Do not start the next step until the verification passes.

## Goal

Build a real-time equity trade blotter. A user can view, create, amend, and
cancel trades. Changes that one client makes must be visible to all connected
clients without a page refresh.

## Canonical trade model

All layers must use this exact TypeScript interface. The backend, the API
JSON, and the frontend must all use the same field names and value sets.

```ts
interface Trade {
  id: string         // business id, e.g. "TRD-100001". Server makes it.
  symbol: string     // 1 to 16 chars. Required.
  quantity: number   // integer, greater than 0. Required.
  price: number      // greater than 0. Two decimals. Required.
  side: "BUY" | "SELL"
  trader: string     // 1 to 32 chars. Required.
  tradeDate: string  // ISO 8601 date string. Server sets it on create.
  status: "ACTIVE" | "CANCELLED"
}
```

Notes:

- `id` is a string, not an integer. The value is `TRD-` plus a zero-padded
  sequence. The server makes it. The client never sends it.
- `tradeDate` is the only date field. The server sets it on create. Amend does
  not change it. Do not add `createdAt`, `updatedAt`, `tradeTimestamp`, `book`,
  `counterparty`, or `tradeId`. The model has only the eight fields above.
- The database may keep an internal serial primary key plus audit columns, but
  the API must not expose them. The API JSON must contain only the eight fields
  in the interface.

### Status rules

- A new trade has the status `ACTIVE`.
- Amend is permitted only when the status is `ACTIVE`.
- Cancel sets the status to `CANCELLED`. A cancelled trade cannot change.
- Amend and cancel keep the `id` and the `tradeDate`.

## Socket.IO events

The backend must emit these events. The frontend must listen for them.

| Event             | When           | Payload   |
| ----------------- | -------------- | --------- |
| `trade:created`   | after a create | the trade |
| `trade:amended`   | after an amend | the trade |
| `trade:cancelled` | after a cancel | the trade |

---

## Step 1 — Reconcile the database schema ✅

**Goal:** Make the Drizzle schema store the canonical trade model.

Tasks:

1. Open `backend/src/db/schema.ts`.
2. Replace the `tradeStatus` enum with `['ACTIVE', 'CANCELLED']`.
3. Keep the `side` enum as `['BUY', 'SELL']`.
4. Keep `id` as a serial primary key (internal).
5. Add the column `tradeId` (`text`, not null) with a unique index. This column
   holds the business id string `TRD-100001`.
6. Add the column `tradeDate` (`timestamp`, not null). Default to `now()`.
7. Keep `symbol`, `side`, `quantity`, `price`, `trader`, `status`.
8. Remove the `reference` column and its unique index. `tradeId` replaces it.
9. Remove the `counterparty` column. The canonical model does not have it.
10. Keep `createdAt` and `updatedAt` as audit columns. The API must not expose
    them.
11. Keep the indexes on `symbol`, `status`, and `createdAt`.
12. Run `pnpm --filter backend run db:generate` to make a new migration.
13. Run `pnpm --filter backend run db:migrate` to apply the migration.

Verification:

- `pnpm --filter backend run typecheck` passes.
- `pnpm --filter backend run db:studio` shows the `trades` table with the
  `tradeId` and `tradeDate` columns.
- The migration file is in `backend/drizzle/`.

---

## Step 2 — Generate the trade id on the server ✅

**Goal:** The server must make the `id` value `TRD-` plus a zero-padded
sequence.

Tasks:

1. Add a helper, for example `backend/src/lib/trade-id.ts`, that takes the
   serial `id` and returns `TRD-` plus the id padded to 6 digits. Example:
   `1` becomes `TRD-100001`.
2. In the create route, after the insert, set `tradeId` with the helper and
   update the row. Return the row with the `tradeId`.

Alternative (preferred): use a Postgres sequence or a generated column so the
`tradeId` is set in the same insert. If you use a generated column, the helper
is not needed.

Verification:

- A `POST /trades` returns a trade with `id` equal to `TRD-100001` for the
  first row.
- A second insert returns `TRD-100002`.

---

## Step 3 — Rewrite the trade routes and the validation ✅

**Goal:** The REST endpoints must use the canonical model and the new status
rules. The API JSON must contain only the eight canonical fields.

Tasks:

1. Open `backend/src/routes/trades.ts`.
2. Make a serializer, for example `toTradeDTO(row)`, that maps a database row
   to the canonical `Trade` object: `{ id: row.tradeId, symbol, quantity,
   price, side, trader, tradeDate, status }`. Do not expose `id` (serial),
   `createdAt`, or `updatedAt`.
3. Update the create schema (`tradeInput`) to require `symbol`, `side`,
   `quantity`, `price`, `trader`. Do not accept `id`, `tradeDate`, `status`,
   `createdAt`, or `updatedAt` from the client. The server sets `tradeDate`
   and `status`.
4. Update the amend schema (`tradePatch`) to accept only `symbol`, `side`,
   `quantity`, `price`, `trader`. Do not accept `status` or `tradeDate`.
5. In the amend route, reject the request with `409` if the trade status is
   not `ACTIVE`.
6. In the cancel route (`DELETE /trades/:id`), match by `tradeId` (the string
   `id`). Set the status to `CANCELLED`. Reject the request with `409` if the
   status is already `CANCELLED`.
7. The list route `GET /trades` must return an array of `Trade` DTOs. Order by
   `tradeDate` descending.
8. The detail route `GET /trades/:id` must match by `tradeId`, not by the
   serial `id`.
9. Use `toTradeDTO` for every response, including the socket payloads.

Verification:

- `POST /trades` with `{ symbol, side, quantity, price, trader }` returns
  `201` and a `Trade` object with only the eight canonical fields.
- `PATCH /trades/TRD-100001` on a cancelled trade returns `409`.
- `DELETE /trades/TRD-100001` on an active trade sets the status to
  `CANCELLED`.
- A second `DELETE` on the same trade returns `409`.
- `GET /trades` returns objects with no `createdAt`, `updatedAt`, or serial
  `id`.

---

## Step 4 — Align the Socket.IO events and the broadcast ✅

**Goal:** The backend must emit `trade:created`, `trade:amended`, and
`trade:cancelled` with the canonical `Trade` payload.

Tasks:

1. Open `backend/src/plugins/socket.ts`.
2. Change `TRADE_EVENTS.UPDATED` to `TRADE_EVENTS.AMENDED` with the value
   `trade:amended`.
3. Keep `CREATED` and add `CANCELLED` with the value `trade:cancelled`. The
   cancel route must emit `trade:cancelled`, not `trade:updated`.
4. Update `backend/src/routes/trades.ts` to use the new event names and to pass
   the `toTradeDTO` output to `broadcastTrade`.

Verification:

- Start the backend. A create emits `trade:created` with a canonical `Trade`
  payload to all clients.
- The amend event name is `trade:amended`.
- The cancel event name is `trade:cancelled`.

---

## Step 5 — Update the seed script ✅

**Goal:** The seed data must match the sample trade data in the brief, mapped
to the canonical model.

Tasks:

1. Open `backend/src/seed.ts`.
2. Replace the rows with the three sample trades, mapped to the canonical
   model. Use these values:
   - `TRD-100001`, `AAPL`, `BUY`, `5000`, `227.45`, `JSMITH`,
     `2026-08-18T09:15:23Z`, `ACTIVE`.
   - `TRD-100002`, `MSFT`, `SELL`, `1200`, `534.22`, `ABROWN`,
     `2026-08-18T09:18:54Z`, `ACTIVE`.
   - `TRD-100003`, `TSLA`, `BUY`, `800`, `341.75`, `MJONES`,
     `2026-08-18T09:20:11Z`, `CANCELLED`.
3. Insert the `tradeId` directly so the sample ids stay stable. Use
   `onConflictDoNothing` with the `tradeId` conflict target so that a repeated
   seed does not duplicate rows.

Note: The sample data in the brief also had `book` and `counterparty`. The
canonical model does not have these fields. Do not include them.

Verification:

- `pnpm db:seed` inserts three rows.
- A second `pnpm db:seed` does not duplicate rows.
- `GET /trades` returns three `Trade` objects with the sample values and no
  extra fields.

---

## Step 6 — Add the frontend data layer

**Goal:** The frontend must fetch the trades from the API and keep the cache in
sync with the socket stream.

Tasks:

1. In `frontend`, add the dependencies: `@tanstack/react-query`,
   `socket.io-client`. Use `pnpm --filter frontend add ...`.
2. Make `frontend/src/lib/api.ts` with a `fetchTrades` function that calls
   `GET http://localhost:4000/trades` and returns `Promise<Trade[]>`.
3. Make `frontend/src/types.ts` with the canonical `Trade` interface exactly as
   given in this plan. Use the types `side: "BUY" | "SELL"` and
   `status: "ACTIVE" | "CANCELLED"`.
4. Make `frontend/src/lib/socket.ts` that connects to `http://localhost:4000`
   and exports the socket client.
5. Wrap the app in a `QueryClientProvider` in `frontend/src/main.tsx`.
6. Remove the old `Trade` interface and the `SAMPLE_TRADES` constant from
   `TradeBlotter.tsx`.

Verification:

- `pnpm --filter frontend run typecheck` passes.
- The app no longer shows the hardcoded sample data. (It can be empty until
  Step 7.)

---

## Step 7 — Wire the blotter grid to the API and the socket

**Goal:** The grid must show the server data and update in real time.

Tasks:

1. In `TradeBlotter.tsx`, use `useQuery({ queryKey: ['trades'], queryFn:
   fetchTrades })` to load the rows.
2. Use `useEffect` to subscribe to the socket events `trade:created`,
   `trade:amended`, `trade:cancelled`.
3. On each event, call `queryClient.setQueryData` to update the cache by `id`.
   For `trade:created`, add the row. For `trade:amended` and
   `trade:cancelled`, replace the row with the same `id`.
4. Set `getRowId={(p) => p.data.id}` so AG Grid updates the correct row.
5. Add a Refresh button above the grid. The button calls
   `queryClient.invalidateQueries({ queryKey: ['trades'] })`.

Note: Before you change the grid columns or the theme, read the `ag-dev` skill.
The project uses AG Grid v36. The v36 API uses `ModuleRegistry.registerModules`
and the `theme` prop. Do not use v35 APIs.

Verification:

- Start the backend and the frontend with `pnpm dev`.
- The grid shows the seeded trades.
- Open two browser tabs. Create a trade in tab A. Tab B shows the new trade
  without a page refresh.
- The Refresh button reloads the data from the API.

---

## Step 8 — Update the grid columns for the canonical model

**Goal:** The grid must show all canonical fields with the correct formatting.

Tasks:

1. Read the `ag-dev` skill before you change the column definitions.
2. Update `columnDefs` to show the eight canonical fields: `id`, `symbol`,
   `quantity`, `price`, `side`, `trader`, `tradeDate`, `status`.
3. Keep sorting and filtering on all columns. Set `defaultColDef` with
   `sortable: true`, `filter: true`, `resizable: true`.
4. Format `price` as USD currency. Format `quantity` with a thousands
   separator.
5. Format `tradeDate` with `toLocaleString`.
6. Keep the cell class rules for `side` (`BUY` green, `SELL` red) and for
   `status` (`ACTIVE` green, `CANCELLED` muted).

Verification:

- All eight fields show in the grid.
- Sort works on each column.
- The filter on `symbol` and on `status` works.
- The price shows as `$227.45`. The trade date shows as a local string.

---

## Step 9 — Build the Create Trade form

**Goal:** A user can create a trade with validation.

Tasks:

1. Make `frontend/src/components/CreateTradeForm.tsx`.
2. Use the shadcn `Button` and form inputs. Add the inputs: `symbol`, `side`
   (a select with `BUY` and `SELL`), `quantity`, `price`, `trader`.
3. Validate on the client: all fields required, `quantity` is an integer
   greater than 0, `price` is a number greater than 0, `symbol` is 1 to 16
   chars, `trader` is 1 to 32 chars.
4. On submit, call `POST /trades`. On success, show a toast and reset the form.
   The socket event will update the grid; do not update the cache manually.
5. On error, show the server error message.

Verification:

- A submit with a valid payload adds a trade to the grid in all clients.
- A submit with an empty `symbol` is blocked on the client.
- A submit with `quantity` equal to 0 is blocked on the client.
- A submit with `price` equal to 0 is blocked on the client.

---

## Step 10 — Build the Amend and Cancel actions

**Goal:** A user can amend and cancel a trade from the grid.

Tasks:

1. Add an actions column to the grid with two buttons: Amend and Cancel.
2. The Amend button opens a form (or an inline editor) with the trade values.
   On submit, call `PATCH /trades/:id` where `:id` is the trade `id` string.
   Disable Amend when the status is `CANCELLED`.
3. The Cancel button calls `DELETE /trades/:id`. Show a confirmation before the
   request. Disable Cancel when the status is `CANCELLED`.
4. The socket events update the grid in all clients.
5. If the server returns `409`, show a toast with the message "The trade is not
   active."

Verification:

- Amend on an active trade changes the values in all clients.
- Cancel on an active trade sets the status to `CANCELLED` in all clients.
- Amend and Cancel are disabled on a cancelled trade.
- A `409` response shows the correct toast.

---

## Step 11 — End-to-end check and polish

**Goal:** All functional requirements work together.

Tasks:

1. Run `pnpm typecheck` and `pnpm lint` at the root. Fix all errors.
2. Start the stack: `pnpm up`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`.
3. Open two browser tabs at `http://localhost:5173`.
4. Do this sequence in tab A:
   1. Create a trade.
   2. Amend the trade.
   3. Cancel the trade.
5. Confirm that tab B shows each change without a page refresh.
6. Test the Refresh button in both tabs.
7. Update the root `README.md` and the `frontend/README.md` so the described
   stack matches the installed packages (Drizzle, not Prisma; react-query;
   socket.io-client).

Verification:

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- All four functional requirements (blotter, create, amend, cancel, live
  updates) work in two tabs.
- The README files match the code.

---

## Notes

- The root `README.md` says there is a `database/` workspace. The
  `pnpm-workspace.yaml` file lists only `frontend` and `backend`. Fix this in
  Step 11, or add the `database/` workspace if you move the schema out of the
  backend.
- The backend uses Drizzle, not Prisma. The root scripts `db:push`,
  `db:migrate`, and `db:seed` already point to the backend. Keep them.
- Keep the `id` format stable. The seed and the server helper must use the same
  format.
- The canonical model has only eight fields. Do not add fields that are not in
  the interface, even if the sample data in the brief had them.
