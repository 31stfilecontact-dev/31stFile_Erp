"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

function Icon({ name, size=20, color="", style }: { name:string; size?:number; color?:string; style?:CSSProperties }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize:size, lineHeight:1, color:color||"inherit", ...style }}>
      {name}
    </span>
  );
}

const GROUP_COLORS: Record<string,string> = {
  Assets:"#00696d", Liabilities:"#1b3a6b", Income:"#00696d", Expenses:"#9C6500", Equity:"#5c3d9e",
};
const GROUPS = ["Assets","Liabilities","Equity","Income","Expenses"];

interface Account {
  id:string; code:string; name:string; group:string; subGroup?:string; normalBal:string;
}

export default function LedgerIndexPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [group,    setGroup]    = useState("ALL");

  useEffect(() => {
    fetch("/api/accounts").then(r => r.json())
      .then(d => { setAccounts(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = accounts.filter(a => {
    const matchGroup  = group === "ALL" || a.group === group;
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#131c2a",
          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Ledger
        </h1>
        <p style={{ fontSize:13, color:"#747780", marginTop:4,
          fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          Select an account to view its full transaction history with running balance.
        </p>
      </div>

      {/* Search */}
      <div style={{ position:"relative" }}>
        <Icon name="search" size={20} color="#747780"
          style={{ position:"absolute" as any, left:12, top:"50%", transform:"translateY(-50%)" }} />
        <input type="text" className="input-field" style={{ paddingLeft:40 }}
          placeholder="Search by account name or code…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Group filter */}
      <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
        {["ALL", ...GROUPS].map(g => (
          <button key={g} onClick={() => setGroup(g)}
            style={{ padding:"5px 14px", borderRadius:9999, fontSize:11, fontWeight:700,
              cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif", transition:"all 0.15s",
              background: group===g ? (GROUP_COLORS[g]||"#1b3a6b") : "transparent",
              color: group===g ? "white" : "#747780",
              border: group===g ? "none" : "1px solid #c4c6d0" }}>
            {g}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div style={{ padding:60, textAlign:"center" }}>
            <Icon name="autorenew" size={40} color="#00696d" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:48, textAlign:"center" }}>
            <Icon name="menu_book" size={44} color="#c4c6d0" />
            <p style={{ fontSize:14, color:"#747780", marginTop:10,
              fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              No accounts match your search.
            </p>
          </div>
        ) : (
          GROUPS.filter(g => group==="ALL" || group===g).map(grp => {
            const accts = filtered.filter(a => a.group === grp);
            if (!accts.length) return null;
            const c = GROUP_COLORS[grp] || "#1b3a6b";
            return (
              <div key={grp}>
                <div style={{ padding:"8px 16px", background:"#1b3a6b",
                  borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.8)",
                    letterSpacing:"0.1em", textTransform:"uppercase",
                    fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                    {grp}
                  </span>
                  <span style={{ fontSize:10, color:"rgba(137,165,221,0.7)", marginLeft:8,
                    fontFamily:"'JetBrains Mono',monospace" }}>
                    {accts.length} accounts
                  </span>
                </div>
                {accts.map(a => (
                  <button key={a.id}
                    onClick={() => router.push(`/ledger/${a.code}`)}
                    style={{ display:"flex", alignItems:"center", gap:12,
                      width:"100%", padding:"13px 16px", background:"none", border:"none",
                      borderBottom:"1px solid rgba(196,198,208,0.18)", cursor:"pointer",
                      textAlign:"left", transition:"background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background="rgba(240,243,255,0.7)")}
                    onMouseLeave={e => (e.currentTarget.style.background="transparent")}>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                      color:c, background:`${c}18`, padding:"3px 8px",
                      borderRadius:6, fontWeight:600, flexShrink:0 }}>
                      {a.code}
                    </span>
                    <span style={{ flex:1, fontSize:13, color:"#131c2a",
                      fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                      {a.name}
                    </span>
                    {a.subGroup && (
                      <span style={{ fontSize:11, color:"#747780",
                        fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        {a.subGroup}
                      </span>
                    )}
                    <span style={{ fontSize:10, padding:"2px 7px", borderRadius:9999, fontWeight:700,
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                      background: a.normalBal==="DR" ? "rgba(157,240,244,0.35)" : "rgba(255,243,214,0.6)",
                      color: a.normalBal==="DR" ? "#037074" : "#9C6500" }}>
                      {a.normalBal}
                    </span>
                    <Icon name="chevron_right" size={18} color="#c4c6d0" />
                  </button>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
