import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
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
  Assets: "var(--text-accent)", Liabilities: "var(--text-primary)", Income: "var(--text-accent)",
  Expenses: "#9C6500", Equity: "#5c3d9e",
};

interface Account {
  id: string; code: string; name: string; group: string;
  subGroup: string | null; normalBal: string; isSystem: boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", group: "Assets", subGroup: "", normalBal: "DR" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/accounts")
      .then(r => r.json())
      .then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function createAccount(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create"); return; }
      setShowForm(false);
      setForm({ code: "", name: "", group: "Assets", subGroup: "", normalBal: "DR" });
      load();
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  }

  const groups = ["ALL", ...Array.from(new Set(accounts.map(a => a.group)))];
  const filtered = accounts.filter(a => {
    const matchGroup = groupFilter === "ALL" || a.group === groupFilter;
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  const grouped = filtered.reduce((acc, a) => {
    (acc[a.group] = acc[a.group] || []).push(a);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Chart of Accounts
        </h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ fontSize: 13 }}>
          <Icon name="add" size={16} color="white" /> New Account
        </button>
      </div>

      {/* New account form */}
      {showForm && (
        <div className="glass-card p-5">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 16 }}>
            Add Account
          </h2>
          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-card-border)", borderLeft: "3px solid var(--text-danger)", marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: "var(--text-danger)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{error}</p>
            </div>
          )}
          <form onSubmit={createAccount} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
              <div>
                <label className="label-field">Code</label>
                <input type="text" className="input-mono" placeholder="1001" required
                  value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} />
              </div>
              <div>
                <label className="label-field">Name</label>
                <input type="text" className="input-field" placeholder="Account name" required
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label className="label-field">Group</label>
                <select className="input-field" value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))}>
                  {["Assets", "Liabilities", "Income", "Expenses", "Equity"].map(g => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Sub Group</label>
                <input type="text" className="input-field" placeholder="Optional"
                  value={form.subGroup} onChange={e => setForm(p => ({ ...p, subGroup: e.target.value }))} />
              </div>
              <div>
                <label className="label-field">Normal Balance</label>
                <select className="input-field" value={form.normalBal} onChange={e => setForm(p => ({ ...p, normalBal: e.target.value }))}>
                  <option>DR</option><option>CR</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ fontSize: 13 }}>
                {saving ? "Saving…" : "Create Account"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Icon name="search" size={18} color="var(--text-muted)" style={{ position: "absolute" as any, left: 12, top: "50%", transform: "translateY(-50%)" } as any} />
          <input type="text" className="input-field" style={{ paddingLeft: 38 }}
            placeholder="Search accounts..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {groups.map(g => (
            <button key={g} onClick={() => setGroupFilter(g)}
              style={{
                padding: "8px 14px", borderRadius: 9999, fontSize: 12, fontWeight: 700, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
                background: groupFilter === g ? (GROUP_COLORS[g] || "var(--text-primary)") : "transparent",
                color: groupFilter === g ? "white" : "var(--text-muted)",
                border: groupFilter === g ? "none" : "1px solid var(--input-border)",
              }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Account list */}
      {loading ? (
        <div className="glass-card p-12" style={{ textAlign: "center" }}>
          <Icon name="autorenew" size={40} color="var(--text-accent)" />
        </div>
      ) : (
        Object.entries(grouped).map(([group, accts]) => {
          const color = GROUP_COLORS[group] || "var(--text-primary)";
          return (
            <div key={group} className="glass-card overflow-hidden">
              <div style={{ padding: "12px 16px", background: `${color}12`, borderBottom: `2px solid ${color}` }}>
                <p style={{ fontSize: 11, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {group} · {accts.length}
                </p>
              </div>
              {accts.map((a, i) => (
                <Link key={a.id} href={`/ledger/${a.code}`}>
                  <a style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                    borderBottom: i < accts.length - 1 ? "1px solid rgba(196,198,208,0.18)" : "none",
                    textDecoration: "none", transition: "background 0.12s",
                    background: i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.3)",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-hover-strong)")}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.3)")}>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color,
                      background: `${color}18`, padding: "2px 8px", borderRadius: 6, fontWeight: 600, flexShrink: 0,
                    }}>{a.code}</span>
                    <span style={{ flex: 1, fontSize: 13, color: "var(--text-body)", fontWeight: 500, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      {a.name}
                    </span>
                    {a.subGroup && (
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {a.subGroup}
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 9999, fontWeight: 700,
                      background: a.normalBal === "DR" ? "rgba(157,240,244,0.4)" : "rgba(255,243,214,0.6)",
                      color: a.normalBal === "DR" ? "var(--text-success)" : "#9C6500",
                      fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}>{a.normalBal}</span>
                    <Icon name="chevron_right" size={16} color="var(--input-border)" />
                  </a>
                </Link>
              ))}
            </div>
          );
        })
      )}

      {!loading && filtered.length === 0 && (
        <div className="glass-card p-12" style={{ textAlign: "center" }}>
          <Icon name="account_tree" size={44} color="var(--input-border)" />
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {accounts.length === 0 ? "No accounts yet. Create your first account." : "No accounts match your filter."}
          </p>
        </div>
      )}
    </div>
  );
}
