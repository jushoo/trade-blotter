# Backend Migration Plan — Drizzle to Prisma ORM 7 + PostgreSQL

## Goal

Replace Drizzle ORM with Prisma ORM 7 in the `backend` workspace. Keep PostgreSQL as the database. Keep the canonical trade model and the existing REST / Socket.IO behavior.

## Decisions

- Use Prisma ORM 7 with the `prisma-client` generator.
- Use the PostgreSQL driver adapter `@prisma/adapter-pg` and the `pg` driver.
- Store connection settings in `prisma.config.ts`, not in `schema.prisma`.
- Keep the project as ESM (`"type": "module"`).
- Nuke the existing development database and create a fresh Prisma migration baseline. This avoids migrating the old Drizzle-generated column and enum state.
- Make `tradeId` a regular `String` column. Compute the business id in the create route from the serial primary key. Do not use a database-generated column.
- Keep Prisma enums for `side` and `status` mapped to the existing PostgreSQL enum names `side` and `trade_status`.

## Prerequisites

- Node.js 20.19.0 or later.
- PostgreSQL running locally on port `5432`.
- `DATABASE_URL` set in `backend/.env`.

## Step 1 — Install Prisma packages

1. Open `backend/package.json`.
2. Remove these dependencies:
   - `drizzle-orm`
3. Remove these devDependencies:
   - `drizzle-kit`
4. Add these dependencies:
   - `@prisma/client`
   - `@prisma/adapter-pg`
   - `pg` (already installed)
5. Add these devDependencies:
   - `prisma`
6. Run `pnpm install`.

## Step 2 — Add Prisma schema and config

1. Create `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

enum Side {
  BUY
  SELL

  @@map("side")
}

enum TradeStatus {
  ACTIVE
  CANCELLED

  @@map("trade_status")
}

model Trade {
  id        Int         @id @default(autoincrement()) @map("id")
  tradeId   String      @unique @map("trade_id")
  symbol    String      @map("symbol")
  side      Side        @map("side")
  quantity  Int         @map("quantity")
  price     Float       @map("price")
  trader    String      @map("trader")
  tradeDate DateTime    @default(now()) @map("trade_date") @db.Timestamptz(6)
  status    TradeStatus @default(ACTIVE) @map("status")
  createdAt DateTime    @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime    @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@index([symbol])
  @@index([status])
  @@index([tradeDate])
  @@map("trades")
}
```

2. Create `backend/prisma.config.ts`:

```typescript
import 'dotenv/config'
import path from 'node:path'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: path.join(import.meta.dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(import.meta.dirname, 'prisma', 'migrations'),
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
```

3. Add `/generated/prisma` to `backend/.gitignore` if it is not already there.

## Step 3 — Replace the database client

1. Delete `backend/src/db/schema.ts`.
2. Delete `backend/src/db/index.ts`.
3. Create `backend/src/db.ts`:

```typescript
import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const url = process.env['DATABASE_URL']
if (!url) throw new Error('DATABASE_URL is not set.')

const pool = new pg.Pool({ connectionString: url })
const adapter = new PrismaPg(pool)

export const prisma = new PrismaClient({ adapter })
```

## Step 4 — Add the trade id helper

1. Create `backend/src/lib/trade-id.ts`:

```typescript
export function makeTradeId(serialId: number): string {
  return `TRD-${serialId + 100000}`
}
```

2. Use this helper in the create route and in the seed script.

## Step 5 — Rewrite routes with Prisma Client

1. Open `backend/src/routes/trades.ts`.
2. Replace the Drizzle imports with `import { prisma } from '../db'`.
3. Keep the zod schemas and the `TradeDTO` serializer.
4. Rewrite each route with Prisma Client queries:

```typescript
// List
const rows = await prisma.trade.findMany({ orderBy: { tradeDate: 'desc' } })

// Detail
const row = await prisma.trade.findUnique({ where: { tradeId: req.params.id } })

// Create
const next = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(
  `SELECT nextval('trades_id_seq') as nextval`
)
const id = Number(next[0].nextval)
const row = await prisma.trade.create({
  data: { id, tradeId: makeTradeId(id), ...parsed.data },
})

// Amend
const row = await prisma.trade.update({
  where: { tradeId: req.params.id, status: 'ACTIVE' },
  data: { ...parsed.data, updatedAt: new Date() },
})

// Cancel
const row = await prisma.trade.update({
  where: { tradeId: req.params.id },
  data: { status: 'CANCELLED', updatedAt: new Date() },
})
```

5. Handle the case where an active-only update fails with a clear 409 response.

## Step 6 — Rewrite the seed script

1. Open `backend/src/seed.ts`.
2. Replace Drizzle imports with `import { prisma } from './db'` and `import { makeTradeId } from './lib/trade-id'`.
3. Use `prisma.trade.createMany` with explicit `id`, `tradeId`, and the canonical fields.
4. Advance the sequence after seeding so the next create does not collide:

```typescript
await prisma.$executeRawUnsafe(
  `SELECT setval('trades_id_seq', GREATEST((SELECT max(id) FROM trades), 1))`
)
```

## Step 7 — Update package scripts

1. Open `backend/package.json`.
2. Replace the Drizzle scripts with Prisma scripts:

```json
{
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:push": "prisma db push",
  "db:studio": "prisma studio",
  "db:seed": "tsx prisma/seed.ts"
}
```

3. Move `backend/src/seed.ts` to `backend/prisma/seed.ts` or keep the path in the script consistent.
4. Update root `package.json` scripts if the filter names change. Keep `db:push`, `db:migrate`, and `db:seed` pointing at the backend.

## Step 8 — Update Docker build

1. Open `backend/Dockerfile`.
2. Run `pnpm --filter backend run db:generate` after `pnpm install` and before `pnpm --filter backend run build`.
3. Copy the generated client directory into the prod stage if the build does not bundle it.

## Step 9 — Nuke and recreate the database

1. Stop the stack with `pnpm down`.
2. Delete the local Postgres volume `./.postgres-data`.
3. Start the stack with `pnpm up`.
4. Run `pnpm --filter backend run db:migrate`.
5. Run `pnpm db:seed`.

## Step 10 — Verify

1. Run `pnpm typecheck` at the root.
2. Run `pnpm --filter backend run db:studio` and confirm the `trades` table.
3. Start the backend and frontend with `pnpm dev`.
4. Test the canonical create, amend, cancel, list, and socket flows in two browser tabs.
5. Confirm the first created trade has id `TRD-100001` and the second has `TRD-100002`.

## Documentation updates

1. Update `backend/README.md` to say Prisma ORM 7 instead of Drizzle.
2. Update `PLAN.md` to say the backend uses Prisma ORM 7.
3. Update `README.md` if it still mentions Drizzle.

## Notes

- Prisma Client computed fields are read-only. The business id must be stored because it is the API identifier and has a unique index. Compute it in the create route instead.
- Do not put `url` in `schema.prisma`. Prisma 7 reads it from `prisma.config.ts`.
- Re-run `pnpm --filter backend run db:generate` after every schema change.
