"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { inr, inrAbbr, fmtDate } from "@/lib/utils/format";

function Icon({ name, size=22, filled=false, color="" }: { name:string;size?:number;filled?:boolean;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,fontVariationSettings:filled?"'FILL' 1":"'FILL' 0",color:color||"inherit"}}>{name}</span>;
}

export default function DashboardPage() {
  const [pl, setPL]      = useState<any>(null);
  const [entries, setEnt]= useState<any[]>([]);

  useEffect(()=>{
    fetch("/api/reports/pl?period=ytd").then(r=>r.json()).then(setPL);
    fetch("/api/entries").then(r=>r.json()).then(d=>setEnt(Array.isArray(d)?d.slice(0,5):[]));
  },[]);

  const totalIncome   = pl?.grossIncome   ?? 1245000;
  const totalExpenses = pl?.totalExpenses ?? 185500;
  const netProfit     = pl?.netProfit     ?? 30750;

  const kpis = [
    { label:"TOTAL INCOME",    value:totalIncome,   icon:"trending_up",    color:"#00696d", isAmt:true  },
    { label:"TOTAL EXPENSES",  value:totalExpenses, icon:"warning",        color:"#F5A623", isAmt:true  },
    { label:"NET PROFIT",      value:netProfit,     icon:"account_balance",color:netProfit>=0?"#00696d":"#ba1a1a", isAmt:true },
    { label:"ENTRIES THIS FY", value:entries.length,icon:"receipt_long",   color:"#1b3a6b", isAmt:false },
  ];

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-5 flex justify-between items-center">
        <div>
          <p style={{color:"rgba(255,255,255,0.65)",fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Welcome back 👋
          </p>
          <h1 style={{color:"#fff",fontSize:22,fontWeight:800,fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:4}}>
            31st File ERP
          </h1>
          <p style={{color:"rgba(255,255,255,0.55)",fontSize:12,marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            FY 2025-26 · {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/upi-capture" className="btn-primary text-[12px] px-4 py-2"
            style={{background:"rgba(255,255,255,0.20)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,0.35)"}}>
            <Icon name="phone_iphone" size={16}/> UPI Capture
          </Link>
          <Link href="/journal-entry" className="btn-primary text-[12px] px-4 py-2">
            <Icon name="add" size={16}/> New Entry
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map(k=>(
          <div key={k.label} className="glass-card p-4 relative overflow-hidden"
            style={{borderLeft:`4px solid ${k.color}`}}>
            <div className="flex justify-between items-start">
              <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#44474f",
                fontFamily:"'Plus Jakarta Sans',sans-serif",textTransform:"uppercase"}}>{k.label}</span>
              <Icon name={k.icon} size={20} color={k.color}/>
            </div>
            <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,
              color:k.color,marginTop:8,lineHeight:1}}>
              {k.isAmt ? inrAbbr(k.value) : k.value}
            </p>
            <Icon name={k.icon} size={64} color={k.color}
              style={{position:"absolute" as any,bottom:-8,right:-4,opacity:0.05}}/>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {href:"/trial-balance",  icon:"balance",         label:"Trial\nBalance", color:"#1b3a6b"},
          {href:"/pl-statement",   icon:"trending_up",     label:"P&L\nStatement", color:"#00696d"},
          {href:"/balance-sheet",  icon:"account_balance", label:"Balance\nSheet",  color:"#533400"},
        ].map(q=>(
          <Link key={q.href} href={q.href}
            className="glass-card-sm p-4 flex flex-col items-center gap-2 hover:shadow-glass-lg transition-all duration-200 active:scale-95">
            <div style={{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",
              justifyContent:"center",background:`${q.color}18`}}>
              <Icon name={q.icon} size={22} color={q.color}/>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:"#44474f",textAlign:"center",
              fontFamily:"'Plus Jakarta Sans',sans-serif",whiteSpace:"pre-line"}}>{q.label}</span>
          </Link>
        ))}
      </div>

      {/* Recent entries */}
      <div className="glass-card overflow-hidden">
        <div className="flex justify-between items-center p-4 glass-header">
          <h2 style={{fontSize:17,fontWeight:700,fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#131c2a"}}>
            Recent Transactions
          </h2>
          <Link href="/transactions" className="text-secondary" style={{fontSize:12,fontWeight:600}}>
            View All →
          </Link>
        </div>
        {entries.length===0 ? (
          <div className="p-10 text-center">
            <Icon name="inbox" size={44} color="#c4c6d0"/>
            <p style={{fontSize:14,color:"#747780",marginTop:10,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              No entries yet.
            </p>
            <Link href="/journal-entry" className="btn-primary mt-4 text-[13px]">
              Create First Entry
            </Link>
          </div>
        ):(
          <div>
            {entries.map((e,i)=>(
              <div key={e.id??i} className="flex items-center gap-3 p-4 border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low/50 transition-colors">
                <div style={{width:40,height:40,borderRadius:12,flexShrink:0,display:"flex",
                  alignItems:"center",justifyContent:"center",
                  background:e.sourceType==="UPI"?"#9df0f440":"#e7eeff"}}>
                  <Icon name={e.sourceType==="UPI"?"phone_iphone":"edit_note"} size={20}
                    color={e.sourceType==="UPI"?"#00696d":"#1b3a6b"}/>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:"#131c2a",
                    fontFamily:"'Plus Jakarta Sans',sans-serif",overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.narration}</p>
                  <p style={{fontSize:11,color:"#747780",fontFamily:"'JetBrains Mono',monospace"}}>
                    {e.voucherNo} · {e.entryDate ? fmtDate(e.entryDate):"—"}
                  </p>
                </div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:9999,fontWeight:700,
                  background:e.sourceType==="UPI"?"#9df0f4":"#e7eeff",
                  color:e.sourceType==="UPI"?"#037074":"#1b3a6b",flexShrink:0,
                  fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {e.sourceType==="UPI"?"📱 UPI":"✏ Manual"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
