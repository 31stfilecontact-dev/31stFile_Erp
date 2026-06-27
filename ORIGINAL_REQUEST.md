# Original User Request

## Initial Request — 2026-06-27T18:57:43+05:30

Build a complete, functional Indian accounting ERP web application. This is a real production codebase — NOT a demo. Every feature must be fully implemented, tested for correctness, and committed.

Working directory: c:\Users\Admin\OneDrive\Desktop\Antigrativy website\0.31st file erp
Integrity mode: development

---

## CODEBASE OVERVIEW

This is a pnpm monorepo with:
- `lib/db/src/schema/erp.ts` — Drizzle ORM schema (PostgreSQL)
- `artifacts/api-server/src/` — Express 5 API server
  - `routes/entries.ts` — Journal entries + UPI batch post
  - `routes/accounts.ts` — Chart of accounts CRUD  
  - `routes/reports.ts` — Trial balance, P&L, balance sheet, dashboard
  - `routes/upi.ts` — UPI rules + accounts
  - `routes/auth.ts` — Login/session/auth middleware
- `artifacts/erp/src/` — React 19 + Vite frontend
  - `pages/` — UPICapturePage, JournalEntryPage, AccountsPage, DashboardPage, TrialBalancePage, PLStatementPage, BalanceSheetPage, LedgerPage, SettingsPage, etc.
  - `components/Layout.tsx` — Main layout with sidebar nav
  - `index.css` — Custom CSS variables + utility classes
- `lib/api-spec/openapi.yaml` — OpenAPI spec

IMPORTANT: Read the existing files before making changes. The project uses:
- TypeScript 5.9, pnpm workspaces, Node.js 24
- Express 5, Drizzle ORM + PostgreSQL, Zod validation
- React 19, Vite 7, Wouter (routing), TanStack Query, Tailwind CSS 4
- CSS variables for theming (see index.css — use `var(--text-accent)`, `var(--bg-card-border)`, etc.)
- Material Symbols Outlined icons (already loaded via CDN in index.html)
- Plus Jakarta Sans + JetBrains Mono fonts (already loaded)

---

## REQUIREMENTS

### R1. Database Schema Extensions
Extend `lib/db/src/schema/erp.ts` with new tables: vendors, hsnCodes, tdsSections, gstLines, tdsDeductions.
Modify existing entries table (add vendorId, invoiceNo, invoiceDate).
Modify upiStaging table (add pendingApproval, approvedAt, approvedBy, rejectedAt, rejectionReason).
After editing schema run: `pnpm --filter @workspace/db run push`

### R2. Seed Data
Create `artifacts/api-server/src/lib/seed.ts` with seedIfEmpty() for 15+ HSN codes and 12 TDS sections.

### R3. API Routes — Vendor Master
Create `artifacts/api-server/src/routes/vendors.ts` (CRUD + search + recommendations).

### R4. API Routes — Masters (HSN + TDS)
Create `artifacts/api-server/src/routes/masters.ts`.

### R5. API Routes — Enhanced Entries with GST/TDS
Extend entries.ts to accept gst and tds objects, saving to gstLines and tdsDeductions tables.

### R6. API Routes — UPI Approval Queue
Extend upi.ts with staging CRUD, approve/reject, bulk approval.

### R7. API Routes — Report Exports
Add GST summary and TDS summary reports to reports.ts.

### R8. Frontend — Vendor Master Page
Create VendorsPage.tsx with slide-over panel, add to routes and sidebar.

### R9. Frontend — HSN & TDS Master Pages
Create MastersPage.tsx with tabbed view, add to routes and sidebar.

### R10. Frontend — Enhanced UPI Capture with Approval Queue
Modify UPICapturePage.tsx: add 4th "Pending Approval" tab, persist staging to DB.

### R11. Frontend — Enhanced Journal Entry with GST/TDS
Modify JournalEntryPage.tsx: add vendor autocomplete, GST section, TDS section, invoice fields.

### R12. Frontend — Bank Statement CSV Import Page
Create ImportPage.tsx: 3-step wizard (upload → column mapping → preview & post).

### R13. Frontend — PDF + Excel Export
Install xlsx + jspdf. Add export utility. Add export buttons to report pages.
Create GSTSummaryPage.tsx and TDSSummaryPage.tsx.

### R14. Frontend — Role-Based Access Control
Extend auth routes. Add useUser() hook, RoleGuard component. Update Layout.tsx nav.
Add Users tab to SettingsPage.tsx.

### R15. Dashboard Enhancements
Add widgets: Pending UPI Approvals, GST Liability, TDS Payable, Recent Vendors.

---

## ACCEPTANCE CRITERIA (abbreviated)
- All 5 new DB tables created
- Vendor CRUD + search + recommendations working
- UPI approval queue with batch approve/reject
- GST/TDS data saved on journal entry
- CSV import → pending queue
- Report exports to Excel and PDF
- RBAC enforced at API and UI level
- TypeScript compiles clean
- Git committed and pushed

---

## IMPLEMENTATION NOTES
1. Read existing files before editing.
2. CSS: use existing CSS variables only.
3. Icons: Material Symbols Outlined.
4. API calls: native fetch() as existing pages do.
5. Schema push: run pnpm --filter @workspace/db run push after schema edit.
6. Register new routers in artifacts/api-server/src/routes/index.ts.
7. Add new pages to Layout.tsx sidebar.
8. TypeScript strict mode on.
9. All journal entries must balance (DR = CR).
10. Git commit and push to origin/main when done.
