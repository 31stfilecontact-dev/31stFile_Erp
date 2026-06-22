import { useEffect, useState } from "react";
import { Link } from "wouter";
import { inr } from "@/lib/utils/format";

function Icon({ name, size = 22, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats || {
    totalEntries: 0, totalAccounts: 0, cashBalance: 0, bankBalance: 0,
    recentEntries: [], thisMonthExpenses: 0, thisMonthIncome: 0,
  };

  const CARDS = [
    { label: "Cash in Hand", value: s.cashBalance, icon: "payments", color: "#00696d", bg: "rgba(0,105,109,0.10)" },
    { label: "Bank Balance", value: s.bankBalance, icon: "account_balance", color: "#1b3a6b", bg: "rgba(27,58,107,0.10)" },
    { label: "This Month Income", value: s.thisMonthIncome, icon: "trending_up", color: "#00696d", bg: "rgba(0,105,109,0.10)" },
    { label: "This Month Expenses", value: s.thisMonthExpenses, icon: "trending_down", color: "#ba1a1a", bg: "rgba(186,26,26,0.10)" },
  ];

  const QUICK_LINKS = [
    { href: "/journal-entry", icon: "edit_note", label: "New Journal Entry", color: "#1b3a6b" },
    { href: "/upi-capture", icon: "phone_iphone", label: "Import UPI", color: "#00696d" },
    { href: "/accounts", icon: "account_tree", label: "Chart of Accounts", color: "#9C6500" },
    { href: "/trial-balance", icon: "balance", label: "Trial Balance", color: "#1b3a6b" },
    { href: "/pl-statement", icon: "trending_up", label: "P&L Statement", color: "#00696d" },
    { href: "/balance-sheet", icon: "account_balance", label: "Balance Sheet", color: "#9C6500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "#747780", marginTop: 3, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Welcome back · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Link href="/journal-entry">
          <a className="btn-primary" style={{ fontSize: 13 }}>
            <Icon name="add" size={17} color="white" /> New Entry
          </a>
        </Link>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {CARDS.map(c => (
          <div key={c.label} className="glass-card p-5" style={{ borderTop: `3px solid ${c.color}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#747780", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {c.label}
              </p>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={c.icon} size={20} color={c.color} />
              </div>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: c.color, fontFamily: "'JetBrains Mono',monospace", marginTop: 10 }}>
              {loading ? "…" : inr(c.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links + Recent entries */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 20 }}>
        {/* Quick links */}
        <div className="glass-card p-5">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 14 }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_LINKS.map(l => (
              <Link key={l.href} href={l.href}>
                <a style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                  background: "rgba(240,243,255,0.5)", transition: "background 0.15s",
                  color: "#131c2a",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(231,238,255,0.9)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(240,243,255,0.5)")}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${l.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={l.icon} size={17} color={l.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    {l.label}
                  </span>
                  <Icon name="chevron_right" size={16} color="#c4c6d0" style={{ marginLeft: "auto" } as any} />
                </a>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent entries */}
        <div className="glass-card p-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Recent Entries
            </h2>
            <Link href="/transactions">
              <a style={{ fontSize: 12, color: "#00696d", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: "none" }}>
                View all →
              </a>
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Icon name="autorenew" size={36} color="#00696d" />
            </div>
          ) : s.recentEntries?.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Icon name="receipt_long" size={40} color="#c4c6d0" />
              <p style={{ fontSize: 13, color: "#747780", marginTop: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                No entries yet
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {s.recentEntries?.map((e: any) => (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", borderBottom: "1px solid rgba(196,198,208,0.2)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "rgba(231,238,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="receipt" size={18} color="#1b3a6b" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.narration}
                    </p>
                    <p style={{ fontSize: 11, color: "#747780", fontFamily: "'JetBrains Mono',monospace" }}>
                      {e.voucherNo} · {e.entryDate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <div className="glass-card-sm p-4" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="receipt_long" size={20} color="#1b3a6b" />
          <span style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <strong>{s.totalEntries}</strong> total entries
          </span>
        </div>
        <div className="glass-card-sm p-4" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="account_tree" size={20} color="#00696d" />
          <span style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <strong>{s.totalAccounts}</strong> accounts in chart
          </span>
        </div>
      </div>
    </div>
  );
}
