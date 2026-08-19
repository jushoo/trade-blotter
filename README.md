# Trade Blotter

A real-time equity trade blotter for a broker — view, create, amend, and cancel
trades with live updates pushed to the UI.

## Architecture

This is a **pnpm monorepo** with three workspaces:

| Package       | Stack                                            | Description                                   |
| ------------- | ------------------------------------------------ | --------------------------------------------- |
| `frontend`    | React + TypeScript (Vite)                        | Blotter UI; consumes REST + Socket.IO stream  |
| `backend`     | Node.js + Fastify + TypeScript + Socket.IO       | REST API for mutations; emits realtime events |
| `database`    | Prisma + PostgreSQL                              | Schema, migrations, seed scripts             |

### Realtime

Mutations (create / amend / cancel) are submitted over REST for idempotency and
a clean future auth surface. The backend writes to Postgres inside a transaction
and then broadcasts `trade:created` / `trade:amended` / `trade:cancelled`
events over Socket.IO. The frontend keeps its React Query cache in sync from the
socket stream.

### Local execution

Bring up Postgres (and, later, the app services) with Docker Compose:

```bash
pnpm up            # docker compose up -d  (db only for now)
pnpm db:migrate    # apply Prisma migrations
pnpm db:seed       # optional seed data
pnpm dev           # run frontend + backend in parallel
```

See `docker-compose.yml` for the service definitions.

## Project layout

```
trade-blotter/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── frontend/
├── backend/
└── database/
```

## Status

🚧 Scaffolded — package structure, tooling config, and a Postgres compose stub are
in place. Application code (schema, API, UI) will land in subsequent steps.
