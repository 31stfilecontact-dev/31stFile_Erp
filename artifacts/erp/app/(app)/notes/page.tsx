"use client";
import { useState } from "react";

function Icon({ name, size=20, color="" }: { name:string;size?:number;color?:string }) {
  return <span className="material-symbols-outlined select-none"
    style={{fontSize:size,lineHeight:1,color:color||"inherit"}}>{name}</span>;
}

const NOTES = [
  { num:1, title:"Significant Accounting Policies", icon:"policy", auto:false,
    defaultText:"1.1 Basis of Preparation: These accounts are prepared on the accrual basis of accounting under the historical cost convention.\n\n1.2 Revenue Recognition: Revenue is recognised when services are rendered or goods are delivered and the significant risks and rewards of ownership have been transferred.\n\n1.3 Cash & Bank: Cash comprises cash in hand. Bank balances are reconciled monthly with passbook/statement.\n\n1.4 Trade Receivables: Receivables are stated at cost less any provision for doubtful debts.",
  },
  { num:2, title:"Trade Receivables", icon:"people", auto:true,
    rows:[["Acme Industries Ltd","₹2,00,000","12 days","Current ✅"]],
    headers:["Party Name","Amount (₹)","Days Outstanding","Status"],
    total:"₹2,00,000", note:"All receivables are current and expected to be collected within 30 days.",
  },
  { num:3, title:"Trade Payables", icon:"store", auto:true,
    rows:[["ABC Suppliers","₹1,18,000","27-May-2026"]],
    headers:["Vendor","Amount (₹)","Due Date"],
    total:"₹1,18,000", note:"All payables are within normal credit terms.",
  },
  { num:4, title:"Cash and Bank Balances", icon:"account_balance", auto:true,
    rows:[["Cash in Hand","₹6,000"],["Bank — Current Account","₹4,82,000"]],
    headers:["Account","Balance (₹)"], total:"₹4,88,000",
  },
  { num:5, title:"Capital Account", icon:"person", auto:true,
    rows:[["Opening Balance","₹8,00,000"],["Add: Net Profit","₹30,750"],["Less: Drawings","₹0"],["Closing Balance","₹8,30,750"]],
    headers:["Particulars","Amount (₹)"],
  },
];

export default function NotesPage() {
  const [texts, setTexts] = useState<Record<number,string>>({1:NOTES[0].defaultText||""});
  const [editing, setEditing] = useState<number|null>(null);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            Notes to Accounts
          </h1>
          <p style={{fontSize:12,color:"#747780",marginTop:4,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
            FY 2025-26 · Auto-generated · Editable before CA review
          </p>
        </div>
        <button className="btn-primary" style={{fontSize:12}}>
          <Icon name="download" size={16}/> Export All
        </button>
      </div>

      {/* Info */}
      <div className="glass-card-sm p-3 flex gap-3">
        <Icon name="edit" size={20} color="#00696d"/>
        <p style={{fontSize:13,color:"#44474f",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
          All notes are auto-drafted from your journal entries. Click the edit icon to modify before sharing with your CA.
        </p>
      </div>

      {/* Notes */}
      {NOTES.map(note=>(
        <div key={note.num} className="glass-card overflow-hidden"
          style={{borderLeft:"4px solid #00696d"}}>
          {/* Note header */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
            padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.4)"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:"rgba(157,240,244,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Icon name={note.icon} size={18} color="#00696d"/>
              </div>
              <div>
                <h3 style={{fontSize:14,fontWeight:700,color:"#131c2a",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  Note {note.num} — {note.title}
                </h3>
                <span style={{fontSize:10,padding:"2px 8px",borderRadius:9999,fontWeight:700,
                  background:note.auto?"rgba(157,240,244,0.4)":"rgba(231,238,255,0.7)",
                  color:note.auto?"#037074":"#1b3a6b",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {note.auto?"AUTO-GENERATED":"MANUAL"}
                </span>
              </div>
            </div>
            {!note.auto&&(
              <button onClick={()=>setEditing(editing===note.num?null:note.num)}
                style={{background:"none",border:"none",cursor:"pointer",color:"#747780",padding:6,
                  borderRadius:8,transition:"color 0.15s"}}
                onMouseEnter={e=>(e.currentTarget.style.color="#00696d")}
                onMouseLeave={e=>(e.currentTarget.style.color="#747780")}>
                <Icon name={editing===note.num?"check":"edit"} size={20}/>
              </button>
            )}
          </div>

          {/* Note content */}
          <div style={{padding:16}}>
            {/* Editable text */}
            {!note.auto&&(
              editing===note.num ? (
                <textarea
                  className="input-field"
                  style={{width:"100%",resize:"vertical" as const,fontSize:13,lineHeight:1.7,minHeight:160}}
                  value={texts[note.num]||""}
                  onChange={e=>setTexts(p=>({...p,[note.num]:e.target.value}))}/>
              ):(
                <p style={{fontSize:13,color:"#44474f",lineHeight:1.7,whiteSpace:"pre-line",
                  fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
                  {texts[note.num]}
                </p>
              )
            )}

            {/* Auto table */}
            {note.auto&&note.rows&&(
              <div style={{overflowX:"auto" as const}}>
                <table style={{width:"100%",borderCollapse:"collapse" as const,fontSize:13}}>
                  <thead>
                    <tr style={{borderBottom:"1px solid rgba(196,198,208,0.4)"}}>
                      {note.headers!.map(h=>(
                        <th key={h} style={{fontSize:10,fontWeight:700,color:"#44474f",textAlign:"left",
                          padding:"6px 0 8px",textTransform:"uppercase" as const,letterSpacing:"0.05em",
                          fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {note.rows.map((row,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid rgba(196,198,208,0.2)"}}>
                        {row.map((cell,j)=>(
                          <td key={j} style={{padding:"10px 0",fontSize:13,
                            fontFamily:j>0?"'JetBrains Mono',monospace":"'Plus Jakarta Sans',sans-serif",
                            color:"#131c2a"}}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                    {note.total&&(
                      <tr style={{borderTop:"1px solid rgba(196,198,208,0.4)",background:"rgba(240,243,255,0.5)"}}>
                        <td style={{padding:"10px 0",fontWeight:700,color:"#131c2a",
                          fontFamily:"'Plus Jakarta Sans',sans-serif"}}>Total</td>
                        <td style={{padding:"10px 0",fontFamily:"'JetBrains Mono',monospace",
                          fontWeight:700,color:"#131c2a"}}>{note.total}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {note.note&&(
              <p style={{fontSize:12,color:"#747780",marginTop:10,fontStyle:"italic",
                fontFamily:"'Plus Jakarta Sans',sans-serif"}}>{note.note}</p>
            )}
          </div>
        </div>
      ))}

      {/* Add custom note */}
      <div style={{border:"2px dashed rgba(196,198,208,0.6)",borderRadius:16,padding:20,textAlign:"center"}}>
        <button className="btn-ghost text-secondary" style={{fontSize:13}}>
          <Icon name="add_circle" size={20} color="#00696d"/> Add Custom Note
        </button>
      </div>
    </div>
  );
}
