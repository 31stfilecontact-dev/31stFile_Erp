"use client";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { inr } from "@/lib/utils/format";

function Icon({ name, size=20, color="", style }: { name:string;size?:number;color?:string;style?:CSSProperties }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit",...style}}>{name}</span>;
}

interface Line { accountCode:string; side:"DR"|"CR"; amount:number; note:string; }

export default function JournalEntryPage() {
  const [voucherType, setVT] = useState("PAYMENT");
  const [date, setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [narration, setNar]  = useState("");
  const [reference, setRef]  = useState("");
  const [lines, setLines]    = useState<Line[]>([
    {accountCode:"",side:"DR",amount:0,note:""},
    {accountCode:"",side:"CR",amount:0,note:""},
  ]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [docs, setDocs]      = useState<{name:string;url:string}[]>([]);
  const [posting, setPosting]= useState(false);
  const [posted, setPosted]  = useState<string|null>(null);
  const [error, setError]    = useState("");
  const fileRef              = useRef<HTMLInputElement>(null);

  useEffect(()=>{ fetch("/api/accounts").then(r=>r.json()).then(setAccounts); },[]);

  const totalDR = lines.filter(l=>l.side==="DR").reduce((s,l)=>s+l.amount,0);
  const totalCR = lines.filter(l=>l.side==="CR").reduce((s,l)=>s+l.amount,0);
  const balanced = Math.abs(totalDR-totalCR)<0.01 && totalDR>0;

  const upd = (i:number,f:keyof Line,v:string|number) =>
    setLines(p=>p.map((l,idx)=>idx===i?{...l,[f]:v}:l));

  async function handlePost() {
    if(!balanced||!narration.trim()) return;
    setPosting(true); setError("");
    try {
      const res = await fetch("/api/entries",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({voucherType,date,narration,reference,sourceType:"MANUAL",lines}),
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      setPosted(data.voucherNo);
    } catch(e:any){ setError(e.message); }
    finally{ setPosting(false); }
  }

  if(posted) return (
    <div className="max-w-lg mx-auto mt-10">
      <div className="glass-card p-8 text-center">
        <div style={{width:64,height:64,borderRadius:"50%",background:"#9df0f4",
          display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <Icon name="check_circle" size={36} color="#00696d"/>
        </div>
        <h2 style={{fontSize:20,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Entry Posted!
        </h2>
        <p style={{fontSize:13,color:"#747780",margin:"8px 0 24px",fontFamily:"'JetBrains Mono',monospace"}}>
          {posted}
        </p>
        <p style={{fontSize:13,color:"#44474f",marginBottom:24,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Trial Balance, P&L and Balance Sheet updated automatically.
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={()=>{setPosted(null);setNar("");setRef("");setLines([{accountCode:"",side:"DR",amount:0,note:""},{accountCode:"",side:"CR",amount:0,note:""}]);}}
            className="btn-outline">New Entry</button>
          <a href="/trial-balance" className="btn-primary">View Trial Balance</a>
        </div>
      </div>
    </div>
  );

  const GROUPS = ["Assets","Liabilities","Income","Expenses"];
  const grouped = GROUPS.map(g=>({g,items:accounts.filter(a=>a.group===g)})).filter(g=>g.items.length>0);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          New Entry
        </h1>
        <button onClick={handlePost} disabled={!balanced||posting}
          className="btn-primary"
          style={{opacity:(!balanced||posting)?0.5:1,cursor:(!balanced||posting)?"not-allowed":"pointer"}}>
          {!balanced&&<Icon name="lock" size={16}/>}
          {posting?"Posting...":"Post Entry"}
        </button>
      </div>

      {error && (
        <div className="glass-card-sm p-3 flex gap-2" style={{borderLeft:"4px solid #ba1a1a",background:"rgba(255,218,214,0.5)"}}>
          <Icon name="error" size={20} color="#ba1a1a"/>
          <p style={{fontSize:13,color:"#ba1a1a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{error}</p>
        </div>
      )}

      {/* Entry header */}
      <div className="glass-card p-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Voucher Type</label>
          <div className="relative">
            <select className="input-field appearance-none" value={voucherType} onChange={e=>setVT(e.target.value)}>
              {["PAYMENT","RECEIPT","JOURNAL","CONTRA","SALES","PURCHASE"].map(v=><option key={v}>{v}</option>)}
            </select>
            <Icon name="expand_more" size={18} color="#747780"
              style={{position:"absolute" as any,right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
          </div>
        </div>
        <div>
          <label className="label-field">Date</label>
          <input type="date" className="input-field" value={date} onChange={e=>setDate(e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="label-field">Narration *</label>
          <input type="text" className="input-field" placeholder="e.g. Rent payment for May 2026 to Sharma Properties"
            value={narration} onChange={e=>setNar(e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className="label-field">Reference / UTR</label>
          <input type="text" className="input-mono" placeholder="Invoice no. or UPI UTR number"
            value={reference} onChange={e=>setRef(e.target.value)}/>
        </div>
      </div>

      {/* Entry lines */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center glass-header mb-4">
          <h3 style={{fontSize:15,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Entry Lines
          </h3>
          <button onClick={()=>setLines(p=>[...p,{accountCode:"",side:"DR",amount:0,note:""}])}
            className="btn-ghost text-secondary" style={{fontSize:12}}>
            <Icon name="add" size={16} color="#00696d"/> Add Line
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line,i)=>(
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 grid grid-cols-5 gap-2">
                {/* Account select */}
                <div className="col-span-3 relative">
                  <select className="input-field appearance-none text-[13px]"
                    value={line.accountCode} onChange={e=>upd(i,"accountCode",e.target.value)}>
                    <option value="">Select Account...</option>
                    {grouped.map(({g,items})=>(
                      <optgroup key={g} label={g}>
                        {items.map((a:any)=>(
                          <option key={a.code} value={a.code}>{a.code} — {a.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <Icon name="expand_more" size={16} color="#747780"
                    style={{position:"absolute" as any,right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                </div>
                {/* DR/CR toggle */}
                <div style={{display:"flex",border:"1px solid #c4c6d0",borderRadius:8,overflow:"hidden",height:42}}>
                  {(["DR","CR"] as const).map(s=>(
                    <button key={s} onClick={()=>upd(i,"side",s)}
                      style={{flex:1,fontSize:11,fontWeight:700,transition:"all 0.15s",fontFamily:"'Plus Jakarta Sans',sans-serif",
                        background:line.side===s?"#00696d":"white",
                        color:line.side===s?"white":"#747780",border:"none",cursor:"pointer"}}>
                      {s}
                    </button>
                  ))}
                </div>
                {/* Amount */}
                <input type="number" step="0.01" min="0" className="input-mono col-span-1"
                  placeholder="0.00" value={line.amount||""} onChange={e=>upd(i,"amount",parseFloat(e.target.value)||0)}/>
              </div>
              <button onClick={()=>setLines(p=>p.filter((_,idx)=>idx!==i))}
                style={{padding:8,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",
                  color:"#747780",flexShrink:0,transition:"color 0.15s"}}
                onMouseEnter={e=>(e.currentTarget.style.color="#ba1a1a")}
                onMouseLeave={e=>(e.currentTarget.style.color="#747780")}>
                <Icon name="delete" size={20}/>
              </button>
            </div>
          ))}
        </div>

        {/* Balance indicator */}
        <div style={{marginTop:16,padding:"10px 14px",borderRadius:12,display:"flex",
          justifyContent:"space-between",alignItems:"center",
          background:balanced?"rgba(157,240,244,0.25)":"rgba(255,218,214,0.4)"}}>
          <div style={{display:"flex",gap:16,fontFamily:"'JetBrains Mono',monospace",fontSize:13}}>
            <span style={{color:"#44474f"}}>DR: <strong>{inr(totalDR)}</strong></span>
            <span style={{color:"#44474f"}}>CR: <strong>{inr(totalCR)}</strong></span>
          </div>
          <span className={balanced?"chip-success":"chip-error"}>
            {balanced?"✅ Balanced":`⚠ Diff: ${inr(Math.abs(totalDR-totalCR))}`}
          </span>
        </div>
      </div>

      {/* Document upload */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center glass-header mb-3">
          <div>
            <h3 style={{fontSize:15,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Attach Documents
            </h3>
            <p style={{fontSize:12,color:"#747780",marginTop:2,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
              Invoice, receipt, screenshot — any format
            </p>
          </div>
          {docs.length>0&&<span className="chip-success">{docs.length} attached</span>}
        </div>

        <div className="drop-zone py-6" onClick={()=>fileRef.current?.click()}>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.heic" multiple className="hidden"
            onChange={e=>Array.from(e.target.files||[]).forEach(f=>
              setDocs(p=>[...p,{name:f.name,url:URL.createObjectURL(f)}]))}/>
          <Icon name="upload_file" size={40} color="#00696d"/>
          <p style={{fontSize:14,fontWeight:600,color:"#44474f",fontFamily:"'Plus Jakarta Sans',sans-serif",marginTop:8}}>
            Drop files here or Browse
          </p>
          <p style={{fontSize:11,color:"#747780",marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            PDF · JPG · PNG · HEIC · Max 10MB each
          </p>
        </div>

        {docs.length>0&&(
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
            {docs.map((d,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
                background:"#f0f3ff",borderRadius:12}}>
                <Icon name="description" size={20} color="#00696d"/>
                <span style={{flex:1,fontSize:13,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif",
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                <a href={d.url} target="_blank" rel="noreferrer"
                  style={{fontSize:12,fontWeight:600,color:"#00696d",textDecoration:"none"}}>View</a>
                <button onClick={()=>setDocs(p=>p.filter((_,idx)=>idx!==i))}
                  style={{background:"none",border:"none",cursor:"pointer",color:"#747780",padding:2}}>
                  <Icon name="close" size={18}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
