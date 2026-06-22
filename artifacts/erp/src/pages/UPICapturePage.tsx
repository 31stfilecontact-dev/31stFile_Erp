import { useState, useRef, useEffect, useCallback } from "react";
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

interface StagedTxn extends UPITxn {
  accountId?: string;
  accountName?: string;
  selected: boolean;
}

interface Account { id: string; code: string; name: string; group: string; }
interface Rule { id: string; keyword: string; accountId: string; accountName: string; }

function applyRules(txns: StagedTxn[], rules: Rule[]): StagedTxn[] {
  return txns.map(t => {
    if (t.accountId) return t;
    const merchantLower = t.merchant.toLowerCase();
    const matched = rules.find(r => merchantLower.includes(r.keyword));
    if (matched) {
      return { ...t, accountId: matched.accountId, accountName: matched.accountName, matchStatus: "MATCHED" as const };
    }
    return t;
  });
}

export default function UPICapturePage() {
  const [tab, setTab] = useState<Tab>("sms");
  const [txns, setTxns] = useState<StagedTxn[]>([]);
  const [smsText, setSmsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [showRules, setShowRules] = useState(false);
  const [newRuleKeyword, setNewRuleKeyword] = useState("");
  const [newRuleAccountId, setNewRuleAccountId] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/upi/accounts").then(r => r.json()).then(setAccounts).catch(() => {});
    fetch("/api/upi/rules").then(r => r.json()).then(setRules).catch(() => {});
  }, []);

  const stageTransactions = useCallback((parsed: UPITxn[]) => {
    const staged: StagedTxn[] = parsed.map(t => ({ ...t, selected: true }));
    const withRules = applyRules(staged, rules);
    setTxns(withRules);
  }, [rules]);

  async function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const parsed = await parseUPICSV(file);
    stageTransactions(parsed);
    setLoading(false);
  }

  function parseSMSAuto(text: string) {
    setSmsText(text);
    if (text.trim().length > 20) {
      const parsed = parseUPISMS(text);
      if (parsed.length) stageTransactions(parsed);
    }
  }

  function parseSMSManual() {
    const parsed = parseUPISMS(smsText);
    stageTransactions(parsed);
  }

  function setAccount(id: string, accountId: string) {
    const acct = accounts.find(a => a.id === accountId);
    setTxns(prev => prev.map(t => t.id === id ? { ...t, accountId, accountName: acct?.name } : t));
  }

  function toggleSelect(id: string) {
    setTxns(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t));
  }

  function toggleAll(val: boolean) {
    setTxns(prev => prev.map(t => ({ ...t, selected: val })));
  }

  const selectedWithAccount = txns.filter(t => t.selected && t.accountId);
  const selectedCount = txns.filter(t => t.selected).length;

  async function postSelected() {
    if (!selectedWithAccount.length) return;
    setPosting(true);
    try {
      const res = await fetch("/api/entries/upi-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: selectedWithAccount.map(t => ({
            ...t,
            accountId: t.accountId,
          })),
        }),
      });
      const data = await res.json();
      setResult(data);
      if (res.ok) {
        setTxns(prev => prev.filter(t => !selectedWithAccount.some(s => s.id === t.id)));
      }
    } catch { setResult({ success: 0, failed: selectedWithAccount.length }); }
    finally { setPosting(false); }
  }

  async function saveRule() {
    if (!newRuleKeyword.trim() || !newRuleAccountId) return;
    const res = await fetch("/api/upi/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: newRuleKeyword, accountId: newRuleAccountId }),
    });
    if (res.ok) {
      const rule = await res.json();
      setRules(prev => [...prev, rule]);
      setNewRuleKeyword(""); setNewRuleAccountId("");
      setTxns(prev => applyRules(prev, [...rules, rule]));
    }
  }

  async function deleteRule(id: string) {
    await fetch(`/api/upi/rules/${id}`, { method: "DELETE" });
    setRules(prev => prev.filter(r => r.id !== id));
  }

  const card: React.CSSProperties = { background: "rgba(255,255,255,0.92)", border: "1px solid rgba(196,198,208,0.35)", borderRadius: 16, boxShadow: "0 2px 16px rgba(0,36,82,0.06)" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(0,105,109,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="phone_iphone" size={24} color="#00696d" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>UPI Capture</h1>
            <p style={{ fontSize: 12, color: "#747780", marginTop: 2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Import · Verify · Post to Ledger
            </p>
          </div>
        </div>
        <button onClick={() => setShowRules(v => !v)} className="btn-outline" style={{ fontSize: 12 }}>
          <Icon name="rule" size={15} /> Auto-Rules {rules.length > 0 ? `(${rules.length})` : ""}
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: result.failed === 0 ? "rgba(220,242,232,0.7)" : "rgba(255,243,214,0.7)", borderLeft: `4px solid ${result.failed === 0 ? "#00696d" : "#9C6500"}`, display: "flex", gap: 8, alignItems: "center" }}>
          <Icon name={result.failed === 0 ? "check_circle" : "warning"} size={16} color={result.failed === 0 ? "#00696d" : "#9C6500"} />
          <p style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#131c2a", flex: 1 }}>
            Posted {result.success} transactions.{result.failed > 0 ? ` ${result.failed} failed (no account assigned?).` : ""}
          </p>
          <button onClick={() => setResult(null)} style={{ border: "none", background: "none", cursor: "pointer", color: "#747780" }}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}

      {/* Auto-Rules panel */}
      {showRules && (
        <div style={{ ...card, padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>
            Auto-Classification Rules
          </h3>
          <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 12 }}>
            If a merchant name contains the keyword, the account is auto-assigned on import.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 12 }}>
            <input className="input-field" style={{ fontSize: 13 }} placeholder="Keyword (e.g. swiggy)" value={newRuleKeyword} onChange={e => setNewRuleKeyword(e.target.value)} />
            <select className="input-field" style={{ fontSize: 13 }} value={newRuleAccountId} onChange={e => setNewRuleAccountId(e.target.value)}>
              <option value="">— Select Account —</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
            </select>
            <button className="btn-primary" style={{ fontSize: 12 }} onClick={saveRule} disabled={!newRuleKeyword.trim() || !newRuleAccountId}>
              <Icon name="add" size={15} color="white" /> Add
            </button>
          </div>
          {rules.length === 0 ? (
            <p style={{ fontSize: 12, color: "#b0b3bf", fontStyle: "italic", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>No rules yet.</p>
          ) : rules.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid rgba(196,198,208,0.2)" }}>
              <Icon name="rule" size={14} color="#00696d" />
              <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", flex: 1 }}>{r.keyword}</span>
              <span style={{ fontSize: 12, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>→ {r.accountName}</span>
              <button onClick={() => deleteRule(r.id)} style={{ border: "none", background: "none", cursor: "pointer", color: "#ba1a1a", padding: 2 }}>
                <Icon name="delete" size={15} color="#ba1a1a" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "rgba(231,238,255,0.6)", borderRadius: 12, padding: 4 }}>
        {([["sms", "SMS / Text", "sms"], ["csv", "CSV Import", "upload_file"], ["manual", "Manual", "edit"]] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 4px", borderRadius: 8, border: "none", cursor: "pointer", transition: "all 0.15s", background: tab === id ? "white" : "transparent", boxShadow: tab === id ? "0 2px 8px rgba(27,58,107,0.10)" : "none", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 13, fontWeight: 600, color: tab === id ? "#00696d" : "#747780" }}>
            <Icon name={icon} size={18} color={tab === id ? "#00696d" : "#747780"} /> {label}
          </button>
        ))}
      </div>

      {/* SMS Tab */}
      {tab === "sms" && (
        <div style={{ ...card, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", marginBottom: 4 }}>
              Paste SMS messages below
            </p>
            <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Transactions are auto-detected as you type. Supports HDFC, SBI, ICICI, Axis, Paytm, PhonePe, Kotak SMS formats.
            </p>
          </div>
          <textarea className="input-field" rows={7}
            style={{ resize: "vertical", fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}
            placeholder={"Paste one or more SMS messages here, e.g.:\n\nHDFC Bank: Rs.1500.00 debited from a/c **1234 on 20-06-26 to VPA zomato@upi (UPI Ref. 123456789012). Avl Bal Rs.45000.00\n\nDear Customer, Rs.5000.00 has been credited to your HDFC Bank a/c on 22-06-26 by UPI from abc@ybl Ref 987654321098"}
            value={smsText}
            onChange={e => parseSMSAuto(e.target.value)} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={parseSMSManual} className="btn-primary" style={{ fontSize: 13 }}>
              <Icon name="auto_fix_high" size={16} color="white" /> Parse Now
            </button>
            {smsText && <button onClick={() => { setSmsText(""); setTxns([]); }} className="btn-ghost" style={{ fontSize: 13 }}>
              <Icon name="clear" size={15} /> Clear
            </button>}
          </div>
        </div>
      )}

      {/* CSV Tab */}
      {tab === "csv" && (
        <div style={{ ...card, padding: 24 }}>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCSV} />
          <div
            style={{ border: "2px dashed rgba(196,198,208,0.6)", borderRadius: 16, padding: 40, textAlign: "center", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={async e => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) { setLoading(true); stageTransactions(await parseUPICSV(file)); setLoading(false); }
            }}>
            <Icon name="upload_file" size={44} color="#c4c6d0" />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#44474f", marginTop: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              Drop your bank statement CSV
            </p>
            <p style={{ fontSize: 12, color: "#747780", marginTop: 4, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              HDFC · SBI · ICICI · Axis · Paytm · PhonePe
            </p>
            <button className="btn-primary" style={{ marginTop: 16, fontSize: 13 }} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              <Icon name="folder_open" size={16} color="white" /> Choose File
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ ...card, padding: 48, textAlign: "center" }}>
          <Icon name="autorenew" size={40} color="#00696d" />
          <p style={{ fontSize: 13, color: "#747780", marginTop: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>Parsing…</p>
        </div>
      )}

      {/* Staging table */}
      {txns.length > 0 && (
        <div style={{ ...card, overflow: "hidden" }}>
          {/* Table header bar */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(196,198,208,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {txns.length} Transactions Detected
              </h2>
              <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Assign accounts, then post selected to ledger.
                {" "}<span style={{ color: "#00696d", fontWeight: 600 }}>{txns.filter(t => t.matchStatus === "MATCHED").length} auto-matched</span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                {selectedCount} selected · {selectedWithAccount.length} ready to post
              </span>
              <button
                onClick={postSelected}
                disabled={posting || selectedWithAccount.length === 0}
                className="btn-primary"
                style={{ fontSize: 13 }}>
                {posting
                  ? <><Icon name="autorenew" size={15} /> Posting…</>
                  : <><Icon name="publish" size={15} color="white" /> Post {selectedWithAccount.length > 0 ? selectedWithAccount.length : ""} to Ledger</>}
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div style={{ display: "grid", gridTemplateColumns: "32px 90px 1fr 160px 100px 70px 60px", gap: 8, padding: "8px 16px", background: "rgba(240,243,255,0.6)", alignItems: "center" }}>
            <input type="checkbox" checked={selectedCount === txns.length} onChange={e => toggleAll(e.target.checked)}
              style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#00696d" }} />
            {["Date", "Merchant / Description", "Account to assign", "Amount", "Type", ""].map((h, i) => (
              <p key={i} style={{ fontSize: 10, fontWeight: 700, color: "#747780", textTransform: "uppercase", letterSpacing: "0.05em", fontFamily: "'Plus Jakarta Sans',sans-serif", textAlign: i >= 3 ? "right" : "left", margin: 0 }}>{h}</p>
            ))}
          </div>

          {txns.slice(0, 100).map((t, i) => {
            const isMatched = t.matchStatus === "MATCHED" && !!t.accountId;
            const isReady = !!t.accountId;
            return (
              <div key={t.id} style={{
                display: "grid", gridTemplateColumns: "32px 90px 1fr 160px 100px 70px 60px", gap: 8, padding: "10px 16px",
                borderBottom: "1px solid rgba(196,198,208,0.15)",
                background: isMatched ? "rgba(220,242,232,0.18)" : i % 2 === 0 ? "transparent" : "rgba(240,243,255,0.15)",
                alignItems: "center",
              }}>
                <input type="checkbox" checked={t.selected} onChange={() => toggleSelect(t.id)}
                  style={{ width: 15, height: 15, cursor: "pointer", accentColor: "#00696d" }} />
                <span style={{ fontSize: 12, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{t.date}</span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: "#131c2a", fontFamily: "'Plus Jakarta Sans',sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                    {t.merchant}
                  </p>
                  {t.utr && <p style={{ fontSize: 10, color: "#b0b3bf", fontFamily: "'JetBrains Mono',monospace" }}>UTR: {t.utr}</p>}
                </div>
                <div>
                  <select
                    value={t.accountId || ""}
                    onChange={e => setAccount(t.id, e.target.value)}
                    style={{
                      width: "100%", padding: "5px 8px", fontSize: 12,
                      border: `1px solid ${isReady ? "#00696d" : "#c4c6d0"}`,
                      borderRadius: 8, fontFamily: "'Plus Jakarta Sans',sans-serif",
                      background: isMatched ? "rgba(220,242,232,0.4)" : "white",
                      color: isReady ? "#131c2a" : "#b0b3bf", outline: "none", cursor: "pointer",
                    }}>
                    <option value="">— Select account —</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}
                  </select>
                </div>
                <p style={{ textAlign: "right", fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: t.type === "DEBIT" ? "#ba1a1a" : "#00696d", fontWeight: 700 }}>
                  {inr(t.amount)}
                </p>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    display: "inline-block", fontSize: 10, padding: "3px 7px", borderRadius: 9999, fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    background: t.type === "DEBIT" ? "rgba(255,218,214,0.7)" : "rgba(220,242,232,0.7)",
                    color: t.type === "DEBIT" ? "#ba1a1a" : "#00696d",
                  }}>{t.type}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  {isMatched
                    ? <span title="Auto-matched by rule"><Icon name="auto_awesome" size={15} color="#00696d" /></span>
                    : <span style={{ fontSize: 10, color: "#b0b3bf" }}>{t.source}</span>}
                </div>
              </div>
            );
          })}

          {txns.length > 100 && (
            <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid rgba(196,198,208,0.15)" }}>
              <p style={{ fontSize: 12, color: "#747780", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                Showing 100 of {txns.length}. Assign accounts and post in batches.
              </p>
            </div>
          )}

          {/* DR/CR guide */}
          <div style={{ padding: "10px 16px", background: "rgba(240,243,255,0.4)", borderTop: "1px solid rgba(196,198,208,0.15)", display: "flex", gap: 20, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <strong>DEBIT:</strong> DR selected account → CR Bank (1002)
            </span>
            <span style={{ fontSize: 11, color: "#44474f", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <strong>CREDIT:</strong> DR Bank (1002) → CR selected account
            </span>
          </div>
        </div>
      )}

      {txns.length === 0 && !loading && tab === "sms" && !smsText && (
        <div style={{ ...card, padding: 48, textAlign: "center" }}>
          <Icon name="sms" size={44} color="#c4c6d0" />
          <p style={{ fontSize: 14, fontWeight: 600, color: "#44474f", marginTop: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Paste bank SMS messages above
          </p>
          <p style={{ fontSize: 12, color: "#b0b3bf", marginTop: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Transactions are detected automatically — you verify and post.
          </p>
        </div>
      )}
    </div>
  );
}
