import { useState, useEffect } from "react";
import { inr } from "@/lib/utils/format";
import { exportToExcel, exportToPDF } from "@/lib/utils/export";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

export default function GstReturnsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("gstr1");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/reports/gst-summary?from=${from}&to=${to}`)
      .then(r => r.ok ? r.json() : null).then(d => d && setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [from, to]);

  const outward = data?.outward || [];
  const inward = data?.inward || [];

  const renderTable = (rows: any[], title: string) => {
    const totalTaxable = rows.reduce((s, r) => s + parseFloat(r.taxableAmount || 0), 0);
    const totalGst = rows.reduce((s, r) => s + parseFloat(r.totalGst || 0), 0);
    
    return (
      <div className="glass-card overflow-hidden mt-4">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px 100px 100px 100px", gap: 8, padding: "10px 16px", background: "var(--text-primary)" }}>
          {["HSN Code", "Description", "Taxable Value", "CGST", "SGST", "IGST", "Total GST"].map((h, i) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: i >= 2 ? "right" : "left" }}>{h}</p>
          ))}
        </div>
        {rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No data for selected period.</p>
          </div>
        ) : rows.map((r, i) => (
          <div key={r.hsnCode} style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px 100px 100px 100px", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(196,198,208,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.28)" }}>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>{r.hsnCode}</span>
            <p style={{ fontSize: 12 }}>{r.description || "-"}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{inr(r.taxableAmount)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{inr(r.cgstAmount)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{inr(r.sgstAmount)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{inr(r.igstAmount)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600 }}>{inr(r.totalGst)}</p>
          </div>
        ))}
        {rows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 100px 100px 100px 100px 100px", gap: 8, padding: "14px 16px", background: "var(--text-primary)", borderTop: "2px solid rgba(255,255,255,0.15)" }}>
            <span style={{ gridColumn: "1 / 3", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL {title}</span>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "white", fontWeight: 700 }}>{inr(totalTaxable)}</p>
            <span style={{ gridColumn: "4 / 7" }}></span>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "white", fontWeight: 700 }}>{inr(totalGst)}</p>
          </div>
        )}
      </div>
    );
  };

  const handleExport = (type: "pdf" | "excel") => {
    const title = tab === "gstr1" ? "GSTR-1 Outward Supplies" : "GSTR-2 ITC / Inward Supplies";
    const ds = tab === "gstr1" ? outward : inward;
    const header = ["HSN Code", "Description", "Taxable Value", "CGST", "SGST", "IGST", "Total GST"];
    const rows = ds.map((r: any) => [r.hsnCode, r.description || "-", r.taxableAmount, r.cgstAmount, r.sgstAmount, r.igstAmount, r.totalGst]);
    if (type === "pdf") exportToPDF(tab, `${title} (${from} to ${to})`, header, rows);
    else exportToExcel(tab, header, rows);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="receipt_long" size={26} color="var(--text-primary)" />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", flex: 1 }}>
          GST Returns
        </h1>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div>
            <label className="label-field">From Date</label>
            <input type="date" className="input-field" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label-field">To Date</label>
            <input type="date" className="input-field" value={to} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={() => handleExport("pdf")} className="btn-outline" style={{ fontSize: 12 }}>
            <Icon name="picture_as_pdf" size={16} /> PDF
          </button>
          <button onClick={() => handleExport("excel")} className="btn-primary" style={{ fontSize: 12 }}>
            <Icon name="table_view" size={16} color="white" /> Excel
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 2, background: "var(--bg-hover)", borderRadius: 12, padding: 4, width: "fit-content" }}>
        <button onClick={() => setTab("gstr1")}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === "gstr1" ? "white" : "transparent", boxShadow: tab === "gstr1" ? "0 2px 8px var(--bg-icon)" : "none", color: tab === "gstr1" ? "var(--text-accent)" : "var(--text-muted)", fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          GSTR-1 (Outward)
        </button>
        <button onClick={() => setTab("gstr2")}
          style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: tab === "gstr2" ? "white" : "transparent", boxShadow: tab === "gstr2" ? "0 2px 8px var(--bg-icon)" : "none", color: tab === "gstr2" ? "var(--text-accent)" : "var(--text-muted)", fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          GSTR-2/ITC (Inward)
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center" }}><Icon name="autorenew" size={40} color="var(--text-accent)" /></div>
      ) : (
        tab === "gstr1" ? renderTable(outward, "OUTWARD SUPPLIES") : renderTable(inward, "INWARD SUPPLIES")
      )}
    </div>
  );
}
