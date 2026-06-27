import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";

function Icon({ name, size = 20, color = "" }: { name: string; size?: number; color?: string }) {
  return (
    <span className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, color: color || "inherit" }}>
      {name}
    </span>
  );
}

interface Account { id: string; code: string; name: string; group: string; }

interface ParsedRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  [key: string]: any;
}

interface MappedTxn {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  utr: string | null;
  accountId: string | null;
  selected: boolean;
}

export default function ImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  const [mapping, setMapping] = useState({
    date: "",
    description: "",
    debit: "",
    credit: "",
    balance: ""
  });
  
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
  const [txns, setTxns] = useState<MappedTxn[]>([]);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: accounts } = useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => (await fetch("/api/accounts")).json()
  });

  const handleFileUpload = (file: File) => {
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        const headers = results.meta.fields || [];
        setRawHeaders(headers);
        setRawRows(results.data);
        
        // Auto-detect columns
        const hLower = headers.map((h: string) => h.toLowerCase());
        const dateCol = headers[hLower.findIndex((h: string) => h.includes("date") || h === "txn date")] || "";
        const descCol = headers[hLower.findIndex((h: string) => h.includes("desc") || h.includes("narration") || h.includes("particulars") || h === "remarks")] || "";
        const drCol = headers[hLower.findIndex((h: string) => h.includes("debit") || h.includes("dr") || h.includes("withdrawal"))] || "";
        const crCol = headers[hLower.findIndex((h: string) => h.includes("credit") || h.includes("cr") || h.includes("deposit"))] || "";
        const balCol = headers[hLower.findIndex((h: string) => h.includes("balance") || h.includes("bal"))] || "";

        setMapping({ date: dateCol, description: descCol, debit: drCol, credit: crCol, balance: balCol });
        
        const confidence = [dateCol, descCol, drCol, crCol].filter(Boolean).length / 4;
        
        if (confidence >= 0.75) {
          generateTxns({ date: dateCol, description: descCol, debit: drCol, credit: crCol, balance: balCol }, results.data);
        } else {
          setStep(2);
        }
        setLoading(false);
      }
    });
  };

  const generateTxns = (map: typeof mapping, rows: any[]) => {
    const parsed: MappedTxn[] = rows.map((r: any, i: number) => {
      // Basic date parsing (assume DD/MM/YYYY or YYYY-MM-DD for now)
      let d = r[map.date] || "";
      if (d.includes("/") && d.split("/")[0].length === 2) {
        const [day, mo, yr] = d.split(/[\/\-]/);
        d = `${yr.length === 2 ? "20" + yr : yr}-${mo.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const drAmt = parseFloat((r[map.debit] || "0").replace(/,/g, "")) || 0;
      const crAmt = parseFloat((r[map.credit] || "0").replace(/,/g, "")) || 0;
      
      const type: "DEBIT" | "CREDIT" = crAmt > 0 ? "CREDIT" : "DEBIT";
      const amount = crAmt > 0 ? crAmt : drAmt;
      
      const desc = r[map.description] || "";
      const utrMatch = desc.match(/[0-9]{12}/);

      return {
        id: `txn_${Date.now()}_${i}`,
        date: d,
        merchant: desc.substring(0, 50),
        amount,
        type,
        utr: utrMatch ? utrMatch[0] : null,
        accountId: null,
        selected: true
      };
    }).filter(t => t.amount > 0);
    
    setTxns(parsed);
    setStep(3);
  };

  async function postSelected() {
    const selected = txns.filter(t => t.selected);
    if (!selected.length) return;
    setPosting(true);
    
    try {
      const payload = selected.map(t => ({
        source: 'BANK_CSV',
        date: t.date,
        merchant: t.merchant,
        amount: t.amount,
        type: t.type,
        utr: t.utr,
        accountId: t.accountId,
        vendorId: null,
        pendingApproval: true
      }));

      const res = await fetch("/api/upi/staging/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: payload }),
      });
      
      if (res.ok) {
        setResult({ success: selected.length, failed: 0 });
        setTxns(prev => prev.filter(t => !t.selected));
      }
    } catch (err) {
      setResult({ success: 0, failed: selected.length });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Import Bank Statement</h1>
        <p className="text-zinc-500 mt-1">Upload CSV to bulk import transactions for approval.</p>
      </div>

      {result && (
        <div className={`p-4 rounded-lg flex gap-3 items-center ${result.failed === 0 ? "bg-green-50 text-green-800 border-l-4 border-green-500" : "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500"}`}>
          <Icon name={result.failed === 0 ? "check_circle" : "warning"} size={20} />
          <div className="flex-1">
            <p className="font-medium">Imported {result.success} transactions to Staging.</p>
            {result.failed > 0 && <p className="text-sm mt-1">{result.failed} failed to import.</p>}
          </div>
          <a href="/upi-capture" className="text-sm font-medium underline">Go to Pending Approval</a>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-4 py-4">
        {[
          { num: 1, label: "Upload CSV" },
          { num: 2, label: "Map Columns" },
          { num: 3, label: "Preview & Import" }
        ].map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s.num ? "bg-indigo-600 text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"}`}>
              {s.num}
            </div>
            <span className={`text-sm font-medium ${step >= s.num ? "text-zinc-900 dark:text-white" : "text-zinc-500"}`}>{s.label}</span>
            {s.num < 3 && <div className="w-12 h-px bg-zinc-200 dark:bg-zinc-800 mx-2" />}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        {step === 1 && (
          <div className="p-12">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
            }} />
            <div 
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-16 text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
            >
              {loading ? (
                <div className="animate-pulse">
                  <Icon name="hourglass_empty" size={48} color="var(--text-accent)" />
                  <p className="mt-4 font-medium text-zinc-600">Analyzing CSV...</p>
                </div>
              ) : (
                <>
                  <Icon name="upload_file" size={48} color="#9CA3AF" />
                  <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">Drag & drop your statement CSV here</p>
                  <p className="mt-1 text-sm text-zinc-500">Supports files from HDFC, SBI, ICICI, Kotak, Axis, etc.</p>
                  <button className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                    Browse Files
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-lg font-medium mb-4">Map Columns</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.keys(mapping).map((key) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-zinc-500 mb-1 capitalize">{key}</label>
                    <select 
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none focus:border-indigo-500"
                      value={mapping[key as keyof typeof mapping]}
                      onChange={e => setMapping(p => ({ ...p, [key]: e.target.value }))}
                    >
                      <option value="">- Ignore -</option>
                      {rawHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3 text-zinc-700 dark:text-zinc-300">Data Preview</h3>
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                    <tr>
                      {rawHeaders.map(h => <th key={h} className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 font-medium text-zinc-600 dark:text-zinc-400 whitespace-nowrap">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((r, i) => (
                      <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800/50">
                        {rawHeaders.map(h => <td key={h} className="px-4 py-2 text-zinc-800 dark:text-zinc-200 whitespace-nowrap">{r[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">Back</button>
              <button 
                onClick={() => generateTxns(mapping, rawRows)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Continue to Preview
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">{txns.length} transactions ready to import</p>
                <p className="text-xs text-zinc-500">Uncheck rows you want to skip.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 border border-zinc-200 rounded-lg bg-white">Back to Mapping</button>
                <button 
                  onClick={postSelected}
                  disabled={posting || txns.filter(t => t.selected).length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {posting ? "Importing..." : `Import ${txns.filter(t => t.selected).length} to Staging`}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[60vh]">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900 sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input type="checkbox" checked={txns.every(t => t.selected)} onChange={e => setTxns(p => p.map(t => ({ ...t, selected: e.target.checked })))} className="rounded text-indigo-600" />
                    </th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Date</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Description</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Account (Optional)</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500 text-right">Amount</th>
                    <th className="px-4 py-3 text-xs uppercase tracking-wider text-zinc-500">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {txns.map(t => (
                    <tr key={t.id} className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/30 ${!t.selected ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={t.selected} onChange={e => setTxns(p => p.map(x => x.id === t.id ? { ...x, selected: e.target.checked } : x))} className="rounded text-indigo-600" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">{t.date}</td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100 max-w-xs truncate" title={t.merchant}>{t.merchant}</td>
                      <td className="px-4 py-3">
                        <select 
                          className="w-full text-xs px-2 py-1.5 border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900 outline-none"
                          value={t.accountId || ""}
                          onChange={e => setTxns(p => p.map(x => x.id === t.id ? { ...x, accountId: e.target.value } : x))}
                        >
                          <option value="">- Assign later in Pending -</option>
                          {accounts?.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-medium ${t.type === 'DEBIT' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.type === 'DEBIT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {t.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
