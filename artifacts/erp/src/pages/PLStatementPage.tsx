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

function currentFy() {
  const now = new Date();
  const yr = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${yr}-${String(yr + 1).slice(2)}`;
}

function fyOptions() {
  const yr = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  return [yr - 2, yr - 1, yr, yr + 1].map(y => ({
    value: `${y}-${String(y + 1).slice(2)}`,
    label: `FY ${y}-${String(y + 1).slice(2)}`,
  }));
}

export default function PLStatementPage() {
  const [period, setPeriod] = useState<"month" | "ytd">("ytd");
  const [fy, setFy] = useState(currentFy());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ period });
    if (period === "ytd") params.set("fy", fy);
    fetch(`/api/reports/pl?${params}`)
      .then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, [period, fy]);

  const pl = data || { income: [], expenses: [], grossIncome: 0, totalExpenses: 0, netProfit: 0 };
  const isProfit = pl.netProfit >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,105,109,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="trending_up" size={24} color="#00696d" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Profit &amp; Loss Statement
          </h1>
          <p style={{ fontSize: 12, color: "#747780", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {data?.from && data?.to ? `${data.from} to ${data.to}` : "Loading…"}
          </p>
        </div>
        <button onClick={() => window.print()} style={{ padding: 8, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "#747780" }}>
          <Icon name="print" size={22} />
        </button>
      </div>

      {/* Period & FY controls */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {([["month", "This Month"], ["ytd", "Full Year"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              style={{ padding: "7px 16px", borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s", background: period === v ? "#00696d" : "transparent", color: period === v ? "white" : "#747780", border: period === v ? "none" : "1px solid #c4c6d0" }}>
              {l}
            </button>
          ))}
        </div>
        {period === "ytd" && (
          <select className="input-field" style={{ fontSize: 13, width: "auto", minWidth: 140 }} value={fy} onChange={e => setFy(e.target.value)}>
            {fyOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="glass-card p-12" style={{ textAlign: "center" }}>
          <Icon name="autorenew" size={40} color="#00696d" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {/* Income */}
          <div style={{ padding: 16, borderLeft: "4px solid #00696d" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#44474f", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>INCOME</p>
            {pl.income?.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(196,198,208,0.2)" }}>
                <span style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: "#00696d" }}>{inr(item.amount)}</span>
              </div>
            ))}
            {pl.income?.length === 0 && (
              <p style={{ fontSize: 13, color: "#747780", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No income recorded for this period</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 8, borderTop: "1px solid rgba(0,105,109,0.2)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#00696d", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>GROSS INCOME</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: "#00696d" }}>{inr(pl.grossIncome)}</span>
            </div>
          </div>

          {/* Expenses */}
          <div style={{ padding: 16, borderLeft: "4px solid #1b3a6b" }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "#44474f", textTransform: "uppercase", marginBottom: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>EXPENSES</p>
            {pl.expenses?.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(196,198,208,0.2)" }}>
                <span style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, color: item.amount > 0 ? "#ba1a1a" : "#747780" }}>{inr(item.amount)}</span>
              </div>
            ))}
            {pl.expenses?.length === 0 && (
              <p style={{ fontSize: 13, color: "#747780", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No expenses recorded for this period</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 8, borderTop: "1px solid rgba(27,58,107,0.2)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", color: "#1b3a6b", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL EXPENSES</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: "#ba1a1a" }}>{inr(pl.totalExpenses)}</span>
            </div>
          </div>

          {/* Net Profit */}
          <div style={{ padding: 20, background: isProfit ? "#00696d" : "#ba1a1a" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.70)", textTransform: "uppercase", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {isProfit ? "NET PROFIT" : "NET LOSS"}
            </p>
            <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: "white", textAlign: "right", marginTop: 8 }}>
              {inr(Math.abs(pl.netProfit))}
            </p>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <Link href="/balance-sheet"><a className="btn-outline" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}><Icon name="account_balance" size={16} /> Balance Sheet</a></Link>
        <Link href="/notes"><a className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 12 }}><Icon name="description" size={16} /> Notes to Accounts</a></Link>
      </div>
    </div>
  );
}
