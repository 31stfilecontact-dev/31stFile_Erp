---
name: ERP shared component pattern
description: Where shared client components live and how VoucherModal is wired
---

Shared React components live in `artifacts/erp/components/`.
Import with the `@/components/` alias (configured in tsconfig paths).

**VoucherModal** (`components/VoucherModal.tsx`):
- Accepts `entryId: string | null` and `onClose: () => void`
- When `entryId` is null, renders nothing
- Fetches from `/api/entries/[id]` which returns full entry + joined lines + account names
- Closes on Escape key or backdrop click
- Used in: Ledger page (row click) and Transactions page (Details button)

**Entry detail API** (`app/api/entries/[id]/route.ts`):
- Joins entryLines → accounts to return account code + name per line
- Returns `balanced: boolean`, `totalDr`, `totalCr`, and `lines[]`
