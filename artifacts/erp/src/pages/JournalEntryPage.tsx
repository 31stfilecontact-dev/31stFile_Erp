import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { inr } from "@/lib/utils/format";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

interface Account { id: string; code: string; name: string; }
interface Line { id: string; accountId: string; side: "DR" | "CR"; amount: string; note: string; }

const VOUCHER_TYPES = ["JOURNAL", "PAYMENT", "RECEIPT", "SALES", "PURCHASE", "CONTRA"];

export default function JournalEntryPage() {
  const [, setLocation] = useLocation();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    voucherType: "JOURNAL",
    narration: "",
    reference: "",
  });
  const [lines, setLines] = useState<Line[]>([
    { id: "1", accountId: "", side: "DR", amount: "", note: "" },
    { id: "2", accountId: "", side: "CR", amount: "", note: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/accounts")
      .then(r => r.json())
      .then(d => setAccounts(Array.isArray(d) ? d : []));
  }, []);

  function addLine() {
    setLines(p => [...p, { id: Date.now().toString(), accountId: "", side: "DR", amount: "", note: "" }]);
  }

  function removeLine(id: string) {
    if (lines.length <= 2) return;
    setLines(p => p.filter(l => l.id !== id));
  }

  function updateLine(id: string, field: keyof Line, value: string) {
    setLines(p => p.map(l => l.id === id ? { ...l, [field]: value } : l));
  }

  const totalDR = lines.filter(l => l.side === "DR").reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const totalCR = lines.filter(l => l.side === "CR").reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01 && totalDR > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!balanced) { setError("Entry is not balanced — DR must equal CR."); return; }
    const incomplete = lines.some(l => !l.accountId || !l.amount);
    if (incomplete) { setError("All lines must have an account and amount."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lines: lines.map(l => ({
            accountId: l.accountId,
            side: l.side,
            amount: parseFloat(l.amount),
            note: l.note || null,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save entry."); return; }
      setSuccess(`Entry saved: ${data.voucherNo}`);
      setTimeout(() => setLocation("/transactions"), 1500);
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-icon)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="edit_note" size={24} color="var(--text-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Journal Entry
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Double-entry bookkeeping
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-card-border)", borderLeft: "4px solid var(--text-danger)", display: "flex", gap: 8 }}>
          <Icon name="error" size={16} color="var(--text-danger)" />
          <p style={{ fontSize: 13, color: "var(--text-danger)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: "var(--bg-hover)", borderLeft: "4px solid var(--text-accent)", display: "flex", gap: 8 }}>
          <Icon name="check_circle" size={16} color="var(--text-accent)" />
          <p style={{ fontSize: 13, color: "var(--text-accent)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Header fields */}
        <div className="glass-card p-5 space-y-4">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label-field">Date</label>
              <input type="date" className="input-field" required
                value={form.entryDate} onChange={e => setForm(p => ({ ...p, entryDate: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Voucher Type</label>
              <select className="input-field" value={form.voucherType} onChange={e => setForm(p => ({ ...p, voucherType: e.target.value }))}>
                {VOUCHER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label-field">Narration</label>
            <input type="text" className="input-field" required placeholder="Describe this transaction"
              value={form.narration} onChange={e => setForm(p => ({ ...p, narration: e.target.value }))} />
          </div>
          <div>
            <label className="label-field">Reference (optional)</label>
            <input type="text" className="input-mono" placeholder="Invoice no., UTR, cheque no., etc."
              value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
          </div>
        </div>

        {/* Lines */}
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 160px auto auto", gap: 8, padding: "10px 16px", background: "var(--text-primary)" }}>
            {["Account", "Dr/Cr", "Amount (₹)", "Note", ""].map((h, i) => (
              <p key={i} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {h}
              </p>
            ))}
          </div>

          {/* Lines */}
          {lines.map((line, i) => (
            <div key={line.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 160px auto auto", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--bg-card-border)", alignItems: "center" }}>
              <select className="input-field" style={{ fontSize: 13 }} required
                value={line.accountId} onChange={e => updateLine(line.id, "accountId", e.target.value)}>
                <option value="">Select account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                ))}
              </select>
              <select className="input-field" style={{ fontSize: 13, fontWeight: 700, color: line.side === "DR" ? "#9C6500" : "var(--text-accent)" }}
                value={line.side} onChange={e => updateLine(line.id, "side", e.target.value as "DR" | "CR")}>
                <option value="DR">DR</option>
                <option value="CR">CR</option>
              </select>
              <input type="number" className="input-mono" style={{ fontSize: 13 }} min="0" step="0.01"
                placeholder="0.00" value={line.amount}
                onChange={e => updateLine(line.id, "amount", e.target.value)} />
              <input type="text" className="input-field" style={{ fontSize: 12 }}
                placeholder="Optional note" value={line.note}
                onChange={e => updateLine(line.id, "note", e.target.value)} />
              <button type="button" onClick={() => removeLine(line.id)}
                disabled={lines.length <= 2}
                style={{ padding: 6, borderRadius: 8, border: "none", cursor: lines.length <= 2 ? "not-allowed" : "pointer", background: "rgba(186,26,26,0.1)", opacity: lines.length <= 2 ? 0.3 : 1 }}>
                <Icon name="delete" size={16} color="var(--text-danger)" />
              </button>
            </div>
          ))}

          {/* Add line button */}
          <div style={{ padding: "10px 16px" }}>
            <button type="button" onClick={addLine} className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
              <Icon name="add" size={16} /> Add Line
            </button>
          </div>

          {/* Totals */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 160px auto auto", gap: 8, padding: "12px 16px", background: "rgba(240,243,255,0.6)", borderTop: "2px solid var(--bg-card-border)" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL</span>
            <span />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "#9C6500", fontWeight: 700 }}>
                DR: {inr(totalDR)}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "var(--text-accent)", fontWeight: 700 }}>
                CR: {inr(totalCR)}
              </span>
            </div>
            <div />
            <div />
          </div>

          {/* Balance indicator */}
          <div style={{
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
            background: balanced ? "var(--bg-hover)" : (totalDR > 0 || totalCR > 0) ? "var(--bg-card-border)" : "transparent",
          }}>
            {(totalDR > 0 || totalCR > 0) && (
              <>
                <Icon name={balanced ? "check_circle" : "error"} size={16} color={balanced ? "var(--text-accent)" : "var(--text-danger)"} />
                <p style={{ fontSize: 12, color: balanced ? "var(--text-accent)" : "var(--text-danger)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  {balanced ? "Entry is balanced" : `Difference: ${inr(Math.abs(totalDR - totalCR))}`}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={saving || !balanced} className="btn-primary w-full justify-center"
          style={{ fontSize: 14, opacity: (saving || !balanced) ? 0.7 : 1, cursor: (saving || !balanced) ? "not-allowed" : "pointer" }}>
          {saving ? <><Icon name="autorenew" size={16} /> Saving…</> : <><Icon name="save" size={16} /> Post Entry</>}
        </button>
      </form>
    </div>
  );
}
