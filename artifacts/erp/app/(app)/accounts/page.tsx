"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

function Icon({ name, size=20, color="" }: { name:string;size?:number;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit"}}>{name}</span>;
}

const GROUP_COLORS: Record<string,string> = {
  Assets:"#00696d", Liabilities:"#1b3a6b", Income:"#00696d", Expenses:"#9C6500",
};
const GROUPS = ["Assets","Liabilities","Income","Expenses"];

interface Account {
  id:string; code:string; name:string; group:string;
  subGroup?:string; normalBal:string; isActive:boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [groupFilter, setGF]    = useState("ALL");
  const [showAdd, setShowAdd]   = useState(false);
  const [newAcc, setNewAcc]     = useState({ code:"", name:"", group:"Expenses", subGroup:"Operating", normalBal:"DR" });
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState("");

  useEffect(()=>{
    fetch("/api/accounts").then(r=>r.json())
      .then(d=>{ setAccounts(Array.isArray(d)?d:[]); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  async function addAccount() {
    if(!newAcc.code||!newAcc.name) return;
    setSaving(true);
    const res = await fetch("/api/accounts",{
      method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(newAcc),
    });
    const data = await res.json();
    if(res.ok) {
      setAccounts(p=>[...p, data.account]);
      setShowAdd(false);
      setNewAcc({code:"",name:"",group:"Expenses",subGroup:"Operating",normalBal:"DR"});
      setMsg("Account added successfully!");
      setTimeout(()=>setMsg(""),3000);
    }
    setSaving(false);
  }

  const filtered = accounts.filter(a=>{
    const matchGroup = groupFilter==="ALL" || a.group===groupFilter;
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    return matchGroup && matchSearch && a.isActive;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Chart of Accounts
        </h1>
        <button onClick={()=>setShowAdd(!showAdd)} className="btn-primary" style={{fontSize:12}}>
          <Icon name="add" size={16}/> Add Account
        </button>
      </div>

      {msg&&(
        <div className="glass-card-sm p-3 flex gap-2" style={{borderLeft:"4px solid #00696d"}}>
          <Icon name="check_circle" size={18} color="#00696d"/>
          <p style={{fontSize:13,color:"#00696d",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{msg}</p>
        </div>
      )}

      {/* Add form */}
      {showAdd&&(
        <div className="glass-card p-4 space-y-3">
          <h3 style={{fontSize:15,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            New Account
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Account Code *</label>
              <input type="text" className="input-mono" placeholder="e.g. 4209"
                value={newAcc.code} onChange={e=>setNewAcc(p=>({...p,code:e.target.value}))}/>
            </div>
            <div>
              <label className="label-field">Normal Balance</label>
              <div style={{display:"flex",border:"1px solid #c4c6d0",borderRadius:8,overflow:"hidden",height:42}}>
                {(["DR","CR"] as const).map(s=>(
                  <button key={s} onClick={()=>setNewAcc(p=>({...p,normalBal:s}))}
                    style={{flex:1,fontSize:11,fontWeight:700,border:"none",cursor:"pointer",
                      fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s",
                      background:newAcc.normalBal===s?"#00696d":"white",
                      color:newAcc.normalBal===s?"white":"#747780"}}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="label-field">Account Name *</label>
            <input type="text" className="input-field" placeholder="e.g. Printing & Stationery"
              value={newAcc.name} onChange={e=>setNewAcc(p=>({...p,name:e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Group</label>
              <div className="relative">
                <select className="input-field appearance-none"
                  value={newAcc.group} onChange={e=>setNewAcc(p=>({...p,group:e.target.value}))}>
                  {GROUPS.map(g=><option key={g}>{g}</option>)}
                </select>
                <Icon name="expand_more" size={16} color="#747780"
                  style={{position:"absolute" as any,right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            </div>
            <div>
              <label className="label-field">Sub-Group</label>
              <input type="text" className="input-field" placeholder="e.g. Operating"
                value={newAcc.subGroup} onChange={e=>setNewAcc(p=>({...p,subGroup:e.target.value}))}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
            <button onClick={()=>setShowAdd(false)} className="btn-ghost" style={{fontSize:13}}>
              Cancel
            </button>
            <button onClick={addAccount} disabled={saving} className="btn-primary" style={{fontSize:13}}>
              {saving?"Saving...":"Save Account"}
            </button>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="space-y-3">
        <div style={{position:"relative"}}>
          <Icon name="search" size={20} color="#747780"
            style={{position:"absolute" as any,left:12,top:"50%",transform:"translateY(-50%)"}}/>
          <input type="text" className="input-field" style={{paddingLeft:40}}
            placeholder="Search accounts..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
          {["ALL",...GROUPS].map(g=>(
            <button key={g} onClick={()=>setGF(g)}
              style={{padding:"5px 14px",borderRadius:9999,fontSize:11,fontWeight:700,cursor:"pointer",
                fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s",
                background:groupFilter===g?(GROUP_COLORS[g]||"#1b3a6b"):"transparent",
                color:groupFilter===g?"white":"#747780",
                border:groupFilter===g?"none":"1px solid #c4c6d0"}}>{g}</button>
          ))}
        </div>
      </div>

      {/* Accounts grouped */}
      {loading ? (
        <div className="glass-card p-12 text-center">
          <Icon name="autorenew" size={40} color="#00696d"/>
          <p style={{fontSize:13,color:"#747780",marginTop:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Loading accounts...
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          {GROUPS.filter(g=>groupFilter==="ALL"||groupFilter===g).map(group=>{
            const accts = filtered.filter(a=>a.group===group);
            if(!accts.length) return null;
            return (
              <details key={group} open>
                <summary style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 16px",background:"#1b3a6b",cursor:"pointer",listStyle:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <Icon name="expand_more" size={18} color="rgba(255,255,255,0.8)"/>
                    <span style={{fontSize:11,fontWeight:700,color:"white",letterSpacing:"0.08em",
                      textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{group}</span>
                    <span style={{fontSize:10,color:"rgba(137,165,221,0.8)",
                      fontFamily:"'JetBrains Mono',monospace"}}>{accts.length} accounts</span>
                  </div>
                </summary>

                {/* Sub-group headers */}
                {Array.from(new Set(accts.map(a=>a.subGroup||"General"))).map(sg=>(
                  <div key={sg}>
                    <div style={{padding:"6px 16px",background:"rgba(231,238,255,0.5)",
                      borderBottom:"1px solid rgba(196,198,208,0.2)"}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#44474f",letterSpacing:"0.05em",
                        textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{sg}</span>
                    </div>
                    {accts.filter(a=>(a.subGroup||"General")===sg).map(a=>(
                      <div key={a.id} style={{display:"flex",alignItems:"center",gap:12,
                        padding:"12px 16px",borderBottom:"1px solid rgba(196,198,208,0.15)",
                        transition:"background 0.15s"}}
                        onMouseEnter={e=>(e.currentTarget.style.background="rgba(240,243,255,0.7)")}
                        onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                          color:GROUP_COLORS[group]||"#1b3a6b",fontWeight:600,
                          background:`${GROUP_COLORS[group]||"#1b3a6b"}15`,
                          padding:"3px 8px",borderRadius:6,flexShrink:0}}>{a.code}</span>
                        <span style={{flex:1,fontSize:13,color:"#131c2a",
                          fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{a.name}</span>
                        <span style={{fontSize:10,padding:"2px 8px",borderRadius:9999,fontWeight:700,
                          fontFamily:"'Plus Jakarta Sans',sans-serif",
                          background:a.normalBal==="DR"?"rgba(157,240,244,0.3)":"rgba(255,243,214,0.6)",
                          color:a.normalBal==="DR"?"#037074":"#9C6500"}}>{a.normalBal}</span>
                        <Link href={`/ledger/${a.code}`}
                          style={{background:"none",border:"none",cursor:"pointer",
                            color:"#c4c6d0",padding:"4px 6px",borderRadius:6,
                            textDecoration:"none",display:"inline-flex",alignItems:"center",
                            transition:"color 0.15s"}}
                          title="View Ledger"
                          onMouseEnter={e=>(e.currentTarget.style.color=GROUP_COLORS[a.group]||"#747780")}
                          onMouseLeave={e=>(e.currentTarget.style.color="#c4c6d0")}>
                          <Icon name="menu_book" size={16}/>
                        </Link>
                        <button style={{background:"none",border:"none",cursor:"pointer",
                          color:"#c4c6d0",padding:4,borderRadius:6,transition:"color 0.15s"}}
                          onMouseEnter={e=>(e.currentTarget.style.color="#747780")}
                          onMouseLeave={e=>(e.currentTarget.style.color="#c4c6d0")}>
                          <Icon name="edit" size={16}/>
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </details>
            );
          })}

          {filtered.length===0&&!loading&&(
            <div style={{padding:40,textAlign:"center"}}>
              <Icon name="account_tree" size={40} color="#c4c6d0"/>
              <p style={{fontSize:13,color:"#747780",marginTop:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                {accounts.length===0
                  ? "No accounts yet. Run the seed script or add accounts manually."
                  : "No accounts match your search."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
