# @trade-blotter/frontend

React + TypeScript blotter UI.

## Stack

- Vite + React 19
- AG Grid v36 (community) — blotter grid with sorting, filtering, refresh
- shadcn (base-nova) + Tailwind v4 — UI primitives (Button, Input, Select,
  Dialog, Field, Sonner toaster)
- TanStack Query — server state (trade list cache, socket upsert)
- TanStack Form + zod — create/amend forms with validation (Standard Schema
  V1, no adapter)
- Socket.IO client — realtime trade events

## Features

- Blotter grid: all trades, sortable, filterable (typed number/date filters),
  Refresh button
- Create trade form: symbol/side/quantity/price/trader, client validation,
  toasts
- Amend trade dialog: opens from a row action, inlined TanStack form
- Cancel trade: row action with confirmation
- Live updates: socket events upsert into the React Query cache by `id`

## Scripts

- `pnpm --filter frontend run dev` — Vite dev server (http://localhost:5173)
- `pnpm --filter frontend run build` — typecheck + Vite build
- `pnpm --filter frontend run typecheck` — tsc, no emit
- `pnpm --filter frontend run lint` — oxlint

The dev server proxies nothing; it calls the backend at
`http://localhost:4000` directly (see `src/lib/api.ts` and `src/lib/socket.ts`).
