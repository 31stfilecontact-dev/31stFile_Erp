"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { inr, fmtDate, fyDates } from "@/lib/utils/format";
import VoucherModal from "@/components/VoucherModal";

function Icon({ name, size=20, color="" }: { name:string; size?:number; color?:string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize:size, lineHeight:1, color:color||"inherit" }}>
      {name}
    </span>
  );
}

const GROUP_COLORS: Record<string,string> = {
  Assets:"#00696d", Liabilities:"#1b3a6b", Income:"#00696d", Expenses:"#9C6500", Equity:"#5c3d9e",
};

interface LedgerLine {
  lineId: string; entryId: string; entryDate: string; voucherNo: string;
  voucherType: string; narration: string; reference: string | null;
  side: string; amount: number; dr: number; cr: number;
  balance: number; balanceDrCr: string; lineNote: string | null;
}

interface LedgerData {
  account: { id:string; code:string; name:string; group:string; subGroup:string|null; normalBal:string };
  from: string|null; to: string|null;
  openingBalance: number; openingDrCr: string;
  lines: LedgerLine[];
  totalDr: number; totalCr: number;
  closingBalance: number; closingDrCr: string;
}

export default function LedgerPage() {
  const { code } = useParams<{ code: string }>();
  const router   = useRouter();
  const fy       = fyDates();

  const [from, setFrom] = useState(fy.from);
  const [to,   setTo]   = useState(fy.to);
  const [data,    setData]    = useState<LedgerData|null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [voucherId, setVoucherId] = useState<string|null>(null);

  const load = useCallback(async (f: string, t: string) => {
    setLoading(true); setError("");
    try {
      const r = await fetch(`/api/accounts/${encodeURIComponent(code)}/ledger?from=${f}&to=${t}`);
      if (!r.ok) { setError("Account not found"); setLoading(false); return; }
      setData(await r.json());
    } catch { setError("Failed to load ledger"); }
    setLoading(false);
  }, [code]);

  useEffect(() => { load(from, to); }, [load]);

  function applyRange(f: string, t: string) { setFrom(f); setTo(t); load(f, t); }

  function downloadCSV() {
    if (!data) return;
    const hdr = ["Date","Voucher No","Narration","DR","CR","Balance","Dr/Cr"];
    const rows = data.lines.map(l => [
      l.entryDate, l.voucherNo,
      `"${l.narration.replace(/"/g,'""')}"`,
      l.dr||"", l.cr||"",
      l.balance, l.balanceDrCr,
    ]);
    const csv = [hdr, ...rows].map(r => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = `ledger-${data.account.code}-${from}-to-${to}.csv`;
    a.click();
  }

  const acct  = data?.account;
  const color = acct ? (GROUP_COLORS[acct.group] || "#1b3a6b") : "#1b3a6b";

  return (
    <div className="max-w-5xl mx-auto space-y-4 print-area">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="btn-ghost" style={{ padding:"8px 10px" }}>
            <Icon name="arrow_back" size={18} />
          </button>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:"#131c2a",
              fontFamily:"'Plus Jakarta Sans',sans-serif", lineHeight:1.2 }}>
              {acct ? acct.name : "Ledger"}
            </h1>
            {acct && (
              <div style={{ display:"flex", gap:6, marginTop:4, alignItems:"center" }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                  color, background:`${color}18`, padding:"2px 8px", borderRadius:6, fontWeight:600 }}>
                  {acct.code}
                </span>
                <span style={{ fontSize:11, color:"#747780", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {acct.group}{acct.subGroup ? ` › ${acct.subGroup}` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap no-print">
          <button onClick={downloadCSV} disabled={!data || loading}
            className="btn-ghost" style={{ fontSize:12, gap:4 }}>
            <Icon name="download" size={16} /> CSV
          </button>
          <button onClick={() => window.print()}
            className="btn-ghost" style={{ fontSize:12, gap:4 }}>
            <Icon name="print" size={16} /> Print
          </button>
        </div>
      </div>

      {/* ── Date range picker ── */}
      <div className="glass-card p-4 no-print">
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap" }}>
          <div>
            <label className="label-field">From</label>
            <input type="date" className="input-field" style={{ width:160 }}
              value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-field">To</label>
            <input type="date" className="input-field" style={{ width:160 }}
              value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <button onClick={() => load(from, to)} className="btn-primary" style={{ fontSize:13 }}>
            <Icon name="search" size={16} /> Apply
          </button>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[
              { label:"This FY", f:fy.from, t:fy.to },
              { label:"This Month",
                f:`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}-01`,
                t:new Date().toISOString().split("T")[0] },
              { label:"All Time", f:"2000-01-01", t:"2099-12-31" },
            ].map(({ label, f, t }) => (
              <button key={label} onClick={() => applyRange(f, t)}
                style={{ padding:"5px 12px", borderRadius:9999, fontSize:11, fontWeight:700,
                  cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  background: from===f&&to===t ? color : "transparent",
                  color: from===f&&to===t ? "white" : "#747780",
                  border: from===f&&to===t ? "none" : "1px solid #c4c6d0",
                  transition:"all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="glass-card p-6 text-center">
          <Icon name="error_outline" size={40} color="#ba1a1a" />
          <p style={{ fontSize:14, color:"#ba1a1a", marginTop:8,
            fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{error}</p>
          <Link href="/accounts" className="btn-primary mt-4"
            style={{ display:"inline-flex", marginTop:12 }}>
            Back to Accounts
          </Link>
        </div>
      )}

      {!error && (
        <>
          {/* ── Summary cards ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12 }}>
            {[
              { label:"Opening Balance", value: data?.openingBalance??0,
                sub: data?.openingDrCr, icon:"start", clr:"#1b3a6b" },
              { label:"Total Debits",    value: data?.totalDr??0,
                sub:"DR", icon:"arrow_downward", clr:"#9C6500" },
              { label:"Total Credits",   value: data?.totalCr??0,
                sub:"CR", icon:"arrow_upward", clr:"#00696d" },
              { label:"Closing Balance", value: data?.closingBalance??0,
                sub: data?.closingDrCr, icon:"account_balance_wallet",
                clr: data?.closingDrCr==="CR" ? "#9C6500" : "#00696d", bold:true },
            ].map(c => (
              <div key={c.label} className="glass-card p-4"
                style={{ borderTop: `3px solid ${c.clr}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <p style={{ fontSize:10, fontWeight:700, color:"#747780",
                    textTransform:"uppercase", letterSpacing:"0.06em",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.label}</p>
                  <Icon name={c.icon} size={16} color={c.clr} />
                </div>
                <p style={{ fontSize: c.bold?20:18, fontWeight:800, color: c.clr,
                  fontFamily:"'JetBrains Mono',monospace", marginTop:6 }}>
                  {loading ? "…" : inr(c.value)}
                </p>
                {c.sub && (
                  <span style={{ fontSize:10, padding:"1px 6px", borderRadius:9999, fontWeight:700,
                    background:`${c.clr}18`, color:c.clr,
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{c.sub}</span>
                )}
              </div>
            ))}
          </div>

          {/* ── Ledger table ── */}
          <div className="glass-card overflow-hidden">
            {/* Print header */}
            <div className="print-only" style={{ padding:"16px 20px 8px", borderBottom:"1px solid #e0e0e0" }}>
              <p style={{ fontSize:16, fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                {acct?.name} — Ledger
              </p>
              <p style={{ fontSize:12, color:"#747780" }}>Period: {from} to {to}</p>
            </div>

            {/* Table header */}
            <div style={{ display:"grid", gridTemplateColumns:"110px 140px 1fr 120px 120px 130px 56px",
              padding:"10px 16px", background:"#1b3a6b", gap:8 }}>
              {["Date","Voucher No","Narration","Debit (₹)","Credit (₹)","Balance","Dr/Cr"].map(h => (
                <p key={h} style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.85)",
                  textTransform:"uppercase", letterSpacing:"0.06em",
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  textAlign: h.includes("₹")||h==="Dr/Cr"||h==="Balance" ? "right" : "left" }}>
                  {h}
                </p>
              ))}
            </div>

            {/* Opening balance row */}
            {!loading && data && (
              <div style={{ display:"grid", gridTemplateColumns:"110px 140px 1fr 120px 120px 130px 56px",
                padding:"10px 16px", gap:8, background:"rgba(231,238,255,0.5)",
                borderBottom:"1px solid rgba(196,198,208,0.25)" }}>
                <span style={{ fontSize:11, color:"#747780", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {from ? fmtDate(from) : "—"}
                </span>
                <span style={{ fontSize:11, color:"#747780", fontFamily:"'JetBrains Mono',monospace" }}>—</span>
                <span style={{ fontSize:12, color:"#44474f", fontWeight:600,
                  fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Opening Balance</span>
                <span style={{ textAlign:"right" }} />
                <span style={{ textAlign:"right" }} />
                <span style={{ fontSize:12, fontWeight:700, color:"#1b3a6b",
                  fontFamily:"'JetBrains Mono',monospace", textAlign:"right" }}>
                  {inr(data.openingBalance)}
                </span>
                <span style={{ fontSize:10, padding:"2px 6px", borderRadius:9999, fontWeight:700,
                  fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"right",
                  background: data.openingDrCr==="DR" ? "rgba(157,240,244,0.35)" : "rgba(255,243,214,0.6)",
                  color: data.openingDrCr==="DR" ? "#037074" : "#9C6500" }}>
                  {data.openingDrCr}
                </span>
              </div>
            )}

            {/* Lines */}
            {loading ? (
              <div style={{ padding:60, textAlign:"center" }}>
                <Icon name="autorenew" size={40} color="#00696d" />
                <p style={{ fontSize:13, color:"#747780", marginTop:10,
                  fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading ledger…</p>
              </div>
            ) : data?.lines.length === 0 ? (
              <div style={{ padding:60, textAlign:"center" }}>
                <Icon name="receipt_long" size={44} color="#c4c6d0" />
                <p style={{ fontSize:14, color:"#747780", marginTop:10,
                  fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  No transactions in this period.
                </p>
                <Link href="/journal-entry" className="btn-primary"
                  style={{ display:"inline-flex", marginTop:12, fontSize:13 }}>
                  <Icon name="add" size={15} /> New Entry
                </Link>
              </div>
            ) : (
              data?.lines.map((l, i) => (
                <div key={l.lineId}
                  style={{ display:"grid", gridTemplateColumns:"110px 140px 1fr 120px 120px 130px 56px",
                    padding:"11px 16px", gap:8,
                    borderBottom:"1px solid rgba(196,198,208,0.18)",
                    background: i%2===0 ? "transparent" : "rgba(240,243,255,0.28)",
                    transition:"background 0.12s", cursor:"pointer" }}
                  onClick={() => setVoucherId(l.entryId)}
                  title="Click to view full voucher"
                  onMouseEnter={e => (e.currentTarget.style.background="rgba(231,238,255,0.6)")}
                  onMouseLeave={e => (e.currentTarget.style.background=i%2===0?"transparent":"rgba(240,243,255,0.28)")}>
                  <span style={{ fontSize:12, color:"#44474f",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {fmtDate(l.entryDate)}
                  </span>
                  <span style={{ fontSize:11, color:"#1b3a6b",
                    fontFamily:"'JetBrains Mono',monospace", fontWeight:600 }}>
                    {l.voucherNo}
                  </span>
                  <div style={{ minWidth:0 }}>
                    <p style={{ fontSize:12, color:"#131c2a",
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {l.narration}
                    </p>
                    {l.lineNote && (
                      <p style={{ fontSize:10, color:"#747780", marginTop:1,
                        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{l.lineNote}</p>
                    )}
                  </div>
                  <p style={{ fontSize:13, color: l.dr ? "#9C6500" : "#c4c6d0",
                    fontFamily:"'JetBrains Mono',monospace", textAlign:"right",
                    fontWeight: l.dr ? 700 : 400 }}>
                    {l.dr ? inr(l.dr) : "—"}
                  </p>
                  <p style={{ fontSize:13, color: l.cr ? "#00696d" : "#c4c6d0",
                    fontFamily:"'JetBrains Mono',monospace", textAlign:"right",
                    fontWeight: l.cr ? 700 : 400 }}>
                    {l.cr ? inr(l.cr) : "—"}
                  </p>
                  <p style={{ fontSize:13, color:"#131c2a",
                    fontFamily:"'JetBrains Mono',monospace", textAlign:"right", fontWeight:600 }}>
                    {inr(l.balance)}
                  </p>
                  <span style={{ fontSize:10, padding:"2px 6px", borderRadius:9999, fontWeight:700,
                    fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"center",
                    background: l.balanceDrCr==="DR" ? "rgba(157,240,244,0.35)" : "rgba(255,243,214,0.6)",
                    color: l.balanceDrCr==="DR" ? "#037074" : "#9C6500" }}>
                    {l.balanceDrCr}
                  </span>
                </div>
              ))
            )}

            {/* Closing balance row */}
            {!loading && data && data.lines.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"110px 140px 1fr 120px 120px 130px 56px",
                padding:"12px 16px", gap:8, background:"rgba(27,58,107,0.06)",
                borderTop:"2px solid rgba(27,58,107,0.15)" }}>
                <span style={{ fontSize:11, color:"#747780", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  {to ? fmtDate(to) : "—"}
                </span>
                <span />
                <span style={{ fontSize:12, color:"#131c2a", fontWeight:700,
                  fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Closing Balance</span>
                <p style={{ fontSize:13, fontWeight:700, color:"#9C6500",
                  fontFamily:"'JetBrains Mono',monospace", textAlign:"right" }}>
                  {data.totalDr ? inr(data.totalDr) : "—"}
                </p>
                <p style={{ fontSize:13, fontWeight:700, color:"#00696d",
                  fontFamily:"'JetBrains Mono',monospace", textAlign:"right" }}>
                  {data.totalCr ? inr(data.totalCr) : "—"}
                </p>
                <p style={{ fontSize:14, fontWeight:800, color:"#131c2a",
                  fontFamily:"'JetBrains Mono',monospace", textAlign:"right" }}>
                  {inr(data.closingBalance)}
                </p>
                <span style={{ fontSize:10, padding:"2px 6px", borderRadius:9999, fontWeight:700,
                  fontFamily:"'Plus Jakarta Sans',sans-serif", textAlign:"center",
                  background: data.closingDrCr==="DR" ? "rgba(157,240,244,0.35)" : "rgba(255,243,214,0.6)",
                  color: data.closingDrCr==="DR" ? "#037074" : "#9C6500" }}>
                  {data.closingDrCr}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          aside, header, nav { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; }
          .glass-card { box-shadow: none !important; border: 1px solid #ccc !important; }
        }
        .print-only { display: none; }
      `}</style>

      <VoucherModal entryId={voucherId} onClose={() => setVoucherId(null)} />
    </div>
  );
}
