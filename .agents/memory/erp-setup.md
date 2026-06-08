---
name: ERP Next.js Setup
description: Key decisions and quirks from setting up the 31st File ERP Next.js app in this monorepo.
---

## Key decisions

**Neon → standard pg:**  
The original app used `@neondatabase/serverless` + `drizzle-orm/neon-http`. Replaced with `pg` + `drizzle-orm/node-postgres` to work with Replit's built-in PostgreSQL. `lib/db/index.ts` uses `Pool` from `pg`.

**Why:** Replit-managed DATABASE_URL is a standard PostgreSQL connection string — Neon's serverless driver requires Neon-specific WebSocket transport.

**next version:** Use `14.2.35` (not `14.2.3` — that specific tarball is blocked by Replit's package firewall). The app is App Router, compatible with 14.x.

**drizzle-kit version:** Use `^0.31.10` (workspace standard). Older `0.21.x` has a `es5-ext` transitive dependency blocked by Replit firewall. `drizzle.config.ts` must use `dialect: "postgresql"` + `dbCredentials: { url: }` (not old `driver: "pg"` format).

**Schema was created via executeSql directly** (not `drizzle-kit push`) because the workflow wasn't running yet when schema needed to be set up.

**How to apply:** Any future schema changes: run `pnpm --filter @workspace/erp run db:push` after the workflow is running.
