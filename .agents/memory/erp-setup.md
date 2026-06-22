---
name: ERP app setup
description: Key decisions and quirks for the 31st File ERP migration into the Replit pnpm monorepo
---

## Ports
- API server (`@workspace/api-server`) runs on PORT env (defaults 8080 in Replit).
- ERP frontend (`@workspace/erp`) runs on PORT env (18996 in Replit).
- Vite proxy in `artifacts/erp/vite.config.ts` must target `http://localhost:8080` (not 3001).

## Default credentials
- Admin login: `admin@31stfile.com` / `admin123` (seeded on first API server start via `seed.ts`).

## DB schema import paths
- All api-server routes import from `@workspace/db` (not `@workspace/db/schema/erp` — that sub-path is not exported).
- `lib/db/src/schema/index.ts` re-exports everything from `erp.ts`.

**Why:** esbuild bundler resolves only the paths listed in package.json `exports`; `@workspace/db/schema/erp` is not listed so it fails at build time.

## Auth
- JWT via `jose` stored in httpOnly cookies (`token` cookie).
- bcryptjs for password hashing.
- Seed creates admin user + default chart of accounts (1001=Cash, 1002=Bank, 4999=Miscellaneous).
