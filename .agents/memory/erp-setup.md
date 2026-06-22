---
name: ERP app setup
description: Key decisions and quirks for the 31st File ERP migration into the Replit pnpm monorepo
---

## Ports
- API server (`@workspace/api-server`) runs on PORT env (defaults 8080 in Replit).
- ERP frontend (`@workspace/erp`) runs on PORT env (18996 in Replit).
- Vite proxy in `artifacts/erp/vite.config.ts` must target `http://localhost:8080` (not 3001).

## Environment variables required
- `SESSION_SECRET` — **required at startup**, no fallback. Server throws if missing. Set via Replit Secrets.
- `DATABASE_URL` — PostgreSQL connection string.

**Why:** Falling back to a hardcoded JWT secret makes all sessions forgeable if env is misconfigured.

## DB schema import paths
- All api-server routes import from `@workspace/db` (not `@workspace/db/schema/erp` — that sub-path is not exported).
- `lib/db/src/schema/index.ts` re-exports everything from `erp.ts`.

**Why:** esbuild bundler resolves only paths listed in package.json `exports`.

## Auth middleware
- `requireAuth` is exported from `routes/auth.ts` and applied to ALL protected routes (accounts, entries, reports, upi).
- Public routes (auth/login, auth/logout, auth/me) do not use `requireAuth`.
- JWT stored in httpOnly `erp_token` cookie; `secure: true` in production.

## Voucher number format
- Dynamic fyTag from entryDate: month >= 4 → startYr = year, else startYr = year-1.
- Format: `PAY-2627-0001`. Never hardcode the year.

## UPI staging flow
- Parse SMS/CSV → staged locally with StagedTxn (extends UPITxn + accountId, selected flag).
- Auto-rules: `GET/POST/DELETE /api/upi/rules` — keyword (lowercase contains match) → accountId.
- Posting: `POST /api/entries/upi-batch` with selected txns that have accountId assigned.
- DEBIT: DR ledgerAccount, CR Bank (1002). CREDIT: DR Bank (1002), CR ledgerAccount.

## P&L fiscal year param
- `GET /api/reports/pl?fy=YYYY-YY&period=ytd` — parses to from/to dates.
- Balance sheet uses fy-scoped net profit in equity section via `computeNetProfit(from, to)`.
- Default: current FY (April 1 of current year to March 31 next year).
