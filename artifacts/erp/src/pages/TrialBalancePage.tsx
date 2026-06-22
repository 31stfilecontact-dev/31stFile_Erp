import { useEffect, useState } from "react";
import { inr } from "@/lib/utils/format";
import { Link } from "wouter";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const GROUP_COLORS: Record<string, string> = {
  Assets: "#00696d", Liabilities: "#1b3a6b", Income: "#00696d", Expenses: "#9C6500", Equity: "#5c3d9e",
};

export default function TrialBalancePage() {
  const [asAt, setAsAt] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hideZero, setHideZero] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/trial-balance?asAt=${asAt}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [asAt]);

  const tb = data || { rows: [], totalDr: 0, totalCr: 0, balanced: false };
  const rows = hideZero ? tb.rows?.filter((r: any) => r.dr > 0 || r.cr > 0) : tb.rows;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="balance" size={26} color="#1b3a6b" />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", flex: 1 }}>
          Trial Balance
        </h1>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label className="label-field">As At</label>
          <input type="date" className="input-field" value={asAt} onChange={e => setAsAt(e.target.value)} />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif", cursor: "pointer", marginTop: 20 }}>
          <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} />
          Hide zero-balance accounts
        </label>
        <button onClick={() => window.print()} className="btn-ghost" style={{ fontSize: 12, marginTop: 20 }}>
          <Icon name="print" size={16} /> Print
        </button>
      </div>

      {/* Balance check */}
      {!loading && (
        <div className="glass-card-sm p-3 flex gap-3" style={{ borderLeft: `4px solid ${tb.balanced ? "#00696d" : "#ba1a1a"}` }}>
          <Icon name={tb.balanced ? "check_circle" : "error"} size={20} color={tb.balanced ? "#00696d" : "#ba1a1a"} />
          <p style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {tb.balanced
              ? `Trial Balance tallies — DR ${inr(tb.totalDr)} = CR ${inr(tb.totalCr)}`
              : `Trial Balance does NOT tally — DR: ${inr(tb.totalDr)}, CR: ${inr(tb.totalCr)}`}
          </p>
        </div>
      )}

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px 140px", gap: 8, padding: "10px 16px", background: "#1b3a6b" }}>
          {["Code", "Account Name", "Debit (₹)", "Credit (₹)"].map((h, i) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: i >= 2 ? "right" : "left" }}>{h}</p>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Icon name="autorenew" size={40} color="#00696d" /></div>
        ) : rows?.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Icon name="balance" size={44} color="#c4c6d0" />
            <p style={{ fontSize: 14, color: "#747780", marginTop: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No data yet.</p>
          </div>
        ) : (
          rows?.map((row: any, i: number) => {
            const color = GROUP_COLORS[row.group] || "#44474f";
            return (
              <Link key={row.accountId} href={`/ledger/${row.code}`}>
                <a style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px 140px", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(196,198,208,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.28)", textDecoration: "none", transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(231,238,255,0.6)")}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.28)")}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color, background: `${color}18`, padding: "2px 8px", borderRadius: 6, fontWeight: 600, display: "inline-block", alignSelf: "center" }}>{row.code}</span>
                  <div>
                    <p style={{ fontSize: 13, color: "#131c2a", fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{row.name}</p>
                    <p style={{ fontSize: 10, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{row.group}{row.subGroup ? ` › ${row.subGroup}` : ""}</p>
                  </div>
                  <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: row.dr > 0 ? "#9C6500" : "#c4c6d0", fontWeight: row.dr > 0 ? 600 : 400 }}>{row.dr > 0 ? inr(row.dr) : "—"}</p>
                  <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: row.cr > 0 ? "#00696d" : "#c4c6d0", fontWeight: row.cr > 0 ? 600 : 400 }}>{row.cr > 0 ? inr(row.cr) : "—"}</p>
                </a>
              </Link>
            );
          })
        )}

        {/* Totals */}
        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 140px 140px", gap: 8, padding: "14px 16px", background: "#1b3a6b", borderTop: "2px solid rgba(255,255,255,0.15)" }}>
            <span style={{ gridColumn: "1 / 3", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL</span>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "white", fontWeight: 700 }}>{inr(tb.totalDr)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "white", fontWeight: 700 }}>{inr(tb.totalCr)}</p>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/pl-statement"><a className="btn-outline" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}><Icon name="trending_up" size={16} /> P&L Statement</a></Link>
        <Link href="/balance-sheet"><a className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}><Icon name="account_balance" size={16} /> Balance Sheet</a></Link>
      </div>
    </div>
  );
}
