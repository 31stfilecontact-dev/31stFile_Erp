"use client";
import { useEffect, useState, useCallback } from "react";
import { inr, fmtDate } from "@/lib/utils/format";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

const TYPE_ICONS: Record<string, string> = {
  PAYMENT: "payments", RECEIPT: "account_balance_wallet",
  JOURNAL: "edit_note", SALES: "point_of_sale",
  PURCHASE: "shopping_bag", CONTRA: "swap_horiz",
};
const TYPE_COLORS: Record<string, string> = {
  PAYMENT: "#9C6500", RECEIPT: "#00696d",
  JOURNAL: "#1b3a6b", SALES: "#00696d",
  PURCHASE: "#ba1a1a", CONTRA: "#5c3d9e",
};
const GROUP_COLORS: Record<string, string> = {
  Assets: "#00696d", Liabilities: "#1b3a6b",
  Income: "#00696d", Expenses: "#9C6500", Equity: "#5c3d9e",
};

interface VoucherLine {
  id: string; side: string; amount: number; lineNote: string | null;
  code: string; name: string; group: string;
}
interface VoucherData {
  id: string; entryDate: string; voucherType: string; voucherNo: string;
  narration: string; reference: string | null; fiscalYear: string;
  sourceType: string; utrNumber: string | null; upiId: string | null;
  status: string; createdAt: string;
  lines: VoucherLine[]; totalDr: number; totalCr: number; balanced: boolean;
}

interface Props {
  entryId: string | null;
  onClose: () => void;
}

export default function VoucherModal({ entryId, onClose }: Props) {
  const [data,    setData]    = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (id: string) => {
    setLoading(true); setData(null);
    const r = await fetch(`/api/entries/${id}`);
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (entryId) load(entryId);
  }, [entryId, load]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!entryId) return null;

  const typeColor = data ? (TYPE_COLORS[data.voucherType] ?? "#1b3a6b") : "#1b3a6b";
  const typeIcon  = data ? (TYPE_ICONS[data.voucherType]  ?? "receipt_long") : "receipt_long";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(0,0,0,0.48)", display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "16px",
        backdropFilter: "blur(4px)",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 680,
        maxHeight: "90vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(27,58,107,0.22)",
        overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid rgba(196,198,208,0.25)",
          background: `linear-gradient(135deg, ${typeColor}10, ${typeColor}04)`,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                background: `${typeColor}18`, display: "flex",
                alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={typeIcon} size={24} color={typeColor} />
              </div>
              <div>
                {loading ? (
                  <div style={{ height: 20, width: 160, borderRadius: 6,
                    background: "rgba(196,198,208,0.4)", marginBottom: 6 }} />
                ) : (
                  <p style={{ fontSize: 18, fontWeight: 800, color: "#131c2a",
                    fontFamily: "'Plus Jakarta Sans',sans-serif", lineHeight: 1.2 }}>
                    {data?.narration ?? "—"}
                  </p>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 5, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                    color: typeColor, background: `${typeColor}15`,
                    padding: "2px 8px", borderRadius: 6, fontWeight: 700,
                  }}>
                    {loading ? "…" : data?.voucherNo}
                  </span>
                  <span style={{ fontSize: 12, color: "#747780",
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    {loading ? "" : (data?.entryDate ? fmtDate(data.entryDate) : "")}
                  </span>
                  {data?.status === "POSTED" && (
                    <span style={{
                      fontSize: 10, padding: "2px 8px", borderRadius: 9999,
                      fontWeight: 700, background: "rgba(157,240,244,0.4)",
                      color: "#037074", fontFamily: "'Plus Jakarta Sans',sans-serif",
                    }}>✓ POSTED</span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose}
              style={{
                background: "rgba(196,198,208,0.2)", border: "none", cursor: "pointer",
                borderRadius: 10, padding: 8, color: "#747780", transition: "all 0.15s",
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(196,198,208,0.4)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(196,198,208,0.2)")}
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* ── Meta strip ── */}
        {data && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 0, borderBottom: "1px solid rgba(196,198,208,0.2)",
          }}>
            {[
              { label: "VOUCHER TYPE",  value: data.voucherType },
              { label: "FISCAL YEAR",   value: data.fiscalYear },
              { label: "SOURCE",        value: data.sourceType === "UPI" ? "📱 UPI" : "✏ Manual" },
              ...(data.reference ? [{ label: "REFERENCE", value: data.reference }] : []),
              ...(data.utrNumber ? [{ label: "UTR",       value: data.utrNumber }]  : []),
            ].map(m => (
              <div key={m.label} style={{
                padding: "10px 16px",
                borderRight: "1px solid rgba(196,198,208,0.2)",
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: "#747780",
                  textTransform: "uppercase", letterSpacing: "0.07em",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 3 }}>
                  {m.label}
                </p>
                <p style={{ fontSize: 13, color: "#131c2a",
                  fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 600 }}>
                  {m.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Lines table ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Icon name="autorenew" size={36} color="#00696d" />
              <p style={{ fontSize: 13, color: "#747780", marginTop: 10,
                fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Loading…</p>
            </div>
          ) : data?.lines.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <Icon name="warning" size={36} color="#9C6500" />
              <p style={{ fontSize: 13, color: "#747780", marginTop: 10,
                fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                No entry lines found for this voucher.
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{
                display: "grid", gridTemplateColumns: "80px 1fr 120px 120px",
                padding: "8px 20px", background: "#f5f6fa",
                borderBottom: "1px solid rgba(196,198,208,0.25)",
              }}>
                {["Account", "Name / Note", "Debit (₹)", "Credit (₹)"].map((h, i) => (
                  <p key={h} style={{
                    fontSize: 10, fontWeight: 700, color: "#44474f",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    textAlign: i >= 2 ? "right" : "left",
                  }}>{h}</p>
                ))}
              </div>

              {data?.lines.map((l, i) => {
                const gc = GROUP_COLORS[l.group] ?? "#1b3a6b";
                return (
                  <div key={l.id} style={{
                    display: "grid", gridTemplateColumns: "80px 1fr 120px 120px",
                    padding: "13px 20px", gap: 8,
                    borderBottom: "1px solid rgba(196,198,208,0.15)",
                    background: i % 2 === 0 ? "transparent" : "rgba(245,246,250,0.5)",
                    paddingLeft: l.side === "CR" ? 36 : 20,
                  }}>
                    <span style={{
                      fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
                      color: gc, background: `${gc}15`,
                      padding: "3px 7px", borderRadius: 6, fontWeight: 700,
                      display: "inline-block", alignSelf: "center",
                    }}>{l.code}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, color: "#131c2a",
                        fontFamily: "'Plus Jakarta Sans',sans-serif",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {l.name}
                      </p>
                      {l.lineNote && (
                        <p style={{ fontSize: 11, color: "#747780", marginTop: 1,
                          fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{l.lineNote}</p>
                      )}
                    </div>
                    <p style={{
                      fontSize: 14, fontFamily: "'JetBrains Mono',monospace", textAlign: "right",
                      fontWeight: l.side === "DR" ? 700 : 400,
                      color: l.side === "DR" ? "#9C6500" : "#c4c6d0",
                    }}>
                      {l.side === "DR" ? inr(l.amount) : "—"}
                    </p>
                    <p style={{
                      fontSize: 14, fontFamily: "'JetBrains Mono',monospace", textAlign: "right",
                      fontWeight: l.side === "CR" ? 700 : 400,
                      color: l.side === "CR" ? "#00696d" : "#c4c6d0",
                    }}>
                      {l.side === "CR" ? inr(l.amount) : "—"}
                    </p>
                  </div>
                );
              })}

              {/* Totals row */}
              {data && (
                <div style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 120px 120px",
                  padding: "12px 20px", background: "rgba(27,58,107,0.05)",
                  borderTop: "2px solid rgba(27,58,107,0.12)",
                }}>
                  <span />
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#131c2a",
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Total</p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#9C6500",
                    fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>
                    {inr(data.totalDr)}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: "#00696d",
                    fontFamily: "'JetBrains Mono',monospace", textAlign: "right" }}>
                    {inr(data.totalCr)}
                  </p>
                </div>
              )}
              {data && !data.balanced && (
                <div style={{ padding: "8px 20px", background: "rgba(186,26,26,0.08)" }}>
                  <p style={{ fontSize: 12, color: "#ba1a1a", fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    ⚠ Voucher is not balanced (DR ≠ CR)
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid rgba(196,198,208,0.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "#fafafa",
        }}>
          <p style={{ fontSize: 11, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            {data ? `Created ${new Date(data.createdAt).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}` : ""}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => window.print()}
              style={{
                padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: "pointer", border: "1px solid #c4c6d0", background: "white",
                fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#44474f",
                display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f5f6fa")}
              onMouseLeave={e => (e.currentTarget.style.background = "white")}
            >
              <Icon name="print" size={16} /> Print
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "8px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: "pointer", border: "none", background: "#1b3a6b",
                fontFamily: "'Plus Jakarta Sans',sans-serif", color: "white",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#142d57")}
              onMouseLeave={e => (e.currentTarget.style.background = "#1b3a6b")}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
