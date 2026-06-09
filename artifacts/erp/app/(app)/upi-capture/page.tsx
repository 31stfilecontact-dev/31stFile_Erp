"use client";
import { useState, useRef, type CSSProperties } from "react";
import { parseUPICSV, parseUPISMS, UPITxn } from "@/lib/utils/upi-parser";
import { inr } from "@/lib/utils/format";

function Icon({ name, size=20, color="", style }: { name:string;size?:number;color?:string;style?:CSSProperties }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit",...style}}>{name}</span>;
}

type Tab = "CSV"|"SMS"|"MANUAL";

export default function UPICapturePage() {
  const [tab, setTab] = useState<Tab>("CSV");
  const [txns, setTxns] = useState<UPITxn[]>([]);
  const [smsText, setSMS] = useState("");
  const [dragging, setDrag] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [manual, setManual] = useState({utr:"",amount:"",merchant:"",upiId:"",date:"",ledger:"",notes:""});
  const [posting, setPosting] = useState(false);
  const [posted, setPosted] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParsing(true);
    const parsed = await parseUPICSV(file);
    setTxns(parsed);
    setParsing(false);
  }

  function handleSMSParse() {
    const parsed = parseUPISMS(smsText);
    setTxns(p=>[...p,...parsed]);
    setSMS("");
  }

  async function postAll() {
    const matched = txns.filter(t=>t.ledgerAccount);
    if(!matched.length) return;
    setPosting(true);
    let count = 0;
    for(const t of matched) {
      const res = await fetch("/api/entries",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          voucherType:"PAYMENT", date:t.date, narration:`UPI — ${t.merchant}`,
          sourceType:"UPI", utrNumber:t.utr, upiId:t.upiId,
          lines:[
            {accountCode:t.ledgerAccount, side:"DR", amount:t.amount},
            {accountCode:"1002",           side:"CR", amount:t.amount},
          ],
        }),
      });
      if(res.ok) { count++; setTxns(p=>p.filter(x=>x.id!==t.id)); }
    }
    setPosted(p=>p+count);
    setPosting(false);
  }

  const matchedCount = txns.filter(t=>t.ledgerAccount).length;
  const TABS: {id:Tab;label:string;icon:string}[] = [
    {id:"CSV",  label:"Import CSV", icon:"upload_file"},
    {id:"SMS",  label:"Paste SMS",  icon:"sms"},
    {id:"MANUAL",label:"Manual UTR",icon:"edit"},
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>UPI Capture</h1>
        <p style={{fontSize:13,color:"#747780",marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Import payments from any UPI app — no API key needed.
        </p>
      </div>

      {txns.length>0&&(
        <button onClick={postAll} disabled={posting||matchedCount===0} className="btn-primary w-full justify-center"
          style={{opacity:matchedCount===0?0.5:1}}>
          {posting ? <><Icon name="autorenew" size={16}/>Posting...</> :
            <><Icon name="check_circle" size={16}/>Post All Matched ({matchedCount})</>}
        </button>
      )}

      {posted>0&&(
        <div className="glass-card-sm p-3 flex gap-2" style={{borderLeft:"4px solid #00696d"}}>
          <Icon name="check_circle" size={20} color="#00696d"/>
          <p style={{fontSize:13,fontFamily:"'Plus Jakarta Sans',sans-serif",color:"#131c2a"}}>
            ✅ {posted} transaction{posted>1?"s":""} posted to journal successfully.
          </p>
        </div>
      )}

      {/* Info strip */}
      <div className="glass-card-sm p-3 flex gap-3">
        <Icon name="info" size={20} color="#00696d"/>
        <p style={{fontSize:13,color:"#44474f",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          Export CSV from Google Pay / PhonePe / BHIM → import below. Or paste SMS messages.
          Matched transactions post directly to your ledger.
        </p>
      </div>

      {/* Tab card */}
      <div className="glass-card overflow-hidden">
        {/* Tabs */}
        <div style={{display:"flex",borderBottom:"1px solid #c4c6d030"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{flex:1,padding:"12px 8px",fontSize:11,fontWeight:700,letterSpacing:"0.04em",
                textTransform:"uppercase",fontFamily:"'Plus Jakarta Sans',sans-serif",
                border:"none",cursor:"pointer",transition:"all 0.2s",
                borderBottom:tab===t.id?"2px solid #00696d":"2px solid transparent",
                background:tab===t.id?"rgba(157,240,244,0.15)":"transparent",
                color:tab===t.id?"#00696d":"#747780"}}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{padding:16}}>
          {/* CSV */}
          {tab==="CSV"&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {/* Steps */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontSize:12,color:"#747780"}}>
                <Icon name="phone_iphone" size={18} color="#00696d"/> Open UPI App
                <Icon name="arrow_forward" size={14} color="#c4c6d0"/>
                <Icon name="download" size={18} color="#00696d"/> Export CSV
                <Icon name="arrow_forward" size={14} color="#c4c6d0"/>
                <Icon name="upload" size={18} color="#00696d"/> Drop here
              </div>

              {/* Drop zone */}
              <div className={dragging?"border-2 border-dashed rounded-2xl p-8 text-center transition-all"
                :"drop-zone"}
                style={dragging?{borderColor:"#F5A623",background:"rgba(245,166,35,0.05)"}:{}}
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onDrop={async e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
                onClick={()=>fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                  onChange={e=>{if(e.target.files?.[0])handleFile(e.target.files[0]);}}/>
                <Icon name={parsing?"autorenew":"cloud_upload"} size={44} color="#00696d"/>
                <p style={{fontSize:14,fontWeight:600,color:"#44474f",marginTop:8,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {parsing?"Parsing your file...":"Drag & drop your CSV here"}
                </p>
                <p style={{fontSize:11,color:"#747780",marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Google Pay · PhonePe · BHIM · Paytm · Bank CSV
                </p>
                <p style={{fontSize:11,color:"#00696d",marginTop:6,fontWeight:600,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  or click to browse files
                </p>
              </div>

              {/* Parsed list */}
              {txns.length>0&&(
                <div>
                  <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                    <span className="chip-neutral">{txns.length} imported</span>
                    <span className="chip-success">{matchedCount} matched</span>
                    <span className="chip-warning">{txns.length-matchedCount} need mapping</span>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {txns.map(t=>(
                      <div key={t.id} style={{background:"#f0f3ff",borderRadius:12,padding:"10px 12px",
                        display:"flex",gap:10,alignItems:"center"}}>
                        <input type="checkbox" style={{width:16,height:16,flexShrink:0}} readOnly checked={!!t.ledgerAccount}/>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:600,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif",
                            overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.merchant}</p>
                          <p style={{fontSize:11,color:"#747780",fontFamily:"'JetBrains Mono',monospace"}}>
                            {t.upiId||"—"} · {t.date}
                          </p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <p style={{fontSize:14,fontWeight:700,fontFamily:"'JetBrains Mono',monospace",
                            color:t.type==="DEBIT"?"#131c2a":"#00696d"}}>{inr(t.amount)}</p>
                          <select
                            style={{fontSize:11,border:"1px solid #c4c6d0",borderRadius:6,padding:"2px 6px",
                              color:"#44474f",background:"white",marginTop:4,cursor:"pointer",
                              fontFamily:"'Plus Jakarta Sans',sans-serif"}}
                            value={t.ledgerAccount||""}
                            onChange={e=>setTxns(p=>p.map(x=>x.id===t.id?{...x,ledgerAccount:e.target.value}:x))}>
                            <option value="">Map to ledger...</option>
                            <option value="4101">4101 — Salary & Wages</option>
                            <option value="4201">4201 — Rent Expense</option>
                            <option value="4203">4203 — Professional Fees</option>
                            <option value="2001">2001 — Trade Payables</option>
                            <option value="4207">4207 — Bank Charges</option>
                            <option value="4205">4205 — Travel & Conveyance</option>
                            <option value="4206">4206 — Office Expenses</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SMS */}
          {tab==="SMS"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <div className="glass-card-sm p-3" style={{borderLeft:"4px solid #F5A623"}}>
                <p style={{fontSize:13,fontWeight:600,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:4}}>
                  Quick SMS Parsing
                </p>
                <p style={{fontSize:12,color:"#44474f",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Copy and paste multiple UPI SMS messages. Our engine extracts UTRs, amounts and dates automatically.
                </p>
              </div>
              <textarea value={smsText} onChange={e=>setSMS(e.target.value)} rows={7}
                className="input-mono" style={{resize:"vertical",fontSize:12,lineHeight:1.6}}
                placeholder={"Paste SMS here...\ne.g. UPI txn: Rs.1180 paid to ABC@ybl on 12-May-26. Ref 123456789012. — HDFC Bank\nReceived Rs.50000 from XYZ@okicici on 11-May-26. UTR 234567890123."}/>
              <button onClick={handleSMSParse} className="btn-primary w-full justify-center">
                <Icon name="document_scanner" size={16}/> Parse SMS Content
              </button>
              <div className="glass-card-sm p-3">
                <p style={{fontSize:11,color:"#747780",fontFamily:"'Plus Jakarta Sans',sans-serif",lineHeight:1.6}}>
                  💡 <strong>How to copy UPI SMS:</strong> Open your messaging app → search "UPI" or "debited" → select all messages → copy → paste here.
                </p>
              </div>
            </div>
          )}

          {/* Manual */}
          {tab==="MANUAL"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {k:"utr",      l:"UTR Reference",   t:"text",   mono:true,  ph:"12-digit UTR e.g. 123456789012"},
                {k:"amount",   l:"Amount (₹)",       t:"number", mono:true,  ph:"0.00"},
                {k:"merchant", l:"Merchant / Party", t:"text",   mono:false, ph:"Party name"},
                {k:"upiId",    l:"UPI ID",           t:"text",   mono:false, ph:"merchant@bank"},
                {k:"date",     l:"Date",             t:"date",   mono:false, ph:""},
              ].map(f=>(
                <div key={f.k}>
                  <label className="label-field">{f.l}</label>
                  <input type={f.t} placeholder={f.ph}
                    className={f.mono?"input-mono":"input-field"}
                    value={(manual as any)[f.k]}
                    onChange={e=>setManual(p=>({...p,[f.k]:e.target.value}))}/>
                </div>
              ))}
              <div>
                <label className="label-field">Target Ledger (Debit)</label>
                <div className="relative">
                  <select className="input-field appearance-none"
                    value={manual.ledger} onChange={e=>setManual(p=>({...p,ledger:e.target.value}))}>
                    <option value="">Select Ledger...</option>
                    <option value="4101">4101 — Salary & Wages</option>
                    <option value="4201">4201 — Rent Expense</option>
                    <option value="4203">4203 — Professional Fees</option>
                    <option value="2001">2001 — Trade Payables</option>
                    <option value="4207">4207 — Bank Charges</option>
                  </select>
                  <Icon name="expand_more" size={18} color="#747780"
                    style={{position:"absolute" as any,right:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
                </div>
              </div>
              <div>
                <label className="label-field">Notes</label>
                <input type="text" className="input-field" placeholder="Optional description"
                  value={manual.notes} onChange={e=>setManual(p=>({...p,notes:e.target.value}))}/>
              </div>
              <button className="btn-primary w-full justify-center" onClick={async()=>{
                if(!manual.amount||!manual.ledger) return;
                const res = await fetch("/api/entries",{
                  method:"POST",headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({
                    voucherType:"PAYMENT",date:manual.date||new Date().toISOString().split("T")[0],
                    narration:`UPI — ${manual.merchant||"Manual"}`,
                    sourceType:"UPI",utrNumber:manual.utr,upiId:manual.upiId,
                    lines:[{accountCode:manual.ledger,side:"DR",amount:parseFloat(manual.amount)},{accountCode:"1002",side:"CR",amount:parseFloat(manual.amount)}],
                  }),
                });
                if(res.ok){setPosted(p=>p+1);setManual({utr:"",amount:"",merchant:"",upiId:"",date:"",ledger:"",notes:""});}
              }}>
                <Icon name="add" size={16}/> Add to Journal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
