# Trade Blotter

A real-time equity trade blotter for a broker — view, create, amend, and cancel
trades with live updates pushed to the UI.

## Architecture

This is a **pnpm monorepo** with two workspaces:

| Package    | Stack                                              | Description                                    |
| ---------- | -------------------------------------------------- | ---------------------------------------------- |
| `frontend` | React + TypeScript (Vite) + AG Grid + shadcn        | Blotter UI; consumes REST + Socket.IO stream   |
| `backend`  | Node.js + Fastify + TypeScript + Socket.IO + Prisma ORM 7 | REST API for mutations; emits realtime events  |

PostgreSQL runs in Docker Compose. The backend and frontend run on the host
for local development.

### Trade model

The API uses a single canonical `Trade` shape across all layers:

```ts
interface Trade {
  id: string         // "TRD-100001", server-generated
  symbol: string
  quantity: number
  price: number
  side: "BUY" | "SELL"
  trader: string
  tradeDate: string  // ISO 8601, server-set on create
  status: "ACTIVE" | "CANCELLED"
}
```

- A new trade has status `ACTIVE`.
- Amend is permitted only when the status is `ACTIVE` (else `409`).
- Cancel sets the status to `CANCELLED` (else `409` if already cancelled).

### Realtime

Mutations (create / amend / cancel) are submitted over REST. The backend writes
to Postgres and then broadcasts `trade:created` / `trade:amended` /
`trade:cancelled` events over Socket.IO. The frontend keeps its React Query
cache in sync from the socket stream, so changes made by one client appear in
all connected clients without a page refresh.

### Authentication

Email and password authentication with Better Auth. Sessions use an HttpOnly
cookie. The REST routes under `/trades` and the Socket.IO stream require a
valid session.

- Auth API: `/api/auth/*` (sign-up, sign-in, sign-out, session)
- Frontend: sign-in page; the blotter UI shows only for a signed-in user

Set these environment variables in `backend/.env`:

```env
BETTER_AUTH_SECRET=<32+ chars, generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:4000
```

Note: `@better-auth/cli generate` (1.4.x) does not emit the `Account.issuer`
field that Better Auth 1.7 needs. Keep the `issuer` field in the Prisma
`Account` model if you regenerate the schema.

### Local execution

```bash
pnpm up            # docker compose up -d  (Postgres only)
pnpm db:migrate    # apply Prisma migrations
pnpm db:seed       # seed three sample trades
pnpm dev           # run frontend + backend in parallel (host)
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:4000

See `docker-compose.yml` for the service definitions.

## Project layout

```
trade-blotter/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── frontend/        # React + Vite + AG Grid + shadcn + TanStack Query/Form
└── backend/         # Fastify + Socket.IO + Prisma ORM 7 + PostgreSQL
```

## Scripts

| Script           | Description                                  |
| ---------------- | -------------------------------------------- |
| `pnpm dev`       | Run frontend + backend in parallel           |
| `pnpm build`     | Build all workspaces                         |
| `pnpm typecheck` | Typecheck all workspaces                     |
| `pnpm lint`      | Lint all workspaces                          |
| `pnpm db:migrate`| Apply Prisma migrations                      |
| `pnpm db:seed`   | Seed sample trades                           |
| `pnpm up`        | Start Postgres via Docker Compose            |
| `pnpm down`      | Stop Docker Compose services                 |
