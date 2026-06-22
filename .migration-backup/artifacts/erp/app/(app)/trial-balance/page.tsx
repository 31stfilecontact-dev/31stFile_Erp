"use client";
import { useEffect, useState } from "react";
import { inr } from "@/lib/utils/format";

function Icon({ name, size=20, color="" }: { name:string;size?:number;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit"}}>{name}</span>;
}

const GROUPS = ["Assets","Liabilities","Income","Expenses"];
const GROUP_COLORS: Record<string,string> = {Assets:"#00696d",Liabilities:"#1b3a6b",Income:"#00696d",Expenses:"#9C6500"};

export default function TrialBalancePage() {
  const [data, setData] = useState<any>(null);
  const [asAt, setAsAt] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/reports/trial-balance?asAt=${asAt}`)
      .then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  },[asAt]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Trial Balance</h1>
        <button className="btn-primary" style={{fontSize:12}} onClick={()=>{}}>
          <Icon name="verified" size={16}/> Verify
        </button>
      </div>

      {/* Balance banner */}
      {data&&(
        <div className="glass-card-sm p-3 flex gap-3" style={{borderLeft:`4px solid ${data.balanced?"#00696d":"#ba1a1a"}`}}>
          <Icon name={data.balanced?"check_circle":"error"} size={20} color={data.balanced?"#00696d":"#ba1a1a"}/>
          <p style={{fontSize:13,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {data.balanced
              ? `Trial Balance is BALANCED — Total Debits ${inr(data.totalDr)} = Total Credits ${inr(data.totalCr)} as at ${asAt}.`
              : `UNBALANCED — Difference: ${inr(Math.abs(data.totalDr-data.totalCr))}`}
          </p>
        </div>
      )}

      {/* Date + view */}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div className="glass-card-sm" style={{flex:1,display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
          <Icon name="calendar_today" size={18} color="#747780"/>
          <input type="date" value={asAt} onChange={e=>setAsAt(e.target.value)}
            style={{flex:1,background:"transparent",border:"none",outline:"none",
              fontFamily:"'JetBrains Mono',monospace",fontSize:14,color:"#131c2a"}}/>
        </div>
        <button className="chip-success" style={{cursor:"pointer",whiteSpace:"nowrap"}}>
          Summary ✓
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <Icon name="autorenew" size={40} color="#00696d"/>
          <p style={{fontSize:13,color:"#747780",marginTop:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Computing...
          </p>
        </div>
      ) : data ? (
        <div className="glass-card overflow-hidden">
          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px",padding:"10px 16px",
            background:"#f0f3ff",borderBottom:"1px solid #c4c6d030"}}>
            <span style={{fontSize:10,fontWeight:700,color:"#44474f",textTransform:"uppercase",letterSpacing:"0.05em",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Account Name</span>
            <span style={{fontSize:10,fontWeight:700,color:"#44474f",textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"right",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Debit (₹)</span>
            <span style={{fontSize:10,fontWeight:700,color:"#44474f",textTransform:"uppercase",letterSpacing:"0.05em",textAlign:"right",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Credit (₹)</span>
          </div>

          {GROUPS.map(group=>{
            const accts = data.accounts.filter((a:any)=>a.group===group);
            if(!accts.length) return null;
            const subDr = accts.reduce((s:number,a:any)=>s+a.closingDr,0);
            const subCr = accts.reduce((s:number,a:any)=>s+a.closingCr,0);
            return (
              <details key={group} open>
                <summary style={{display:"flex",alignItems:"center",justifyContent:"space-between",
                  padding:"10px 16px",background:"#1b3a6b",cursor:"pointer",listStyle:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Icon name="expand_more" size={18} color="rgba(255,255,255,0.8)" />
                    <span style={{fontSize:11,fontWeight:700,color:"white",letterSpacing:"0.08em",
                      textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{group}</span>
                    <span style={{fontSize:10,color:"rgba(137,165,221,0.8)",fontFamily:"'JetBrains Mono',monospace"}}>
                      Subtotal: {subDr>0 ? `${inr(subDr)} DR` : `${inr(subCr)} CR`}
                    </span>
                  </div>
                </summary>
                {accts.map((a:any)=>(
                  <div key={a.code} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px",
                    padding:"12px 16px",borderBottom:"1px solid #c4c6d020",
                    transition:"background 0.15s"}} className="hover:bg-surface-container-low/50">
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,borderRadius:"50%",flexShrink:0,
                        background:GROUP_COLORS[group]||"#747780"}}/>
                      <span style={{fontSize:13,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                        {a.code} {a.name}
                      </span>
                    </div>
                    <span style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",textAlign:"right",color:"#131c2a"}}>
                      {a.closingDr>0 ? inr(a.closingDr) : "—"}
                    </span>
                    <span style={{fontSize:13,fontFamily:"'JetBrains Mono',monospace",textAlign:"right",color:"#131c2a"}}>
                      {a.closingCr>0 ? inr(a.closingCr) : "—"}
                    </span>
                  </div>
                ))}
              </details>
            );
          })}

          {/* Total row */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px",padding:"14px 16px",
            background:"#1b3a6b"}}>
            <span style={{fontSize:13,fontWeight:800,color:"white",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>TOTAL</span>
            <span style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",textAlign:"right",color:"white"}}>
              {inr(data.totalDr)}
            </span>
            <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}}>
              <span style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",color:"white"}}>
                {inr(data.totalCr)}
              </span>
              {data.balanced&&<Icon name="check_box" size={18} color="#9df0f4"/>}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
