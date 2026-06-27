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

export default function TdsReturnsPage() {
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [section, setSection] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    let url = `/api/reports/tds-summary?from=${from}&to=${to}`;
    if (section) url += `&section=${section}`;
    fetch(url)
      .then(r => r.ok ? r.json() : null).then(d => d && setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [from, to, section]);

  const rows = data?.rows || [];
  const totalTds = data?.totalTds || 0;

  const handleExport = (type: "pdf" | "excel") => {
    const title = "Form 26Q TDS Summary";
    const header = ["Vendor Name", "PAN", "Section", "Base Amount", "TDS Amount", "FY"];
    const exportRows = rows.map((r: any) => [r.vendorName, r.pan, r.section, r.baseAmount, r.tdsAmount, r.fy]);
    if (type === "pdf") exportToPDF("tds_summary", `${title} (${from} to ${to})`, header, exportRows);
    else exportToExcel("tds_summary", header, exportRows);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="assignment" size={26} color="var(--text-primary)" />
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-body)", fontFamily: "'Plus Jakarta Sans',sans-serif", flex: 1 }}>
          Form 26Q (TDS Returns)
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
          <div>
            <label className="label-field">Section Filter</label>
            <select className="input-field" value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              <option value="194C">194C (Contractors)</option>
              <option value="194J">194J (Professional Services)</option>
              <option value="194I">194I (Rent)</option>
            </select>
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

      <div className="glass-card overflow-hidden mt-4">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 120px 120px 100px", gap: 8, padding: "10px 16px", background: "var(--text-primary)" }}>
          {["Vendor", "PAN", "Section", "Base Amount", "TDS Amount", "FY"].map((h, i) => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: (i === 3 || i === 4) ? "right" : "left" }}>{h}</p>
          ))}
        </div>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><Icon name="autorenew" size={40} color="var(--text-accent)" /></div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-muted)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No TDS data found for this period.</p>
          </div>
        ) : rows.map((r: any, i: number) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 120px 120px 100px", gap: 8, padding: "10px 16px", borderBottom: "1px solid rgba(196,198,208,0.18)", background: i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.28)" }}>
            <p style={{ fontSize: 12, fontWeight: 600 }}>{r.vendorName}</p>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{r.pan}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: "var(--text-accent)" }}>{r.section}</span>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{inr(r.baseAmount)}</p>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600, color: "var(--text-danger)" }}>{inr(r.tdsAmount)}</p>
            <p style={{ fontSize: 12 }}>{r.fy}</p>
          </div>
        ))}
        {rows.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 100px 120px 120px 100px", gap: 8, padding: "14px 16px", background: "var(--text-primary)", borderTop: "2px solid rgba(255,255,255,0.15)" }}>
            <span style={{ gridColumn: "1 / 5", fontSize: 12, fontWeight: 700, color: "white", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL TDS DEDUCTED</span>
            <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: "white", fontWeight: 700 }}>{inr(totalTds)}</p>
            <span></span>
          </div>
        )}
      </div>
    </div>
  );
}
