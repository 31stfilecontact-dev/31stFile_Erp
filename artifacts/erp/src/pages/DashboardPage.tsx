import { useEffect, useState } from "react";
import { Link } from "wouter";
import { inr } from "@/lib/utils/format";
import { useTheme } from "@/context/ThemeContext";

function Icon({ name, size = 20, color = "", style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit", ...style }}>
      {name}
    </span>
  );
}

function ThemeText({ muted, style, children }: { muted?: boolean; style?: React.CSSProperties; children: React.ReactNode }) {
  return <span style={{ color: muted ? "var(--text-muted)" : "var(--text-body)", ...style }}>{children}</span>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reports/dashboard")
      .then(r => r.ok ? r.json() : null)
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
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Dashboard
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 3, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
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
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
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
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 14 }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {QUICK_LINKS.map(l => (
              <Link key={l.href} href={l.href}>
                <a style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10, textDecoration: "none",
                  background: "var(--bg-hover)", transition: "background 0.15s",
                  color: "var(--text-body)",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover-strong)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "var(--bg-hover)")}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${l.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name={l.icon} size={17} color={l.color} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    {l.label}
                  </span>
                  <Icon name="chevron_right" size={16} color="var(--text-muted)" style={{ marginLeft: "auto" } as any} />
                </a>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent entries */}
        <div className="glass-card p-5">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Recent Entries
            </h2>
            <Link href="/transactions">
              <a style={{ fontSize: 12, color: "var(--text-accent)", fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif", textDecoration: "none" }}>
                View all →
              </a>
            </Link>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Icon name="autorenew" size={36} color="var(--text-accent)" />
            </div>
          ) : s.recentEntries?.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Icon name="receipt_long" size={40} color="var(--text-muted)" />
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                No entries yet
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {s.recentEntries?.map((e: any) => (
                <div key={e.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 0", borderBottom: "1px solid var(--bg-card-border)",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: "var(--bg-icon)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name="receipt" size={18} color="var(--text-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.narration}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono',monospace" }}>
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
          <Icon name="receipt_long" size={20} color="var(--text-primary)" />
          <span style={{ fontSize: 13, color: "var(--text-muted-2)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <strong>{s.totalEntries}</strong> total entries
          </span>
        </div>
        <div className="glass-card-sm p-4" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name="account_tree" size={20} color="var(--text-accent)" />
          <span style={{ fontSize: 13, color: "var(--text-muted-2)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <strong>{s.totalAccounts}</strong> accounts in chart
          </span>
        </div>
      </div>
    </div>
  );
}
