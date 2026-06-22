import { useState, type CSSProperties } from "react";

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
  { id: "export", label: "Export", icon: "download" },
  { id: "security", label: "Security", icon: "lock" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState({ name: "My Company", pan: "", gstin: "", address: "", state: "", fy: "2025-26", type: "Proprietorship" });
  const [saved, setSaved] = useState(false);
  const [rules, setRules] = useState([
    { keyword: "rent", account: "Rent Expense", active: true },
    { keyword: "salary", account: "Salary & Wages", active: true },
    { keyword: "epfo", account: "PF Contribution", active: true },
  ]);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  function saveCompany() { setSaved(true); setTimeout(() => setSaved(false), 3000); }

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
            <Icon name={showPw[field] ? "visibility_off" : "visibility"} size={18} color="#747780" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Settings</h1>

      <div style={{ display: "flex", gap: 2, background: "rgba(231,238,255,0.6)", borderRadius: 12, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: tab === t.id ? "white" : "transparent", boxShadow: tab === t.id ? "0 2px 8px rgba(27,58,107,0.10)" : "none", color: tab === t.id ? "#00696d" : "#747780" }}>
            <Icon name={t.icon} size={18} color={tab === t.id ? "#00696d" : "#747780"} />
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="glass-card p-5 space-y-4">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Company Profile</h2>
          {saved && (
            <div className="glass-card-sm p-3 flex gap-2" style={{ borderLeft: "4px solid #00696d" }}>
              <Icon name="check_circle" size={18} color="#00696d" />
              <p style={{ fontSize: 13, color: "#00696d", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Saved successfully!</p>
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
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UPI Auto-Mapping Rules</h2>
          <p style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>When a UPI transaction merchant/ID contains the keyword, it auto-maps to the selected ledger.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(240,243,255,0.7)", borderRadius: 12 }}>
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#1b3a6b", background: "rgba(27,58,107,0.10)", padding: "3px 8px", borderRadius: 6 }}>{r.keyword}</span>
                <span style={{ fontSize: 12, color: "#44474f", flex: 1, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>→ {r.account}</span>
                <button onClick={() => setRules(p => p.map((x, idx) => idx === i ? { ...x, active: !x.active } : x))}
                  style={{ width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s", background: r.active ? "#00696d" : "#c4c6d0", position: "relative", padding: 0 }}>
                  <span style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: 8, background: "white", transition: "all 0.2s", left: r.active ? "calc(100% - 18px)" : 2 } as CSSProperties} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "export" && (
        <div className="glass-card p-5 space-y-3">
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Data Export</h2>
          {[
            { label: "Export Trial Balance", icon: "balance", desc: "As at today" },
            { label: "Export P&L Statement", icon: "trending_up", desc: "Full year YTD" },
            { label: "Export Balance Sheet", icon: "account_balance", desc: "As at today" },
            { label: "Export All Transactions", icon: "receipt_long", desc: "Full journal" },
          ].map(item => (
            <button key={item.label} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(196,198,208,0.5)", background: "white", cursor: "pointer", transition: "all 0.15s", textAlign: "left" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f0f3ff")}
              onMouseLeave={e => (e.currentTarget.style.background = "white")}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(0,105,109,0.10)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={item.icon} size={22} color="#00696d" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.label}</p>
                <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{item.desc}</p>
              </div>
              <Icon name="download" size={20} color="#747780" />
            </button>
          ))}
        </div>
      )}

      {tab === "security" && (
        <div className="glass-card p-5 space-y-5">
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Change Password</h2>
            <p style={{ fontSize: 13, color: "#44474f", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Use a strong password with letters, numbers, and symbols.</p>
          </div>
          {pwMsg && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: pwMsg.ok ? "rgba(220,242,232,0.7)" : "rgba(255,218,214,0.7)", borderLeft: `4px solid ${pwMsg.ok ? "#00696d" : "#ba1a1a"}`, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name={pwMsg.ok ? "check_circle" : "error"} size={18} color={pwMsg.ok ? "#00696d" : "#ba1a1a"} />
              <p style={{ fontSize: 13, color: pwMsg.ok ? "#00696d" : "#ba1a1a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{pwMsg.text}</p>
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
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>Account Settings</h2>
          <p style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Manage your chart of accounts structure from the <a href="/accounts" style={{ color: "#00696d" }}>Accounts page</a>.</p>
        </div>
      )}
    </div>
  );
}
