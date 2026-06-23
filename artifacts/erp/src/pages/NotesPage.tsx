import { useTheme } from "@/context/ThemeContext";
import { useState } from "react";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const NOTES = [
  { no: 1, title: "Significant Accounting Policies", content: `(a) Basis of Accounting: These financial statements are prepared under the historical cost convention on accrual basis of accounting in accordance with generally accepted accounting principles in India.\n\n(b) Revenue Recognition: Revenue is recognised on accrual basis. Sales are recognised on dispatch of goods/provision of services.\n\n(c) Fixed Assets: Fixed assets are stated at cost of acquisition inclusive of inward freight, duties and taxes less accumulated depreciation.\n\n(d) Depreciation: Depreciation on fixed assets is provided on the Written Down Value method at the rates prescribed under Schedule II to the Companies Act, 2013.\n\n(e) Inventories: Inventories are valued at lower of cost and net realisable value. Cost is determined using FIFO method.\n\n(f) Cash and Cash Equivalents: Cash and cash equivalents include cash on hand and balances with banks on current accounts.` },
  { no: 2, title: "Share Capital", content: "Authorised Capital: As per Memorandum of Association\nIssued and Paid-up Capital: As reflected in the Capital Account / Share Capital account in the Chart of Accounts." },
  { no: 3, title: "Reserves and Surplus", content: "Opening Balance: As at the beginning of the financial year\nAdd: Net Profit for the year (as per Profit & Loss Account)\nLess: Drawings/Dividends declared during the year\nClosing Balance: As reflected in the Balance Sheet" },
  { no: 4, title: "Trade Payables", content: "Trade payables represent amounts outstanding for goods purchased and services availed in the normal course of business. These are non-interest bearing and are normally settled within 30–90 days." },
  { no: 5, title: "Trade Receivables", content: "Trade receivables are non-interest bearing and are generally on 30–60 days credit terms. The carrying value of trade receivables represents their fair value. Provision for doubtful debts is made where recovery is uncertain." },
  { no: 6, title: "Cash and Bank Balances", content: "Cash in hand and balances with banks as reflected in the respective ledger accounts. Balances are subject to confirmation and reconciliation." },
  { no: 7, title: "Contingent Liabilities", content: "There are no contingent liabilities as at the date of the Balance Sheet, except as may be disclosed separately." },
  { no: 8, title: "Related Party Transactions", content: "Transactions with related parties, if any, are carried out at arm's length prices and are disclosed as required under applicable accounting standards." },
];

export default function NotesPage() {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-icon)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="description" size={24} color="var(--text-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Notes to Accounts
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Forming part of the Financial Statements
          </p>
        </div>
        <button onClick={() => window.print()} style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", marginLeft: "auto" }}>
          <Icon name="print" size={22} />
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {NOTES.map(note => (
          <div key={note.no} className="glass-card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === note.no ? null : note.no)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: expanded === note.no ? "var(--text-primary)" : "var(--bg-icon)",
                color: expanded === note.no ? "white" : "var(--text-primary)",
                fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700,
              }}>{note.no}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {note.title}
              </span>
              <Icon name="expand_more" size={18} color="var(--text-muted)"
                style={{ transform: expanded === note.no ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" } as any} />
            </button>
            {expanded === note.no && (
              <div style={{ padding: "0 16px 16px 60px" }}>
                <p style={{ fontSize: 13, color: "var(--text-muted-2)", lineHeight: 1.7, fontFamily: "'Plus Jakarta Sans',sans-serif", whiteSpace: "pre-line" }}>
                  {note.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
