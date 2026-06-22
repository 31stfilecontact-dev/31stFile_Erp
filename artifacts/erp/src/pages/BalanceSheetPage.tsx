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

function Section({ title, color, open = true, children }: { title: string; color: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open}>
      <summary style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer", listStyle: "none", background: "rgba(0,0,0,0.04)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color, textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{title}</span>
        <Icon name="expand_more" size={18} color="#747780" />
      </summary>
      <div style={{ padding: "4px 16px 12px" }}>{children}</div>
    </details>
  );
}

function Row({ label, amount, bold = false }: { label: string; amount: number | string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(196,198,208,0.25)" }}>
      <span style={{ fontSize: 14, color: "#131c2a", fontWeight: bold ? 700 : 400, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: bold ? 700 : 500, color: "#131c2a" }}>
        {typeof amount === "number" ? inr(amount) : amount}
      </span>
    </div>
  );
}

function TotalBar({ label, amount, color = "#1b3a6b" }: { label: string; amount: number; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: color }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{label}</span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 16, fontWeight: 700, color: "white" }}>{inr(amount)}</span>
    </div>
  );
}

export default function BalanceSheetPage() {
  const [asAt, setAsAt] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/balance-sheet?asAt=${asAt}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [asAt]);

  const bs = data || { totalAssets: 0, totalEquityLiabilities: 0, balanced: false, equity: { capital: 0, netProfit: 0, drawings: 0, total: 0 }, currentLiabilities: 0, breakdown: [] };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="account_balance" size={26} color="#00696d" />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", flex: 1 }}>
          Balance Sheet
        </h1>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "#747780", padding: "4px 10px", border: "1px solid #c4c6d0", borderRadius: 8 }}>{asAt}</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="date" value={asAt} onChange={e => setAsAt(e.target.value)}
          style={{ flex: 1, minWidth: 0, padding: "10px 14px", border: "1px solid #c4c6d0", borderRadius: 8, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#131c2a", background: "white", outline: "none" }} />
        <button onClick={() => window.print()} className="btn-ghost" style={{ fontSize: 12 }}>
          <Icon name="print" size={16} /> Print
        </button>
      </div>

      {!loading && (
        <div className="glass-card-sm p-3 flex gap-3" style={{ borderLeft: `4px solid ${bs.balanced ? "#00696d" : "#ba1a1a"}` }}>
          <Icon name={bs.balanced ? "check_circle" : "error"} size={20} color={bs.balanced ? "#00696d" : "#ba1a1a"} />
          <p style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {bs.balanced
              ? `Balance Sheet tallies — Total Assets ${inr(bs.totalAssets)} = Liabilities + Equity ${inr(bs.totalEquityLiabilities)}`
              : "Balance Sheet DOES NOT TALLY — please review your entries"}
          </p>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-12" style={{ textAlign: "center" }}><Icon name="autorenew" size={40} color="#00696d" /></div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(196,198,208,0.3)" }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Equity &amp; Liabilities</h2>
            </div>
            <Section title="EQUITY" color="#00696d" open>
              <Row label="Capital Account" amount={bs.equity?.capital ?? 0} />
              <Row label="Add: Net Profit" amount={bs.equity?.netProfit ?? 0} />
              <Row label="Less: Drawings" amount={-(bs.equity?.drawings ?? 0)} />
              <Row label="Total Equity" amount={bs.equity?.total ?? 0} bold />
            </Section>
            <Section title="CURRENT LIABILITIES" color="#44474f" open={false}>
              <p style={{ fontSize: 13, color: "#747780", padding: "8px 0", fontFamily: "'Plus Jakarta Sans',sans-serif", fontStyle: "italic" }}>
                {(bs.currentLiabilities ?? 0) > 0
                  ? `Trade Payables & Others: ${inr(bs.currentLiabilities)}`
                  : "No current liabilities recorded"}
              </p>
            </Section>
            <TotalBar label="Total" amount={bs.totalEquityLiabilities} />
          </div>

          <div className="glass-card overflow-hidden">
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(196,198,208,0.3)" }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Assets</h2>
            </div>
            <Section title="CURRENT ASSETS" color="#00696d" open>
              {bs.breakdown?.map((item: any, i: number) => (
                <Row key={i} label={item.name} amount={item.amount} />
              ))}
              {bs.breakdown?.length === 0 && (
                <p style={{ fontSize: 13, color: "#747780", padding: "8px 0", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No asset accounts recorded</p>
              )}
              <Row label="Total Current Assets" amount={bs.totalAssets} bold />
            </Section>
            <TotalBar label="Total" amount={bs.totalAssets} color="#00696d" />
          </div>
        </>
      )}
    </div>
  );
}
