"use client";
import { useEffect, useState } from "react";
import { inr } from "@/lib/utils/format";

function Icon({ name, size=20, color="" }: { name:string;size?:number;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit"}}>{name}</span>;
}

export default function PLPage() {
  const [period, setPeriod] = useState<"month"|"ytd">("ytd");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    setLoading(true);
    fetch(`/api/reports/pl?period=${period}`)
      .then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  },[period]);

  const pl = data || {
    income:[{name:"Sales Revenue",amount:200000},{name:"Other Income",amount:0}],
    expenses:[
      {name:"Salary & Wages",amount:84200},{name:"Rent Expense",amount:60000},
      {name:"Office Expenses",amount:8400},{name:"Travel & Conveyance",amount:4200},
      {name:"Professional Fees",amount:12000},{name:"Bank Charges",amount:450},{name:"Depreciation",amount:0},
    ],
    grossIncome:200000, totalExpenses:169250, netProfit:30750,
  };
  const isProfit = pl.netProfit >= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div style={{width:44,height:44,borderRadius:12,background:"rgba(0,105,109,0.12)",
          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <Icon name="trending_up" size={24} color="#00696d"/>
        </div>
        <div className="flex-1">
          <h1 style={{fontSize:20,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Profit & Loss Statement
          </h1>
          <p style={{fontSize:12,color:"#747780",marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            {data?.from && data?.to ? `${data.from} to ${data.to}` : "Apr 2026 – current"}
          </p>
        </div>
        <button style={{padding:8,borderRadius:8,background:"none",border:"none",cursor:"pointer",color:"#747780"}}>
          <Icon name="download" size={22}/>
        </button>
      </div>

      {/* Period toggle */}
      <div style={{display:"flex",gap:8}}>
        {([["month","This Month"],["ytd","YTD"]] as const).map(([v,l])=>(
          <button key={v} onClick={()=>setPeriod(v)}
            style={{padding:"6px 16px",borderRadius:9999,fontSize:12,fontWeight:700,cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif",transition:"all 0.15s",
              background:period===v?"#00696d":"transparent",
              color:period===v?"white":"#747780",
              border:period===v?"none":"1px solid #c4c6d0"}}>
            {l}{period===v?" ✓":""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <Icon name="autorenew" size={40} color="#00696d"/>
        </div>
      ):(
        <div className="glass-card overflow-hidden">
          {/* Income */}
          <div style={{padding:16,borderLeft:"4px solid #00696d"}}>
            <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#44474f",
              textTransform:"uppercase",marginBottom:12,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>INCOME</p>
            {pl.income.map((item:any,i:number)=>(
              <div key={i} className="fin-row">
                <span className="fin-label">{item.name}</span>
                <span className="fin-value">{item.amount===0?"₹0":inr(item.amount)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,marginTop:8,
              borderTop:"1px solid rgba(0,105,109,0.2)"}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.05em",color:"#00696d",
                textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>GROSS INCOME</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,color:"#00696d"}}>
                {inr(pl.grossIncome)}
              </span>
            </div>
          </div>

          {/* Expenses */}
          <div style={{padding:16,borderLeft:"4px solid #1b3a6b"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
              <div style={{width:4,height:16,background:"#1b3a6b",borderRadius:2}}/>
              <p style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",color:"#44474f",
                textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>EXPENSES</p>
            </div>
            {pl.expenses.map((item:any,i:number)=>(
              <div key={i} className="fin-row">
                <span className="fin-label">{item.name}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,
                  color:item.amount>0?"#ba1a1a":"#747780"}}>
                  {item.amount===0?"₹0":inr(item.amount)}
                </span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,marginTop:8,
              borderTop:"1px solid rgba(27,58,107,0.2)"}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.05em",color:"#1b3a6b",
                textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>TOTAL EXPENSES</span>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,color:"#ba1a1a"}}>
                {inr(pl.totalExpenses)}
              </span>
            </div>
          </div>

          {/* Net Profit bar */}
          <div style={{padding:20,background:isProfit?"#00696d":"#ba1a1a"}}>
            <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"rgba(255,255,255,0.70)",
              textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              {isProfit?"NET PROFIT":"NET LOSS"}
            </p>
            <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:700,
              color:"white",textAlign:"right",marginTop:8}}>
              {inr(Math.abs(pl.netProfit))}
            </p>
          </div>
        </div>
      )}

      {/* Links */}
      <div style={{display:"flex",gap:10}}>
        <a href="/balance-sheet" className="btn-outline" style={{flex:1,justifyContent:"center",fontSize:12}}>
          <Icon name="account_balance" size={16}/> Balance Sheet
        </a>
        <a href="/notes" className="btn-ghost" style={{flex:1,justifyContent:"center",fontSize:12}}>
          <Icon name="description" size={16}/> Notes to Accounts
        </a>
      </div>
    </div>
  );
}
