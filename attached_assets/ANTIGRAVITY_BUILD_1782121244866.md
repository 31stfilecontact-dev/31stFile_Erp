# 31st File ERP — Antigravity Build Guide

> Use this file as your mission brief inside Google Antigravity 2.0.
> Paste the **Project Context Block** into Antigravity's knowledge base first,
> then run each **Task** in sequence. Each task is self-contained and verifiable.

---

## 1. Connect the repo

1. Open **Antigravity 2.0** → New Project → **Clone from GitHub**
2. Paste your private repo URL and authenticate
3. Set environment (`.env.local`) — copy from `.env.example` and fill in:
   ```
   DATABASE_URL=postgresql://...@...neon.tech/neondb?sslmode=require
   NEXTAUTH_SECRET=<your secret>
   NEXTAUTH_URL=http://localhost:3000
   ```
4. In the terminal panel run: `npm install && npm run dev`
5. Confirm the app opens in the Antigravity browser pane on port 3000

---

## 2. Paste this into Antigravity's Knowledge Base

> Settings → Knowledge → Add Context → paste the block below.
> This gives every agent full schema and route awareness.

```
PROJECT: 31st File ERP
STACK: Next.js 14 App Router, Drizzle ORM, Neon PostgreSQL, Tailwind CSS
LANGUAGE: TypeScript (strict)

DATABASE TABLES (lib/db/schema.ts):
- accounts: id, code(unique), name, group, subGroup, normalBal(DR/CR),
  openingBal, openingBalDrCr, isActive
- entries: id, entryDate, voucherType, voucherNo(unique), narration,
  reference, fiscalYear, sourceType, utrNumber, upiId, status(POSTED/DRAFT)
- entry_lines: id, entryId→entries, accountId→accounts, side(DR/CR), amount, lineNote
- documents: id, entryId→entries, filename, fileUrl, fileSize, fileType
- upi_staging: id, utr, merchant, upiId, amount, txnDate, txnType,
  drAccountId→accounts, crAccountId→accounts, notes, status(PENDING/POSTED),
  postedId→entries

ACCOUNT GROUPS (seeded):
- "Assets"      → subGroups: "Current Assets", "Non-Current Assets"
- "Liabilities" → subGroups: "Current Liabilities", "Equity", "Non-Current"
- "Income"      → subGroups: "Operating", "Other Income"
- "Expenses"    → subGroups: "Employee Costs", "Operating", "Finance", "Depreciation", "COGS"

API ROUTES:
- POST/GET /api/entries       → create/list journal entries
- GET /api/accounts           → list all active accounts
- GET /api/reports/trial-balance?asAt=YYYY-MM-DD
- GET /api/reports/pl?period=ytd|month
- GET /api/reports/balance-sheet?asAt=YYYY-MM-DD

SCREENS (app/(app)/):
dashboard, upi-capture, journal-entry, transactions,
accounts, trial-balance, pl-statement, balance-sheet, notes, settings

ACCOUNTING RULES:
- Every entry MUST balance: sum(DR lines) == sum(CR lines)
- P&L accounts: group="Income" (CR normal) and group="Expenses" (DR normal)
- Balance sheet: group="Assets" (DR normal), group="Liabilities" (CR normal)
- Only entries with status="POSTED" appear in reports
- Bank/cash account code for UPI payments is "1002" (Bank — Current Account)
```

---

## 3. Known bugs — fix these in order

### Bug 1 — CRITICAL: UPI transactions can never be posted
**File:** `lib/utils/upi-parser.ts`

**Problem:** The `UPITxn` interface does not have a `ledgerAccount` field. The UPI
capture page filters `txns.filter(t => t.ledgerAccount)` and uses `t.ledgerAccount`
as the account code when posting — but because the field is not in the interface,
TypeScript strips it and the filter always returns empty. **Post All is always disabled.**

**Antigravity task:**
```
In lib/utils/upi-parser.ts, add an optional field `ledgerAccount?: string`
to the UPITxn interface. Then in app/(app)/upi-capture/page.tsx, find the
transaction list render. Each row needs an account selector dropdown — a
<select> populated from GET /api/accounts filtered to groups "Expenses",
"Income", "Assets". When the user picks an account, update that txn in the
txns state array: setTxns(prev => prev.map(t => t.id === id ? {...t, ledgerAccount: code} : t)).
The Post All button should enable when at least one txn has a ledgerAccount set.
Test: import a CSV, assign an account to one row, confirm Post All becomes active.
```

---

### Bug 2 — CRITICAL: Posted entries silently lose their lines
**File:** `app/api/entries/route.ts` (lines 15–18)

**Problem:** The route looks up each account by `line.accountCode`. If no match
is found it silently does `continue` — the entry is created as POSTED but has
zero `entry_lines`. It will never appear in any report.

```typescript
// CURRENT (broken)
const [acct] = await db.select(...).where(eq(accounts.code, line.accountCode));
if(!acct) continue;  // ← silent skip

// SHOULD BE
if(!acct) {
  // roll back the entry and return a 400
  await db.delete(entries).where(eq(entries.id, entry.id));
  return NextResponse.json(
    { error: `Account code "${line.accountCode}" not found. Entry rolled back.` },
    { status: 400 }
  );
}
```

**Antigravity task:**
```
In app/api/entries/route.ts, replace the `if(!acct) continue` with a proper
rollback. If any line's accountCode is not found in the accounts table:
1. Delete the entry that was just inserted (db.delete(entries).where(eq(entries.id, entry.id)))
2. Return a 400 JSON response with a clear error: "Account code X not found"
Wrap the entire entry + lines insert in a try/catch that also deletes the entry
on any line insert failure. Test: post an entry with a bad account code,
confirm 400 is returned and no orphan entry exists in the database.
```

---

### Bug 3 — HIGH: P&L shows nothing for past fiscal year entries
**File:** `app/api/reports/pl/route.ts` (lines 8–13)

**Problem:** The YTD `from` date is computed as April 1 of the *current* calendar
fiscal year. In June 2026 this resolves to `2026-04-01`. Any entry dated before
April 2026 (i.e., all of FY 2025-26) is outside this range and invisible in P&L.

```typescript
// CURRENT — from is always April 1 of the ongoing year
const from = `${yr}-04-01`;

// SHOULD support a fyYear query param so the user can select which year to view
```

**Antigravity task:**
```
In app/api/reports/pl/route.ts, add a `fy` query param (e.g. "2025-26" or "2026-27").
Parse it to derive the from/to dates:
  - "2025-26" → from = "2025-04-01", to = "2026-03-31"
  - "2026-27" → from = "2026-04-01", to = "2027-03-31" (or today if current year)
  - Default to current fiscal year if no fy param.
Then in app/(app)/pl-statement/page.tsx, add a fiscal year selector dropdown
with options for at least the last 2 fiscal years (2024-25, 2025-26, 2026-27).
Pass the selected fy as ?fy=YYYY-YY to the API call. Test: create one entry
dated 2025-06-01, switch the selector to "2025-26", confirm it appears in P&L.
```

---

### Bug 4 — HIGH: Balance Sheet equity is not live (P&L net profit not flowing in)
**File:** `app/api/reports/balance-sheet/route.ts` (lines 22–30)

**Problem:** The Balance Sheet recomputes income/expenses independently from
account `net` values. But `net = dr - cr` across ALL time, not the current
fiscal year. This means:
- The P&L `netProfit` on the dashboard may show one number
- The Balance Sheet equity section shows a different number
- After year-end, prior year profits accumulate but are never rolled into Retained Earnings

**Antigravity task:**
```
In app/api/reports/balance-sheet/route.ts:
1. Add a `fy` query param identical to the one added in Bug 3's fix.
2. Filter entryLines in getBal() to only include entries within the fiscal year
   date range (same from/to logic as the P&L route).
3. For the equity section, compute netProfit by calling the P&L logic inline:
   sum of Income group CR-DR minus sum of Expenses group DR-CR, scoped to the
   same fy date range.
4. Rename "currentLiabilities" in the JSON response to include long-term
   liabilities as well (subGroup "Non-Current" from Liabilities group).
5. Add "nonCurrentAssets" to the JSON breakdown (subGroup "Non-Current Assets").
Test: post a revenue entry and an expense entry on the same date, load
Balance Sheet for that fy, confirm Assets = Liabilities + Equity and
netProfit matches the P&L screen's figure.
```

---

### Bug 5 — MEDIUM: Voucher numbers hardcode fiscal year "2526"
**File:** `app/api/entries/route.ts` (line 12)

**Problem:** `const voucherNo = \`...-2526-...\`` — the fiscal year suffix is
hardcoded for FY 2025-26. In June 2026 we are in FY 2026-27.

**Antigravity task:**
```
In app/api/entries/route.ts, replace the hardcoded "2526" with a dynamic
fiscal year suffix. Compute it from entryDate:
  - If entryDate month >= April (month 4), fyTag = last 2 digits of year + next 2
  - e.g. 2026-06-01 → "2627", 2025-12-01 → "2526"
Function: const fyTag = (d: string) => { const yr = parseInt(d.slice(0,4)); const mo = parseInt(d.slice(5,7)); return mo >= 4 ? `${String(yr).slice(2)}${String(yr+1).slice(2)}` : `${String(yr-1).slice(2)}${String(yr).slice(2)}`; }
Test: post an entry dated 2026-06-15, confirm voucherNo contains "2627".
```

---

### Bug 6 — MEDIUM: UPI CREDIT transactions post to wrong side
**File:** `app/(app)/upi-capture/page.tsx` (lines 47–51)

**Problem:** All UPI transactions are posted as:
```
DR: ledgerAccount   CR: 1002 (Bank)
```
This is correct for DEBIT (payments going out of bank). But CREDIT transactions
(money coming *into* bank) must be reversed:
```
DR: 1002 (Bank)   CR: ledgerAccount
```

**Antigravity task:**
```
In app/(app)/upi-capture/page.tsx, inside the postAll() function, check t.type:
- If t.type === "DEBIT":  DR ledgerAccount, CR "1002"
- If t.type === "CREDIT": DR "1002", CR ledgerAccount
This affects which side each account appears on. Update the lines array
construction accordingly. Test: import an SMS with "credited" text, assign
an Income account, post it — confirm in Trial Balance that Bank (1002) is
debited and the Income account is credited.
```

---

### Bug 7 — LOW: Entries API does not return lines in GET response
**File:** `app/api/entries/route.ts`

**Problem:** `GET /api/entries` returns the `entries` table rows only — no
`entry_lines`. The Transactions screen cannot show what accounts were hit
per entry, making it impossible to drill into a posted entry.

**Antigravity task:**
```
In app/api/entries/route.ts, update the GET handler to join entry_lines
and accounts. Return each entry with a `lines` array:
[{ side, amount, lineNote, accountCode, accountName }]
Use db.select().from(entries).leftJoin(entryLines, ...).leftJoin(accounts, ...)
ordered by entryDate desc. Group the flat join rows into nested objects by
entry id before returning. Then in app/(app)/transactions/page.tsx, display
an expandable row for each entry showing its DR/CR lines.
```

---

## 4. New features to build next (after bugs are fixed)

Run these tasks once the core accounting flow is verified working.

### Feature A — UPI Auto-Rules
```
Add a "Save Rule" button on each posted UPI transaction in the
transactions screen. Clicking it saves merchant→accountCode to a new
upi_rules table (columns: keyword varchar, accountId uuid→accounts, isActive bool).
On the UPI Capture page, after CSV/SMS parsing, auto-apply rules:
check each txn.merchant against saved rules (case-insensitive contains match),
set ledgerAccount automatically, and mark matchStatus as "MATCHED".
Show MATCHED rows in green. Test: save a rule for merchant "Swiggy" → 4206
(Office Expenses), import a CSV with a Swiggy transaction, confirm it
auto-matches and shows green.
```

### Feature B — Trial Balance export to Excel
```
In app/(app)/trial-balance/page.tsx, add an "Export XLSX" button.
Use the xlsx npm package (already in devDependencies if not, add it).
Client-side only — no server changes needed.
Fetch GET /api/reports/trial-balance, convert the accounts array to an
XLSX workbook with columns: Code, Account Name, Group, DR, CR.
Add a totals row at the bottom. Trigger a file download as
"trial-balance-YYYY-MM-DD.xlsx". Test: click export, open the file in
Excel, confirm totals match what's shown on screen.
```

### Feature C — Dashboard live P&L summary cards
```
The dashboard at app/(app)/dashboard/page.tsx currently shows static cards.
Replace them with live data by fetching:
  - GET /api/reports/pl?period=month  → for current month revenue/expense
  - GET /api/reports/trial-balance     → for cash balance (account 1002 net)
Show 4 cards: "Revenue (MTD)", "Expenses (MTD)", "Net Profit (MTD)", "Bank Balance".
Add a loading skeleton while fetching and an error state if the API fails.
Test: post a sales entry, reload dashboard, confirm Revenue card updates.
```

### Feature D — General Ledger screen
```
Create a new screen at app/(app)/ledger/page.tsx with route /ledger.
Add it to the sidebar in app/(app)/layout.tsx after "Transactions".
The screen shows account-wise transaction history with running balance.
Filters: account selector (dropdown from /api/accounts), from/to dates.
New API route GET /api/reports/ledger?accountId=&from=&to= that returns:
entries joined to entry_lines for the given account, ordered by entryDate,
with a running balance column computed in SQL or in-memory.
Test: select Bank account (1002), confirm each UPI entry appears with
correct running balance.
```

---

## 5. Verification checklist — run after fixing Bugs 1–6

Use Antigravity's browser agent to test the full flow end-to-end:

```
1. Login → confirm redirect to /dashboard
2. Go to Chart of Accounts → confirm 30 accounts are listed
3. Go to Journal Entry → create:
     DR 4201 (Rent Expense)  ₹10,000
     CR 1002 (Bank)          ₹10,000
   narration: "June rent", date: 2026-06-01
   → confirm success toast and voucher number contains "2627"
4. Go to Trial Balance → confirm 4201 shows ₹10,000 DR, 1002 shows ₹10,000 CR
5. Go to P&L → select FY 2026-27 → confirm Rent Expense shows ₹10,000
6. Go to Balance Sheet → confirm Assets = Liabilities + Equity
7. Go to UPI Capture → import a 2-row CSV:
     one DEBIT row, one CREDIT row
   Assign accounts to both rows.
   Click Post All → confirm success.
8. Go to Transactions → confirm both entries are listed with correct sides.
9. Go to P&L again → confirm both entries are reflected.
```

---

## 6. Quick reference — account codes

| Code | Name | Group | Use for |
|------|------|-------|---------|
| 1001 | Cash in Hand | Assets | Cash payments |
| 1002 | Bank — Current Account | Assets | UPI bank account |
| 1003 | Bank — Savings Account | Assets | Savings transfers |
| 2101 | Capital Account | Liabilities/Equity | Owner's capital |
| 3001 | Sales Revenue | Income | Invoiced sales |
| 3002 | Service Income | Income | Service payments |
| 4101 | Salary & Wages | Expenses | Staff payroll |
| 4201 | Rent Expense | Expenses | Office rent |
| 4203 | Professional Fees | Expenses | Consultant fees |
| 4207 | Bank Charges | Expenses | Transaction fees |

---

## 7. If you hit Antigravity rate limits

The free tier has limited daily credits. For intensive fix sessions:
- Use **Claude Sonnet 4.6** as the model (Settings → Model) — it's supported natively and tends to be more precise on TypeScript/Next.js than the default
- Break tasks into one file at a time rather than "fix everything"
- Save progress with git commits between tasks so you can restore if an agent run goes off-track:
  ```bash
  git add -A && git commit -m "fix: Bug 1 — UPI ledgerAccount field"
  ```

For the accounting logic bugs (3, 4), use the **Editor View** and make the changes manually — they are small and surgical, 5–10 lines each.
