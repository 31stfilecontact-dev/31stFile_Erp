---
name: ERP Ledger API
description: How the ledger route resolves accounts and computes running balance
---

The ledger route lives at `artifacts/erp/app/api/accounts/[id]/ledger/route.ts`.

**UUID vs code detection:**
The `[id]` param can be either a UUID or an account code (e.g. `1001`).
Always test with regex before querying — passing a non-UUID string to `eq(accounts.id, ...)` throws a Postgres 22P02 error:
```ts
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = UUID_RE.test(params.id);
.where(isUuid ? eq(accounts.id, params.id) : eq(accounts.code, params.id))
```

**Why:** Drizzle/Neon rejects non-UUID strings for UUID columns at the DB level, not at the ORM level.

**Running balance:**
When a `from` date is given, first sum all lines *before* that date to get the opening balance for the period (i.e. "brought forward"), then run the balance forward through lines in range. Without this, opening balance would always show 0 for filtered date ranges.
