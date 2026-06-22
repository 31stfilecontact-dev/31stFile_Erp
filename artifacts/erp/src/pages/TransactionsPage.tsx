import { useEffect, useState } from "react";
import { Link } from "wouter";
import { fmtDate, inr } from "@/lib/utils/format";
import VoucherModal from "@/components/VoucherModal";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const TYPES = ["ALL", "PAYMENT", "RECEIPT", "JOURNAL", "SALES", "PURCHASE"];

export default function TransactionsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [voucherId, setVoucherId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/entries").then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    const matchType = filter === "ALL" || e.voucherType === filter;
    const matchSearch = !search ||
      e.narration?.toLowerCase().includes(search.toLowerCase()) ||
      e.voucherNo?.toLowerCase().includes(search.toLowerCase()) ||
      e.reference?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalDr = (lines: any[]) => lines?.filter((l: any) => l.side === "DR").reduce((s: number, l: any) => s + parseFloat(l.amount), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          Transactions
        </h1>
        <Link href="/journal-entry">
          <a className="btn-primary" style={{ fontSize: 12 }}>
            <Icon name="add" size={16} color="white" /> New
          </a>
        </Link>
      </div>

      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="search" size={20} color="#747780" />
        </span>
        <input type="text" className="input-field" style={{ paddingLeft: 40 }}
          placeholder="Search narration, voucher no..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TYPES.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "5px 14px", borderRadius: 9999, fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all 0.15s",
              background: filter === f ? "#00696d" : "transparent",
              color: filter === f ? "white" : "#747780",
              border: filter === f ? "none" : "1px solid #c4c6d0",
            }}>{f}</button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Icon name="autorenew" size={40} color="#00696d" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center" }}>
            <Icon name="inbox" size={44} color="#c4c6d0" />
            <p style={{ fontSize: 14, color: "#747780", marginTop: 10, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {entries.length === 0 ? "No entries yet." : "No entries match your search."}
            </p>
            {entries.length === 0 && (
              <Link href="/journal-entry">
                <a className="btn-primary" style={{ display: "inline-flex", marginTop: 12 }}>Create First Entry</a>
              </Link>
            )}
          </div>
        ) : (
          filtered.map(e => {
            const lines: any[] = e.lines || [];
            const amount = totalDr(lines);
            const isExpanded = expanded === e.id;

            return (
              <div key={e.id} style={{ borderBottom: "1px solid rgba(196,198,208,0.2)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer", transition: "background 0.15s" }}
                  onClick={() => setExpanded(isExpanded ? null : e.id)}
                  onMouseEnter={ev => (ev.currentTarget.style.background = "rgba(240,243,255,0.7)")}
                  onMouseLeave={ev => (ev.currentTarget.style.background = "transparent")}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(231,238,255,0.7)" }}>
                    <Icon name={e.voucherType === "PAYMENT" ? "arrow_upward" : e.voucherType === "RECEIPT" ? "arrow_downward" : "receipt"} size={20} color={e.voucherType === "PAYMENT" ? "#ba1a1a" : e.voucherType === "RECEIPT" ? "#00696d" : "#1b3a6b"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.narration}
                    </p>
                    <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#747780" }}>{e.voucherNo}</span>
                      <span style={{ color: "#c4c6d0", fontSize: 10 }}>·</span>
                      <span style={{ fontSize: 11, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {e.entryDate ? fmtDate(e.entryDate) : "—"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                    {amount > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 700, color: "#131c2a" }}>
                        {inr(amount)}
                      </span>
                    )}
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 9999, fontWeight: 700, background: "#e7eeff", color: "#1b3a6b", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      {e.voucherType}
                    </span>
                    <span style={{ fontSize: 14, color: "#c4c6d0", transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s", display: "inline-flex" }}>
                      <Icon name="expand_more" size={18} color="#747780" />
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ background: "rgba(240,243,255,0.5)", padding: "12px 16px 16px", borderTop: "1px solid rgba(196,198,208,0.15)" }}>
                    {/* DR/CR lines table */}
                    {lines.length > 0 ? (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px 14px", marginBottom: 6 }}>
                          {["", "Account", "DR", "CR"].map((h, i) => (
                            <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#747780", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: i >= 2 ? "right" : "left" }}>{h}</span>
                          ))}
                        </div>
                        {lines.map((l: any, li: number) => (
                          <div key={li} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px 14px", padding: "6px 0", borderBottom: "1px solid rgba(196,198,208,0.12)", alignItems: "center" }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800, fontFamily: "'Plus Jakarta Sans',sans-serif",
                              background: l.side === "DR" ? "rgba(186,26,26,0.1)" : "rgba(0,105,109,0.1)",
                              color: l.side === "DR" ? "#ba1a1a" : "#00696d",
                              borderRadius: 4, padding: "2px 5px",
                            }}>{l.side}</span>
                            <span style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                              {l.accountCode && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: "#747780", marginRight: 6 }}>{l.accountCode}</span>}
                              {l.accountName}
                            </span>
                            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#ba1a1a", textAlign: "right", fontWeight: 600 }}>
                              {l.side === "DR" ? inr(parseFloat(l.amount)) : "—"}
                            </span>
                            <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#00696d", textAlign: "right", fontWeight: 600 }}>
                              {l.side === "CR" ? inr(parseFloat(l.amount)) : "—"}
                            </span>
                          </div>
                        ))}
                        {/* Totals */}
                        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "6px 14px", padding: "8px 0 0" }}>
                          <span />
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>TOTAL</span>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#ba1a1a", textAlign: "right", fontWeight: 700 }}>
                            {inr(lines.filter(l => l.side === "DR").reduce((s: number, l: any) => s + parseFloat(l.amount), 0))}
                          </span>
                          <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: "#00696d", textAlign: "right", fontWeight: 700 }}>
                            {inr(lines.filter(l => l.side === "CR").reduce((s: number, l: any) => s + parseFloat(l.amount), 0))}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: 12, color: "#b0b3bf", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>No line details available.</p>
                    )}
                    <button className="btn-outline" style={{ fontSize: 12, padding: "6px 14px" }}
                      onClick={() => setVoucherId(e.id)}>
                      <Icon name="visibility" size={14} /> Full Voucher
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <VoucherModal entryId={voucherId} onClose={() => setVoucherId(null)} />
    </div>
  );
}
