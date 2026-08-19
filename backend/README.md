# @trade-blotter/backend

Fastify + TypeScript + Socket.IO REST/realtime API with Drizzle ORM + PostgreSQL.

Responsibilities:
- REST endpoints for trade create / amend / cancel
- PostgreSQL persistence via Drizzle ORM
- Socket.IO broadcast of trade events to connected blotter clients

## Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── schema.ts    # Drizzle table + enum definitions
│   │   └── index.ts     # db client (drizzle + pg Pool)
│   ├── plugins/
│   │   └── socket.ts    # Socket.IO server + event broadcast helpers
│   ├── routes/
│   │   └── trades.ts    # REST trade CRUD
│   ├── server.ts        # Fastify + Socket.IO bootstrap
│   ├── seed.ts          # seed script
│   └── types.ts         # Fastify instance decorators
├── drizzle/             # generated SQL migrations (drizzle-kit)
├── drizzle.config.ts
└── Dockerfile
```

## Scripts

- `pnpm --filter backend run dev` — start dev server with hot reload
- `pnpm --filter backend run build` — bundle to `dist/server.js` with esbuild
- `pnpm --filter backend run start` — run the bundled server
- `pnpm --filter backend run db:push` — push schema to the dev DB
- `pnpm --filter backend run db:generate` — generate a SQL migration
- `pnpm --filter backend run db:migrate` — apply migrations
- `pnpm --filter backend run seed` — seed sample trades

## Environment

See `.env.example`. `DATABASE_URL` must point at the Postgres instance.
