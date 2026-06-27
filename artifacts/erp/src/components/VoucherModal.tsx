import { useEffect, useState } from "react";
import { inr, fmtDate } from "@/lib/utils/format";

interface VoucherLine {
  id: string; accountCode: string; accountName: string;
  side: string; amount: number; note?: string | null;
}
interface Voucher {
  id: string; entryDate: string; voucherNo: string; voucherType: string;
  narration: string; reference?: string | null; status: string;
  lines: VoucherLine[];
  totalDr: number; totalCr: number;
}

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const TYPE_COLORS: Record<string, string> = {
  PAYMENT: "#ba1a1a", RECEIPT: "#00696d", JOURNAL: "#1b3a6b",
  SALES: "#00696d", PURCHASE: "#9C6500",
};

export default function VoucherModal({ entryId, onClose }: { entryId: string | null; onClose: () => void }) {
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entryId) { setVoucher(null); return; }
    setLoading(true);
    fetch(`/api/entries/${entryId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setVoucher)
      .catch(() => setVoucher(null))
      .finally(() => setLoading(false));
  }, [entryId]);

  if (!entryId) return null;

  const color = voucher ? (TYPE_COLORS[voucher.voucherType] || "#1b3a6b") : "#1b3a6b";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(19,28,42,0.55)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)", padding: 16
    }} onClick={onClose}>
      <div style={{
        background: "white", borderRadius: 20, width: "100%", maxWidth: 560,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 60px rgba(19,28,42,0.22)"
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px", borderBottom: "1px solid rgba(196,198,208,0.3)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start"
        }}>
          <div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{
                padding: "3px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 700,
                background: `${color}18`, color,
                fontFamily: "'Plus Jakarta Sans',sans-serif"
              }}>{voucher?.voucherType || "…"}</span>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                color: "#1b3a6b", fontWeight: 600
              }}>{voucher?.voucherNo}</span>
            </div>
            <h2 style={{
              fontSize: 18, fontWeight: 700, color: "#131c2a",
              fontFamily: "'Plus Jakarta Sans',sans-serif"
            }}>{voucher?.narration || "Loading…"}</h2>
            {voucher && (
              <p style={{ fontSize: 12, color: "#747780", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {fmtDate(voucher.entryDate)}{voucher.reference ? ` · Ref: ${voucher.reference}` : ""}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            padding: 6, borderRadius: 8, border: "none",
            background: "rgba(196,198,208,0.3)", cursor: "pointer"
          }}>
            <Icon name="close" size={20} color="#44474f" />
          </button>
        </div>

        {/* Lines */}
        <div style={{ padding: "16px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Icon name="autorenew" size={36} color="#00696d" />
            </div>
          ) : voucher ? (
            <>
              {/* Column headers */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
                padding: "8px 0", gap: 8, borderBottom: "2px solid rgba(196,198,208,0.4)"
              }}>
                {["Account", "DR (₹)", "CR (₹)", ""].map((h, i) => (
                  <p key={i} style={{
                    fontSize: 10, fontWeight: 700, color: "#747780",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    textAlign: i > 0 ? "right" : "left"
                  }}>{h}</p>
                ))}
              </div>

              {voucher.lines.map(line => (
                <div key={line.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
                  padding: "10px 0", gap: 8, borderBottom: "1px solid rgba(196,198,208,0.18)"
                }}>
                  <div>
                    <p style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      {line.accountName}
                    </p>
                    <p style={{ fontSize: 11, color: "#747780", fontFamily: "'JetBrains Mono',monospace" }}>
                      {line.accountCode}
                    </p>
                    {line.note && (
                      <p style={{ fontSize: 11, color: "#9C6500", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                        {line.note}
                      </p>
                    )}
                  </div>
                  <p style={{
                    textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                    color: line.side === "DR" ? "#9C6500" : "#c4c6d0", fontWeight: line.side === "DR" ? 600 : 400
                  }}>{line.side === "DR" ? inr(line.amount) : "—"}</p>
                  <p style={{
                    textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13,
                    color: line.side === "CR" ? "#00696d" : "#c4c6d0", fontWeight: line.side === "CR" ? 600 : 400
                  }}>{line.side === "CR" ? inr(line.amount) : "—"}</p>
                  <div />
                </div>
              ))}

              {/* Totals */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 80px 80px 80px",
                padding: "12px 0 0", gap: 8, borderTop: "2px solid rgba(196,198,208,0.4)"
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  TOTAL
                </p>
                <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#9C6500" }}>
                  {inr(voucher.totalDr)}
                </p>
                <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 700, color: "#00696d" }}>
                  {inr(voucher.totalCr)}
                </p>
                <div />
              </div>

              {/* Balanced check */}
              <div style={{
                marginTop: 12, padding: "8px 12px", borderRadius: 10,
                background: voucher.totalDr === voucher.totalCr
                  ? "rgba(220,242,232,0.7)" : "rgba(255,218,214,0.7)",
                display: "flex", alignItems: "center", gap: 8
              }}>
                <Icon
                  name={voucher.totalDr === voucher.totalCr ? "check_circle" : "error"}
                  size={16}
                  color={voucher.totalDr === voucher.totalCr ? "#00696d" : "#ba1a1a"}
                />
                <p style={{
                  fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif",
                  color: voucher.totalDr === voucher.totalCr ? "#00696d" : "#ba1a1a"
                }}>
                  {voucher.totalDr === voucher.totalCr ? "Entry is balanced" : "Entry is NOT balanced — DR ≠ CR"}
                </p>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 14, color: "#747780", textAlign: "center", padding: 40 }}>
              Could not load voucher.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
