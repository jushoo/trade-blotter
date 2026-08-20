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
│   ├── db.ts             # Prisma client + pg driver adapter
│   ├── lib/
│   │   └── trade-id.ts   # business id helper (TRD-100001)
│   ├── plugins/
│   │   └── socket.ts     # Socket.IO server + event broadcast helpers
│   ├── routes/
│   │   └── trades.ts     # REST trade CRUD
│   ├── server.ts         # Fastify + Socket.IO bootstrap
│   └── types.ts          # Fastify instance decorators
└── Dockerfile
```

## Scripts

- `pnpm --filter backend run dev` — start dev server with hot reload
- `pnpm --filter backend run build` — bundle to `dist/server.js` with esbuild
- `pnpm --filter backend run start` — run the bundled server
- `pnpm --filter backend run db:generate` — generate the Prisma client
- `pnpm --filter backend run db:migrate` — create and apply a migration
- `pnpm --filter backend run db:migrate:deploy` — apply migrations in production
- `pnpm --filter backend run db:push` — push the schema to the dev DB
- `pnpm --filter backend run db:studio` — open Prisma Studio
- `pnpm --filter backend run db:seed` — seed sample trades

## Environment

See `.env.example`. `DATABASE_URL` must point at the Postgres instance.
