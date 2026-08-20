# syntax=docker/dockerfile:1

# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY backend ./backend

RUN pnpm install --frozen-lockfile

# Generate the Prisma client before the build.
RUN pnpm --filter backend run db:generate

# Bundle the backend. node_modules deps are externalized and copied to prod.
RUN pnpm --filter backend run build

# ---- prod stage ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY --from=build /app/backend/dist ./backend/dist

EXPOSE 4000
WORKDIR /app/backend
CMD ["node", "dist/server.js"]
