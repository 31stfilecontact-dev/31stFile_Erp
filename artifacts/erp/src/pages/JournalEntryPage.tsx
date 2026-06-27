import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
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
interface Vendor { id: string; name: string; gstNo: string; pan: string; tdsApplicable: boolean; tdsSectionCode: string; defaultHsnCode: string; }

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

  // Compliance States
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  
  const [showGst, setShowGst] = useState(false);
  const [gstState, setGstState] = useState({
    hsnCode: "",
    taxableAmount: "",
    isInterstate: false,
  });

  const [showTds, setShowTds] = useState(false);
  const [tdsState, setTdsState] = useState({
    sectionCode: "",
    baseAmount: "",
    tdsRate: "",
    tdsAmount: "",
    panNo: "",
  });

  useEffect(() => {
    fetch("/api/accounts").then(r => r.ok ? r.json() : null).then(d => setAccounts(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const { data: vendors } = useQuery<Vendor[]>({
    queryKey: ["vendors-search", vendorSearch],
    queryFn: async () => {
      if (!vendorSearch) return [];
      const res = await fetch(`/api/vendors/search?q=${vendorSearch}`);
      return res.json();
    },
    enabled: vendorSearch.length > 1
  });

  const { data: hsnCodes } = useQuery({
    queryKey: ["hsn"],
    queryFn: async () => (await fetch("/api/masters/hsn")).json()
  });

  const { data: tdsSections } = useQuery({
    queryKey: ["tds"],
    queryFn: async () => (await fetch("/api/masters/tds")).json()
  });

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

  useEffect(() => {
    if (selectedVendor) {
      if (selectedVendor.tdsApplicable) {
        setShowTds(true);
        setTdsState(s => ({
          ...s,
          sectionCode: selectedVendor.tdsSectionCode || "",
          panNo: selectedVendor.pan || "",
        }));
      }
      if (selectedVendor.defaultHsnCode) {
        setShowGst(true);
        setGstState(s => ({ ...s, hsnCode: selectedVendor.defaultHsnCode }));
      }
    }
  }, [selectedVendor]);
  
  // Auto-calculate GST rates when HSN changes
  const selectedHsn = hsnCodes?.find((h: any) => h.code === gstState.hsnCode);
  const cgstRate = selectedHsn ? Number(selectedHsn.cgstRate) : 0;
  const sgstRate = selectedHsn ? Number(selectedHsn.sgstRate) : 0;
  const igstRate = selectedHsn ? Number(selectedHsn.igstRate) : 0;
  
  const taxableAmount = parseFloat(gstState.taxableAmount) || 0;
  const cgstAmount = gstState.isInterstate ? 0 : (taxableAmount * cgstRate) / 100;
  const sgstAmount = gstState.isInterstate ? 0 : (taxableAmount * sgstRate) / 100;
  const igstAmount = gstState.isInterstate ? (taxableAmount * igstRate) / 100 : 0;

  // Auto-calculate TDS
  const selectedTds = tdsSections?.find((t: any) => t.code === tdsState.sectionCode);
  useEffect(() => {
    if (selectedTds && !tdsState.tdsRate) {
      setTdsState(s => ({ ...s, tdsRate: selectedTds.companyRate }));
    }
  }, [selectedTds]);
  
  useEffect(() => {
    const base = parseFloat(tdsState.baseAmount) || 0;
    const rate = parseFloat(tdsState.tdsRate) || 0;
    if (base > 0 && rate > 0) {
      setTdsState(s => ({ ...s, tdsAmount: ((base * rate) / 100).toFixed(2) }));
    }
  }, [tdsState.baseAmount, tdsState.tdsRate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!balanced) { setError("Entry is not balanced — DR must equal CR."); return; }
    const incomplete = lines.some(l => !l.accountId || !l.amount);
    if (incomplete) { setError("All lines must have an account and amount."); return; }

    setSaving(true);
    
    const payload: any = {
      ...form,
      vendorId: selectedVendor?.id,
      invoiceNo: invoiceNo || undefined,
      invoiceDate: invoiceDate || undefined,
      lines: lines.map(l => ({
        accountId: l.accountId,
        side: l.side,
        amount: parseFloat(l.amount),
        note: l.note || null,
      })),
    };
    
    if (showGst && gstState.hsnCode && taxableAmount > 0) {
      payload.gst = {
        hsnCode: gstState.hsnCode,
        taxableAmount,
        cgstRate: gstState.isInterstate ? 0 : cgstRate,
        sgstRate: gstState.isInterstate ? 0 : sgstRate,
        igstRate: gstState.isInterstate ? igstRate : 0,
        isInterstate: gstState.isInterstate,
      };
    }
    
    if (showTds && tdsState.sectionCode && parseFloat(tdsState.tdsAmount) > 0) {
      payload.tds = {
        sectionCode: tdsState.sectionCode,
        panNo: tdsState.panNo,
        tdsRate: parseFloat(tdsState.tdsRate),
        baseAmount: parseFloat(tdsState.baseAmount),
        tdsAmount: parseFloat(tdsState.tdsAmount),
      };
    }

    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save entry."); return; }
      setSuccess(`Entry saved: ${data.voucherNo}`);
      setTimeout(() => setLocation("/transactions"), 1500);
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 pb-20">
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
            <input type="text" className="input-mono" placeholder="Internal Ref, UTR, etc."
              value={form.reference} onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
          </div>
        </div>

        {/* Lines */}
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 140px auto 40px", gap: 8, padding: "10px 16px", background: "var(--text-primary)" }}>
            {["Account", "Dr/Cr", "Amount (₹)", "Note", ""].map((h, i) => (
              <p key={i} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {h}
              </p>
            ))}
          </div>

          {/* Lines */}
          {lines.map((line, i) => (
            <div key={line.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 80px 140px auto 40px", gap: 8, padding: "10px 16px", borderBottom: "1px solid var(--bg-card-border)", alignItems: "center" }}>
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
                style={{ padding: 6, borderRadius: 8, border: "none", cursor: lines.length <= 2 ? "not-allowed" : "pointer", background: "rgba(186,26,26,0.1)", opacity: lines.length <= 2 ? 0.3 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        
        {/* Advanced / Compliance Section */}
        <div className="glass-card overflow-hidden">
          <div 
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", background: showAdvanced ? "rgba(240,243,255,0.3)" : "transparent" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="verified_user" size={18} color="var(--text-accent)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Advanced / Compliance</span>
            </div>
            <Icon name={showAdvanced ? "expand_less" : "expand_more"} size={20} color="var(--text-muted)" />
          </div>
          
          {showAdvanced && (
            <div style={{ padding: "16px", borderTop: "1px solid var(--bg-card-border)" }} className="space-y-6">
              
              {/* Vendor Selection */}
              <div>
                <label className="label-field flex justify-between">
                  <span>Vendor / Party</span>
                  <a href="/vendors" target="_blank" className="text-indigo-600 hover:underline text-xs flex items-center gap-1">
                    <Icon name="add" size={14} /> Add Vendor
                  </a>
                </label>
                {!selectedVendor ? (
                  <div className="relative">
                    <input 
                      type="text" 
                      className="input-field w-full pl-9" 
                      placeholder="Search vendor by name..."
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                    />
                    <div className="absolute left-3 top-2.5">
                      <Icon name="search" size={16} color="var(--text-muted)" />
                    </div>
                    {vendors && vendors.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 overflow-hidden">
                        {vendors.map(v => (
                          <div 
                            key={v.id} 
                            className="px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer text-sm"
                            onClick={() => { setSelectedVendor(v); setVendorSearch(""); }}
                          >
                            <div className="font-medium">{v.name}</div>
                            <div className="text-xs text-zinc-500">GST: {v.gstNo || 'N/A'} | PAN: {v.pan || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-3 rounded-lg">
                    <div>
                      <div className="font-medium text-indigo-900 dark:text-indigo-100">{selectedVendor.name}</div>
                      <div className="flex gap-2 mt-1">
                        {selectedVendor.gstNo && <span className="text-[10px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700">GST: {selectedVendor.gstNo}</span>}
                        {selectedVendor.pan && <span className="text-[10px] bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono border border-zinc-200 dark:border-zinc-700">PAN: {selectedVendor.pan}</span>}
                        {selectedVendor.tdsApplicable && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">TDS</span>}
                      </div>
                    </div>
                    <button type="button" onClick={() => setSelectedVendor(null)} className="p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800 text-indigo-500">
                      <Icon name="close" size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">Invoice No.</label>
                  <input type="text" className="input-field w-full" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                </div>
                <div>
                  <label className="label-field">Invoice Date</label>
                  <input type="date" className="input-field w-full" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
              </div>

              <hr className="border-zinc-200 dark:border-zinc-800" />
              
              {/* GST Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="showGst" checked={showGst} onChange={e => setShowGst(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="showGst" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Add GST Details</label>
                </div>
                
                {showGst && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                      <div className="w-1/2 pr-2">
                        <label className="label-field text-xs">HSN / SAC Code</label>
                        <select className="input-field w-full" value={gstState.hsnCode} onChange={e => setGstState(s => ({ ...s, hsnCode: e.target.value }))}>
                          <option value="">Select HSN...</option>
                          {hsnCodes?.map((h: any) => (
                            <option key={h.code} value={h.code}>{h.code} - {h.description}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-1/2 pl-2 flex items-end h-full pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={gstState.isInterstate} onChange={e => setGstState(s => ({ ...s, isInterstate: e.target.checked }))} className="rounded text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">Interstate (IGST)</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="label-field text-xs">Taxable Amt</label>
                        <input type="number" className="input-field w-full text-right" placeholder="0.00" value={gstState.taxableAmount} onChange={e => setGstState(s => ({ ...s, taxableAmount: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label-field text-xs">CGST {gstState.isInterstate ? '0' : cgstRate}%</label>
                        <input type="text" className="input-field w-full text-right bg-zinc-100 dark:bg-zinc-900" disabled value={cgstAmount.toFixed(2)} />
                      </div>
                      <div>
                        <label className="label-field text-xs">SGST {gstState.isInterstate ? '0' : sgstRate}%</label>
                        <input type="text" className="input-field w-full text-right bg-zinc-100 dark:bg-zinc-900" disabled value={sgstAmount.toFixed(2)} />
                      </div>
                      <div>
                        <label className="label-field text-xs">IGST {gstState.isInterstate ? igstRate : '0'}%</label>
                        <input type="text" className="input-field w-full text-right bg-zinc-100 dark:bg-zinc-900" disabled value={igstAmount.toFixed(2)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <hr className="border-zinc-200 dark:border-zinc-800" />
              
              {/* TDS Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input type="checkbox" id="showTds" checked={showTds} onChange={e => setShowTds(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="showTds" className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Add TDS Deduction</label>
                </div>
                
                {showTds && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg space-y-4 border border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-field text-xs">TDS Section</label>
                        <select className="input-field w-full" value={tdsState.sectionCode} onChange={e => setTdsState(s => ({ ...s, sectionCode: e.target.value }))}>
                          <option value="">Select Section...</option>
                          {tdsSections?.map((t: any) => (
                            <option key={t.code} value={t.code}>{t.code} - {t.description}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-field text-xs">PAN Number</label>
                        <input type="text" className="input-field w-full font-mono uppercase" placeholder="ABCDE1234F" value={tdsState.panNo} onChange={e => setTdsState(s => ({ ...s, panNo: e.target.value.toUpperCase() }))} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="label-field text-xs">Base Amount</label>
                        <input type="number" className="input-field w-full text-right" placeholder="0.00" value={tdsState.baseAmount} onChange={e => setTdsState(s => ({ ...s, baseAmount: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label-field text-xs">TDS Rate (%)</label>
                        <input type="number" className="input-field w-full text-right" placeholder="0" value={tdsState.tdsRate} onChange={e => setTdsState(s => ({ ...s, tdsRate: e.target.value }))} />
                      </div>
                      <div>
                        <label className="label-field text-xs">TDS Amount</label>
                        <input type="number" className="input-field w-full text-right" placeholder="0.00" value={tdsState.tdsAmount} onChange={e => setTdsState(s => ({ ...s, tdsAmount: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          )}
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
