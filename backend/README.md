# @trade-blotter/backend

Fastify + TypeScript + Socket.IO REST/realtime API with Prisma ORM 7 + PostgreSQL.

Responsibilities:
- REST endpoints for trade create / amend / cancel
- PostgreSQL persistence via Prisma ORM 7
- Socket.IO broadcast of trade events to connected blotter clients

## Structure

```
backend/
├── prisma/
│   ├── schema.prisma     # Prisma data model + enums
│   ├── migrations/       # SQL migrations (prisma migrate)
│   └── seed.ts           # seed script
├── prisma.config.ts      # Prisma CLI config (schema path, DATABASE_URL)
├── generated/prisma/     # generated Prisma client (git-ignored)
├── src/
│   ├── app.ts            # entry point: parse env, build, listen
│   ├── server.ts         # buildServer() factory
│   ├── db.ts             # Prisma client + pg driver adapter factory
│   ├── schema/
│   │   └── env.ts        # Zod env schema
│   ├── schemas/
│   │   └── trade.ts      # shared trade Zod schemas + DTO types
│   ├── lib/
│   │   ├── trade-id.ts   # business id helper (TRD-100001)
│   │   └── errors.ts     # typed HTTP errors
│   ├── plugins/
│   │   ├── config.ts     # env decorator
│   │   ├── zod.ts        # Zod validator/serializer compilers
│   │   ├── cors.ts       # CORS allow-list
│   │   ├── db.ts         # Prisma decorator + pool lifecycle
│   │   ├── socket.ts     # Socket.IO server + broadcast helpers
│   │   └── error-handler.ts # custom error and 404 handlers
│   ├── routes/
│   │   └── trades/
│   │       └── index.ts  # REST trade CRUD
│   └── services/
│       └── trades.ts     # trade business logic
└── Dockerfile
```

## Scripts

- `pnpm --filter backend run dev` — start dev server with hot reload
- `pnpm --filter backend run build` — bundle to `dist/app.js` with esbuild
- `pnpm --filter backend run start` — run the bundled server
- `pnpm --filter backend run test` — run unit tests with vitest
- `pnpm --filter backend run test:watch` — run tests in watch mode
- `pnpm --filter backend run typecheck` — typecheck with tsc
- `pnpm --filter backend run db:generate` — generate the Prisma client
- `pnpm --filter backend run db:migrate` — create and apply a migration
- `pnpm --filter backend run db:migrate:deploy` — apply migrations in production
- `pnpm --filter backend run db:push` — push the schema to the dev DB
- `pnpm --filter backend run db:studio` — open Prisma Studio
- `pnpm --filter backend run db:seed` — seed sample trades

## Environment

See `.env.example`. `DATABASE_URL` must point at the Postgres instance.
