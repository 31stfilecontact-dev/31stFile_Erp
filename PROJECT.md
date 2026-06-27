# PROJECT.md — Indian ERP Build

## Architecture

**Monorepo**: pnpm workspaces
- `lib/db/` — Drizzle ORM + PostgreSQL schema package (`@workspace/db`)
- `artifacts/api-server/` — Express 5 API server (`@workspace/api-server`)
- `artifacts/erp/` — React 19 + Vite frontend (`@workspace/erp`)

**Key patterns**:
- DB: `import { db } from "@workspace/db"; import { tableName } from "@workspace/db";`
- Auth: `import { requireAuth } from "./auth";` — reads JWT cookie, sets `(req as any).userId`
- CSS: CSS variables from index.css only — NO hardcoded hex colors in new pages
- Icons: `<span className="material-symbols-outlined">{iconName}</span>` (or Icon component as used in existing pages)
- API: native `fetch("/api/...")` from frontend
- Routing: `wouter` — add routes to `artifacts/erp/src/App.tsx`
- Sidebar: Add nav items to `NAV_ITEMS` in `artifacts/erp/src/components/Layout.tsx`
- New routers: register in `artifacts/api-server/src/routes/index.ts`

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1A | Codebase Read | Explore existing codebase | none | DONE |
| M1B | Schema Extensions | lib/db/src/schema/erp.ts | M1A | IN_PROGRESS |
| M1C | Schema Push | pnpm --filter @workspace/db run push | M1B | PENDING |
| M1D | Seed Data | artifacts/api-server/src/lib/seed.ts | M1C | PENDING |
| M2A | Vendor API | artifacts/api-server/src/routes/vendors.ts | M1C | PENDING |
| M2B | Masters API | artifacts/api-server/src/routes/masters.ts | M1C | PENDING |
| M2C | Enhanced Entries | artifacts/api-server/src/routes/entries.ts | M1C | PENDING |
| M2D | UPI Approval Queue | artifacts/api-server/src/routes/upi.ts | M1C | PENDING |
| M2E | Report Endpoints | artifacts/api-server/src/routes/reports.ts | M1C | PENDING |
| M3A | VendorsPage | artifacts/erp/src/pages/VendorsPage.tsx | M2A | PENDING |
| M3B | MastersPage | artifacts/erp/src/pages/MastersPage.tsx | M2B | PENDING |
| M3C | UPICapturePage+ | artifacts/erp/src/pages/UPICapturePage.tsx | M2D | PENDING |
| M3D | JournalEntryPage+ | artifacts/erp/src/pages/JournalEntryPage.tsx | M2C | PENDING |
| M3E | ImportPage | artifacts/erp/src/pages/ImportPage.tsx | M2D | PENDING |
| M3F | Export + Reports | xlsx+jspdf, GSTSummaryPage, TDSSummaryPage | M2E | PENDING |
| M3G | RBAC | useUser hook, RoleGuard, auth routes, SettingsPage | M2A | PENDING |
| M3H | Dashboard+ | DashboardPage.tsx enhancements | M2E | PENDING |
| M4A | TS Typecheck | pnpm run typecheck | M3* | PENDING |
| M4B | Fix TS errors | all TS errors fixed | M4A | PENDING |
| M4C | Git commit | git add -A && git commit && git push | M4B | PENDING |

## Interface Contracts

### DB Schema — New Tables (to add to lib/db/src/schema/erp.ts)

```typescript
// vendors table
vendors: id(text PK), name(text NOT NULL), email(text), phone(text),
  gstin(text), pan(text), address(text), state(text), pincode(text),
  bankAccount(text), ifsc(text), upiId(text), type(text default "vendor"),
  notes(text), isActive(boolean default true), createdAt(timestamp), createdBy(text)

// hsnCodes table
hsnCodes: id(text PK), code(text NOT NULL UNIQUE), description(text NOT NULL),
  gstRate(numeric(5,2) NOT NULL), category(text), createdAt(timestamp)

// tdsSections table
tdsSections: id(text PK), section(text NOT NULL UNIQUE), description(text NOT NULL),
  rate(numeric(5,2) NOT NULL), threshold(numeric(18,2) default 0),
  createdAt(timestamp)

// gstLines table
gstLines: id(text PK), entryId(text FK→entries.id cascade),
  hsnId(text FK→hsnCodes.id), taxableAmount(numeric(18,2)),
  cgstRate(numeric(5,2)), cgstAmount(numeric(18,2)),
  sgstRate(numeric(5,2)), sgstAmount(numeric(18,2)),
  igstRate(numeric(5,2)), igstAmount(numeric(18,2)),
  invoiceNo(text), invoiceDate(text), createdAt(timestamp)

// tdsDeductions table
tdsDeductions: id(text PK), entryId(text FK→entries.id cascade),
  sectionId(text FK→tdsSections.id), vendorId(text FK→vendors.id),
  taxableAmount(numeric(18,2)), tdsRate(numeric(5,2)),
  tdsAmount(numeric(18,2)), createdAt(timestamp)

// Modify entries table (add columns):
vendorId(text FK→vendors.id nullable)
invoiceNo(text nullable)
invoiceDate(text nullable)

// Modify upiStaging table (add columns):
pendingApproval(boolean default false)
approvedAt(timestamp nullable)
approvedBy(text nullable)
rejectedAt(timestamp nullable)
rejectionReason(text nullable)
```

### Auth Pattern
- JWT in cookie named `erp_token`
- `requireAuth` exported from `artifacts/api-server/src/routes/auth.ts`
- After auth: `(req as any).userId` is set to the user's ID
- User roles stored in `users.role` column (text: "admin" or "user")

### API URL Conventions
- All routes: `/api/[resource]`
- Auth: `/api/auth/me`, `/api/auth/login`, `/api/auth/logout`
- New: `/api/vendors`, `/api/masters/hsn`, `/api/masters/tds`, `/api/upi/staging`, `/api/reports/gst-summary`, `/api/reports/tds-summary`

## Code Layout

```
lib/
  db/
    src/
      schema/
        erp.ts          ← ONLY schema file to modify
        index.ts        ← re-exports erp.ts
      index.ts          ← exports db, pool, and * from schema

artifacts/
  api-server/
    src/
      app.ts            ← Express app
      index.ts          ← server startup (calls seedIfNeeded)
      lib/
        seed.ts         ← seedIfNeeded() function — add HSN/TDS seeds here
        logger.ts
      routes/
        index.ts        ← register ALL routers here
        auth.ts         ← requireAuth middleware exported here
        accounts.ts
        entries.ts      ← EXTEND for GST/TDS
        reports.ts      ← EXTEND for GST/TDS summary
        upi.ts          ← EXTEND for staging approval queue
        vendors.ts      ← NEW
        masters.ts      ← NEW
  erp/
    src/
      App.tsx           ← Add new page routes here
      index.css         ← DO NOT MODIFY — use existing CSS vars
      components/
        Layout.tsx      ← Add new NAV_ITEMS here
      pages/
        DashboardPage.tsx     ← EXTEND
        JournalEntryPage.tsx  ← EXTEND
        UPICapturePage.tsx    ← EXTEND
        SettingsPage.tsx      ← EXTEND (add Users tab)
        VendorsPage.tsx       ← NEW
        MastersPage.tsx       ← NEW
        ImportPage.tsx        ← NEW
        GSTSummaryPage.tsx    ← NEW
        TDSSummaryPage.tsx    ← NEW
      lib/
        utils/
          format.ts     ← inr(), fmtDate(), fyDates() — can import these
          export.ts     ← NEW — xlsx + jspdf export utility
      hooks/
        useUser.ts      ← NEW — returns current user with role
```

## CSS Variables Reference
```
--bg-body, --bg-card, --bg-card-border, --bg-card-shadow
--bg-hover, --bg-hover-strong, --bg-icon
--bg-chip, --bg-chip-s
--bg-input, --bg-input-hover
--bg-toggle
--bg-sidebar, --bg-sidebar-top, --bg-sidebar-border
--bg-sidebar-nav, --bg-sidebar-nav-border, --bg-sidebar-nav-inactive
--text-body, --text-muted, --text-muted-2, --text-accent
--text-primary, --text-danger, --text-success
--input-border, --placeholder
--badge-bg, --badge-text
--glass-shadow, --glass-shadow-sm
```

## CSS Classes Reference (from index.css)
```
.glass-card       — main card style
.glass-card-sm    — smaller card
.btn-primary      — teal gradient button
.btn-outline      — outline button
.btn-ghost        — ghost button
.label-field      — form label
.input-field      — form input
.input-mono       — monospace form input
.chip-neutral     — status chip
.chip-success     — success chip
.fin-row, .fin-label, .fin-value — financial rows
.space-y-3/4/5/6, .p-3/4/5/6/12 — utilities
```

## Package Notes
- `xlsx` and `jspdf` are NOT installed — must install before use:
  `pnpm --filter @workspace/erp add xlsx jspdf`
- `@tanstack/react-query` is available in erp
- `recharts` is available in erp
- `wouter` for routing (v3): `import { Switch, Route, useLocation, Link } from "wouter"`
