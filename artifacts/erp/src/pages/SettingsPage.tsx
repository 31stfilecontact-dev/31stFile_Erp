import { useTheme } from "@/context/ThemeContext";
import { useState, useEffect, type CSSProperties } from "react";

function Icon({ name, size = 20, color = "", style }: { name: string; size?: number; color?: string; style?: CSSProperties }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit", ...style }}>
      {name}
    </span>
  );
}

const TABS = [
  { id: "company", label: "Company", icon: "business" },
  { id: "accounts", label: "Accounts", icon: "account_tree" },
  { id: "upi", label: "UPI Rules", icon: "phone_iphone" },
  { id: "users", label: "Team", icon: "group" },
  { id: "export", label: "Export", icon: "download" },
  { id: "security", label: "Security", icon: "lock" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState({ name: "My Company", pan: "", gstin: "", address: "", state: "", fy: "2025-26", type: "Proprietorship" });
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "accountant" });
  const [rules, setRules] = useState([
    { keyword: "rent", account: "Rent Expense", active: true },
    { keyword: "salary", account: "Salary & Wages", active: true },
    { keyword: "epfo", account: "PF Contribution", active: true },
  ]);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    if (tab === "users") {
      fetch("/api/users").then(r => r.ok ? r.json() : null).then(d => d && setUsers(d)).catch(() => {});
    }
  }, [tab]);

  function saveCompany() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        const u = await res.json();
        setUsers(p => [...p, u]);
        setNewUser({ name: "", email: "", password: "", role: "accountant" });
      }
    } catch {}
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwMsg(null);
    if (pwForm.next !== pwForm.confirm) { setPwMsg({ ok: false, text: "New passwords do not match." }); return; }
    if (pwForm.next.length < 8) { setPwMsg({ ok: false, text: "Password must be at least 8 characters." }); return; }
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }) });
      const data = await res.json();
      if (res.ok) { setPwMsg({ ok: true, text: "Password changed successfully." }); setPwForm({ current: "", next: "", confirm: "" }); }
      else { setPwMsg({ ok: false, text: data.error ?? "Failed to change password." }); }
    } catch { setPwMsg({ ok: false, text: "Network error. Please try again." }); }
    finally { setPwLoading(false); }
  }

  function PwInput({ field, label, placeholder }: { field: "current" | "next" | "confirm"; label: string; placeholder: string }) {
    return (
      <div>
        <label className="label-field">{label}</label>
        <div style={{ position: "relative" }}>
          <input type={showPw[field] ? "text" : "password"} required className="input-field" style={{ paddingRight: 44 }} placeholder={placeholder}
            value={pwForm[field]} onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))} />
          <button type="button" onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Icon name={showPw[field] ? "visibility_off" : "visibility"} size={18} color="var(--text-muted)" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Settings</h1>

      <div style={{ display: "flex", gap: 2, background: "var(--bg-hover)", borderRadius: 12, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: tab === t.id ? "white" : "transparent", boxShadow: tab === t.id ? "0 2px 8px var(--bg-icon)" : "none", color: tab === t.id ? "var(--text-accent)" : "var(--text-muted)" }}>
            <Icon name={t.icon} size={18} color={tab === t.id ? "var(--text-accent)" : "var(--text-muted)"} />
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="glass-card p-5 space-y-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Company Profile</h2>
          {saved && (
            <div className="glass-card-sm p-3 flex gap-2" style={{ borderLeft: "4px solid var(--text-accent)" }}>
              <Icon name="check_circle" size={18} color="var(--text-accent)" />
              <p style={{ fontSize: 13, color: "var(--text-accent)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Saved successfully!</p>
            </div>
          )}
          {[
            { k: "name", l: "Company / Business Name", ph: "Your Company Pvt Ltd" },
            { k: "pan", l: "PAN", ph: "AAAAA0000A", mono: true },
            { k: "gstin", l: "GSTIN (optional)", ph: "27AAAAA0000A1Z5", mono: true },
            { k: "address", l: "Registered Address", ph: "123, Street, City" },
            { k: "state", l: "State", ph: "Maharashtra" },
          ].map(f => (
            <div key={f.k}>
              <label className="label-field">{f.l}</label>
              <input type="text" className={f.mono ? "input-mono" : "input-field"} placeholder={f.ph} value={(company as any)[f.k]} onChange={e => setCompany(p => ({ ...p, [f.k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="label-field">Business Type</label>
            <select className="input-field" value={company.type} onChange={e => setCompany(p => ({ ...p, type: e.target.value }))}>
              {["Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited", "HUF", "Trust"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="label-field">Current Financial Year</label>
            <select className="input-field" value={company.fy} onChange={e => setCompany(p => ({ ...p, fy: e.target.value }))}>
              {["2024-25", "2025-26", "2026-27"].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <button onClick={saveCompany} className="btn-primary w-full justify-center">
            <Icon name="save" size={16} /> Save Changes
          </button>
        </div>
      )}

      {tab === "upi" && (
        <div className="glass-card p-5 space-y-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UPI Auto-Mapping Rules</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted-2)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>When a UPI transaction merchant/ID contains the keyword, it auto-maps to the selected ledger.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--bg-hover)", borderRadius: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "var(--text-primary)", background: "var(--bg-icon)", padding: "3px 8px", borderRadius: 6 }}>{r.keyword}</span>
                <span style={{ fontSize: 12, color: "var(--text-muted-2)", flex: 1, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>→ {r.account}</span>
                <button onClick={() => setRules(p => p.map((x, idx) => idx === i ? { ...x, active: !x.active } : x))}
                  style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s", background: r.active ? "var(--text-accent)" : "var(--input-border)", position: "relative", padding: 0 }}>
                  <span style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: 8, background: "white", transition: "all 0.2s", left: r.active ? "calc(100% - 18px)" : 2 } as CSSProperties} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="glass-card p-5 space-y-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Team & Access Control</h2>
          <div style={{ background: "var(--bg-hover)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--bg-card-border)" }}>Name</th>
                  <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--bg-card-border)" }}>Email</th>
                  <th style={{ padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", borderBottom: "1px solid var(--bg-card-border)" }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--bg-card-border)" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-body)" }}>{u.name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--text-muted)" }}>{u.email}</td>
                    <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 9999, background: "var(--badge-bg)", color: "var(--text-accent)" }}>{u.role}</span></td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={3} style={{ padding: "20px", textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>No users loaded.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "16px", borderRadius: 12, border: "1px solid var(--bg-card-border)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Invite New User</h3>
            <form onSubmit={handleAddUser} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label className="label-field">Name</label><input required className="input-field" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} /></div>
              <div><label className="label-field">Email</label><input required type="email" className="input-field" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} /></div>
              <div><label className="label-field">Role</label><select className="input-field" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))}><option value="admin">Admin</option><option value="accountant">Accountant</option><option value="auditor">Auditor</option></select></div>
              <div><label className="label-field">Temporary Password</label><input required type="text" className="input-field" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} /></div>
              <div style={{ gridColumn: "1 / -1", marginTop: 8 }}><button type="submit" className="btn-primary"><Icon name="person_add" size={16} /> Add User</button></div>
            </form>
          </div>
        </div>
      )}

      {tab === "export" && (
        <div className="glass-card p-5 space-y-3">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Data Export</h2>
          {[
            { label: "Export Trial Balance", icon: "balance", desc: "As at today" },
            { label: "Export P&L Statement", icon: "trending_up", desc: "Full year YTD" },
            { label: "Export Balance Sheet", icon: "account_balance", desc: "As at today" },
            { label: "Export All Transactions", icon: "receipt_long", desc: "Full journal" },
          ].map(item => (
            <button key={item.label} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1px solid var(--bg-card-border)", background: "white", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-input-hover)")}
              onMouseLeave={e => (e.currentTarget.style.background = "white")}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-chip-s)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={item.icon} size={22} color="var(--text-accent)" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.label}</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.desc}</p>
              </div>
              <Icon name="download" size={20} color="var(--text-muted)" />
            </button>
          ))}
        </div>
      )}

      {tab === "security" && (
        <div className="glass-card p-5 space-y-5">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Change Password</h2>
            <p style={{ fontSize: 13, color: "var(--text-muted-2)", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Use a strong password with letters, numbers, and symbols.</p>
          </div>
          {pwMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: pwMsg.ok ? "var(--bg-hover)" : "var(--bg-card-border)", borderLeft: `4px solid ${pwMsg.ok ? "var(--text-accent)" : "var(--text-danger)"}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={pwMsg.ok ? "check_circle" : "error"} size={18} color={pwMsg.ok ? "var(--text-accent)" : "var(--text-danger)"} />
              <p style={{ fontSize: 13, color: pwMsg.ok ? "var(--text-accent)" : "var(--text-danger)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pwMsg.text}</p>
            </div>
          )}
          <form onSubmit={changePassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <PwInput field="current" label="Current Password" placeholder="Enter current password" />
            <PwInput field="next" label="New Password" placeholder="Min. 8 characters" />
            <PwInput field="confirm" label="Confirm New Password" placeholder="Repeat new password" />
            <button type="submit" disabled={pwLoading} className="btn-primary justify-center" style={{ opacity: pwLoading ? 0.8 : 1, cursor: pwLoading ? "not-allowed" : "pointer" }}>
              {pwLoading ? <><Icon name="autorenew" size={16} /> Saving…</> : <><Icon name="lock_reset" size={16} /> Update Password</>}
            </button>
          </form>
        </div>
      )}

      {tab === "accounts" && (
        <div className="glass-card p-5">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>Account Settings</h2>
          <p style={{ fontSize: 13, color: "var(--text-muted-2)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Manage your chart of accounts structure from the <a href="/accounts" style={{ color: "var(--text-accent)" }}>Accounts page</a>.</p>
        </div>
      )}
    </div>
  );
}
