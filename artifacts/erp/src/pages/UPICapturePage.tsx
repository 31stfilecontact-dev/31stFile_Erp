import { useState, useRef } from "react";
import { parseUPICSV, parseUPISMS, type UPITxn } from "@/lib/utils/upi-parser";
import { inr, fmtDate } from "@/lib/utils/format";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

type Tab = "csv" | "sms" | "manual";

export default function UPICapturePage() {
  const [tab, setTab] = useState<Tab>("csv");
  const [txns, setTxns] = useState<UPITxn[]>([]);
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const parsed = await parseUPICSV(file);
    setTxns(parsed);
    setLoading(false);
  }

  function parseSMS() {
    const parsed = parseUPISMS(smsText);
    setTxns(parsed);
  }

  async function postToLedger() {
    if (!txns.length) return;
    setPosting(true);
    try {
      const res = await fetch("/api/entries/upi-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: txns }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) setTxns([]);
    } catch { setResult({ success: 0, failed: txns.length }); }
    finally { setPosting(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,105,109,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="phone_iphone" size={24} color="#00696d" />
        </div>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UPI Capture</h1>
          <p style={{ fontSize: 12, color: "#747780", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Import UPI transactions into your ledger</p>
        </div>
      </div>

      {result && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: result.failed === 0 ? "rgba(220,242,232,0.7)" : "rgba(255,243,214,0.7)", borderLeft: `4px solid ${result.failed === 0 ? "#00696d" : "#9C6500"}`, display: "flex", gap: 8 }}>
          <Icon name={result.failed === 0 ? "check_circle" : "warning"} size={16} color={result.failed === 0 ? "#00696d" : "#9C6500"} />
          <p style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#131c2a" }}>
            Posted {result.success} transactions successfully{result.failed > 0 ? `, ${result.failed} failed` : ""}.
          </p>
        </div>
      )}

      {/* Tab selector */}
      <div style={{ display: "flex", gap: 4, background: "rgba(231,238,255,0.6)", borderRadius: 12, padding: 4 }}>
        {([["csv", "CSV Import", "upload_file"], ["sms", "SMS Parser", "sms"], ["manual", "Manual Entry", "edit"]] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 4px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: tab === id ? "white" : "transparent", boxShadow: tab === id ? "0 2px 8px rgba(27,58,107,0.10)" : "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: tab === id ? "#00696d" : "#747780" }}>
            <Icon name={icon} size={18} color={tab === id ? "#00696d" : "#747780"} /> {label}
          </button>
        ))}
      </div>

      {/* CSV Tab */}
      {tab === "csv" && (
        <div className="glass-card p-6">
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          <div style={{ border: "2px dashed rgba(196,198,208,0.6)", borderRadius: 16, padding: 40, textAlign: "center", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={async e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) { setLoading(true); setTxns(await parseUPICSV(file)); setLoading(false); }
            }}>
            <Icon name="upload_file" size={44} color="#c4c6d0" />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#44474f", marginTop: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Drop your bank CSV here
            </p>
            <p style={{ fontSize: 12, color: "#747780", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              or click to browse · Supports HDFC, SBI, ICICI, Axis, Paytm, PhonePe formats
            </p>
            <button className="btn-primary" style={{ marginTop: 16, fontSize: 13 }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              <Icon name="folder_open" size={16} color="white" /> Choose File
            </button>
          </div>
        </div>
      )}

      {/* SMS Tab */}
      {tab === "sms" && (
        <div className="glass-card p-5 space-y-4">
          <p style={{ fontSize: 13, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Paste your SMS messages below, one per line. The parser will extract UPI transactions automatically.
          </p>
          <textarea className="input-field" rows={8} style={{ resize: "vertical", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
            placeholder="Paste SMS messages here..." value={smsText} onChange={e => setSmsText(e.target.value)} />
          <button onClick={parseSMS} className="btn-primary" style={{ fontSize: 13 }}>
            <Icon name="auto_fix_high" size={16} color="white" /> Parse SMS
          </button>
        </div>
      )}

      {/* Transactions preview */}
      {txns.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(196,198,208,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {txns.length} Transactions Ready
              </h2>
              <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Review before posting to ledger
              </p>
            </div>
            <button onClick={postToLedger} disabled={posting} className="btn-primary" style={{ fontSize: 13 }}>
              {posting ? <><Icon name="autorenew" size={16} /> Posting…</> : <><Icon name="publish" size={16} color="white" /> Post All to Ledger</>}
            </button>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px", gap: 8, padding: "8px 16px", background: "rgba(240,243,255,0.6)" }}>
            {["Date", "Merchant / Description", "Amount", "Type", "Source"].map((h, i) => (
              <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "#747780", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: i >= 2 ? "right" : "left" }}>{h}</p>
            ))}
          </div>

          {txns.slice(0, 50).map((t, i) => (
            <div key={t.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 120px 80px 80px", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(196,198,208,0.15)", background: i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.2)", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.date}</span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.merchant}</p>
                {t.utr && <p style={{ fontSize: 10, color: "#747780", fontFamily: "'JetBrains Mono',monospace" }}>UTR: {t.utr}</p>}
              </div>
              <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: t.type === "DEBIT" ? "#ba1a1a" : "#00696d", fontWeight: 600 }}>{inr(t.amount)}</p>
              <span style={{ textAlign: "right", fontSize: 10, padding: "2px 6px", borderRadius: 9999, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif", background: t.type === "DEBIT" ? "rgba(255,218,214,0.7)" : "rgba(220,242,232,0.7)", color: t.type === "DEBIT" ? "#ba1a1a" : "#00696d" }}>{t.type}</span>
              <span style={{ textAlign: "right", fontSize: 10, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.source}</span>
            </div>
          ))}

          {txns.length > 50 && (
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Showing 50 of {txns.length}. All {txns.length} will be posted.
              </p>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="glass-card p-12" style={{ textAlign: "center" }}>
          <Icon name="autorenew" size={40} color="#00696d" />
          <p style={{ fontSize: 13, color: "#747780", marginTop: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Parsing file…</p>
        </div>
      )}
    </div>
  );
}
