"use client";
import { useState } from "react";

function Icon({ name, size=20, color="" }: { name:string;size?:number;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit"}}>{name}</span>;
}

const TABS = [
  {id:"company",  label:"Company",   icon:"business"},
  {id:"accounts", label:"Accounts",  icon:"account_tree"},
  {id:"upi",      label:"UPI Rules", icon:"phone_iphone"},
  {id:"export",   label:"Export",    icon:"download"},
];

export default function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [company, setCompany] = useState({
    name:"My Company", pan:"", gstin:"", address:"", state:"", fy:"2025-26", type:"Proprietorship",
  });
  const [saved, setSaved] = useState(false);
  const [rules, setRules] = useState([
    {keyword:"rent",   account:"4201 — Rent Expense",    active:true},
    {keyword:"salary", account:"4101 — Salary & Wages",  active:true},
    {keyword:"epfo",   account:"4102 — PF Contribution",  active:true},
  ]);

  function saveCompany() {
    setSaved(true);
    setTimeout(()=>setSaved(false),3000);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Settings</h1>

      {/* Tabs */}
      <div style={{display:"flex",gap:2,background:"rgba(231,238,255,0.6)",borderRadius:12,padding:4}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,display:"flex",flexDirection:"column" as const,alignItems:"center",gap:4,
              padding:"8px 4px",borderRadius:8,border:"none",cursor:"pointer",transition:"all 0.15s",
              background:tab===t.id?"white":"transparent",
              boxShadow:tab===t.id?"0 2px 8px rgba(27,58,107,0.10)":"none",
              color:tab===t.id?"#00696d":"#747780"}}>
            <Icon name={t.icon} size={18} color={tab===t.id?"#00696d":"#747780"}/>
            <span style={{fontSize:10,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Company */}
      {tab==="company"&&(
        <div className="glass-card p-5 space-y-4">
          <h2 style={{fontSize:16,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Company Profile
          </h2>
          {saved&&(
            <div className="glass-card-sm p-3 flex gap-2" style={{borderLeft:"4px solid #00696d"}}>
              <Icon name="check_circle" size={18} color="#00696d"/>
              <p style={{fontSize:13,color:"#00696d",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Saved successfully!</p>
            </div>
          )}
          {[
            {k:"name",    l:"Company / Business Name",  t:"text",   ph:"Your Company Pvt Ltd"},
            {k:"pan",     l:"PAN",                      t:"text",   ph:"AAAAA0000A",mono:true},
            {k:"gstin",   l:"GSTIN (optional)",          t:"text",   ph:"27AAAAA0000A1Z5",mono:true},
            {k:"address", l:"Registered Address",        t:"text",   ph:"123, Street, City"},
            {k:"state",   l:"State",                    t:"text",   ph:"Maharashtra"},
          ].map(f=>(
            <div key={f.k}>
              <label className="label-field">{f.l}</label>
              <input type={f.t} className={f.mono?"input-mono":"input-field"}
                placeholder={f.ph} value={(company as any)[f.k]}
                onChange={e=>setCompany(p=>({...p,[f.k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <label className="label-field">Business Type</label>
            <div className="relative">
              <select className="input-field appearance-none"
                value={company.type} onChange={e=>setCompany(p=>({...p,type:e.target.value}))}>
                {["Proprietorship","Partnership","LLP","Private Limited","Public Limited","HUF","Trust"].map(v=>(
                  <option key={v}>{v}</option>
                ))}
              </select>
              <Icon name="expand_more" size={18} color="#747780"
                style={{position:"absolute" as any,right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
          </div>
          <div>
            <label className="label-field">Current Financial Year</label>
            <div className="relative">
              <select className="input-field appearance-none"
                value={company.fy} onChange={e=>setCompany(p=>({...p,fy:e.target.value}))}>
                {["2024-25","2025-26","2026-27"].map(v=><option key={v}>{v}</option>)}
              </select>
              <Icon name="expand_more" size={18} color="#747780"
                style={{position:"absolute" as any,right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
          </div>
          <button onClick={saveCompany} className="btn-primary w-full justify-center">
            <Icon name="save" size={16}/> Save Changes
          </button>
        </div>
      )}

      {/* UPI Rules */}
      {tab==="upi"&&(
        <div className="glass-card p-5 space-y-4">
          <h2 style={{fontSize:16,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            UPI Auto-Mapping Rules
          </h2>
          <p style={{fontSize:13,color:"#44474f",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            When a UPI transaction merchant/ID contains the keyword, it auto-maps to the selected ledger.
          </p>
          <div style={{display:"flex",flexDirection:"column" as const,gap:8}}>
            {rules.map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                background:"rgba(240,243,255,0.7)",borderRadius:12}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:"#1b3a6b",
                  background:"rgba(27,58,107,0.10)",padding:"3px 8px",borderRadius:6}}>{r.keyword}</span>
                <span style={{fontSize:12,color:"#44474f",flex:1,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  → {r.account}
                </span>
                <button onClick={()=>setRules(p=>p.map((x,idx)=>idx===i?{...x,active:!x.active}:x))}
                  style={{width:36,height:20,borderRadius:10,border:"none",cursor:"pointer",transition:"all 0.2s",
                    background:r.active?"#00696d":"#c4c6d0",position:"relative" as const,padding:0}}>
                  <span style={{position:"absolute" as any,top:2,width:16,height:16,borderRadius:8,
                    background:"white",transition:"all 0.2s",
                    left:r.active?"calc(100% - 18px)":2}}/>
                </button>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input type="text" className="input-mono" style={{flex:1}} placeholder="Add keyword..."/>
            <button className="btn-primary" style={{fontSize:12}}><Icon name="add" size={16}/>Add Rule</button>
          </div>
        </div>
      )}

      {/* Export */}
      {tab==="export"&&(
        <div className="glass-card p-5 space-y-3">
          <h2 style={{fontSize:16,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Data Export
          </h2>
          {[
            {label:"Export Trial Balance",    icon:"balance",         desc:"As at today"},
            {label:"Export P&L Statement",    icon:"trending_up",     desc:"Full year YTD"},
            {label:"Export Balance Sheet",    icon:"account_balance", desc:"As at today"},
            {label:"Export All Transactions", icon:"receipt_long",    desc:"Full journal"},
            {label:"Export Notes to Accounts",icon:"description",     desc:"PDF format"},
          ].map(item=>(
            <button key={item.label}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"12px 16px",
                borderRadius:12,border:"1px solid rgba(196,198,208,0.5)",background:"white",
                cursor:"pointer",transition:"all 0.15s",textAlign:"left" as const}}
              onMouseEnter={e=>(e.currentTarget.style.background="#f0f3ff")}
              onMouseLeave={e=>(e.currentTarget.style.background="white")}>
              <div style={{width:40,height:40,borderRadius:10,background:"rgba(0,105,109,0.10)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name={item.icon} size={22} color="#00696d"/>
              </div>
              <div style={{flex:1}}>
                <p style={{fontSize:14,fontWeight:600,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.label}</p>
                <p style={{fontSize:12,color:"#747780",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{item.desc}</p>
              </div>
              <Icon name="download" size={20} color="#747780"/>
            </button>
          ))}
          <div style={{marginTop:8,paddingTop:16,borderTop:"1px solid rgba(196,198,208,0.3)"}}>
            <button style={{width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid rgba(186,26,26,0.3)",
              background:"rgba(255,218,214,0.3)",cursor:"pointer",display:"flex",alignItems:"center",
              gap:10,color:"#ba1a1a",transition:"all 0.15s"}}>
              <Icon name="delete_forever" size={20} color="#ba1a1a"/>
              <span style={{fontSize:14,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                Clear All Entries (This FY)
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
