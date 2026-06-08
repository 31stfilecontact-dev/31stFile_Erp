import Papa from "papaparse";
export interface UPITxn {
  id: string; date: string; merchant: string;
  upiId: string; utr: string; amount: number;
  type: "DEBIT"|"CREDIT"; source: "CSV"|"SMS"|"MANUAL";
  matchStatus: "MATCHED"|"UNMATCHED";
}
export async function parseUPICSV(file: File): Promise<UPITxn[]> {
  return new Promise(resolve => {
    Papa.parse(file,{ header:true, skipEmptyLines:true, complete:({data}) => {
      const rows = data as Record<string,string>[];
      resolve(rows.map(r=>{
        const rawAmt = r.Amount||r.amount||r.Debit||r.Credit||r["Transaction Amount"]||"0";
        const amount = parseFloat(rawAmt.replace(/[₹,\s]/g,""));
        if(!amount) return null;
        const tstr = (r.Type||r["Dr/Cr"]||r["Transaction Type"]||"DEBIT").toUpperCase();
        return {
          id: crypto.randomUUID(),
          date: r.Date||r["Transaction Date"]||r.date||"",
          merchant: r.Description||r.Merchant||r["To/From"]||r.Payee||"Unknown",
          upiId: r["UPI ID"]||r.VPA||r.upi_id||"",
          utr: r.UTR||r["Reference No"]||r["Transaction ID"]||r["Ref No"]||"",
          amount, type:(tstr.includes("CR")||tstr.includes("CREDIT"))?"CREDIT":"DEBIT",
          source:"CSV" as const, matchStatus:"UNMATCHED" as const,
        };
      }).filter(Boolean) as UPITxn[]);
    }});
  });
}
export function parseUPISMS(text: string): UPITxn[] {
  return text.split("\n").filter(l=>l.trim().length>20).map(sms=>{
    const amt = sms.match(/(?:rs|inr|₹)\.?\s*([\d,]+(?:\.\d{2})?)/i);
    if(!amt) return null;
    const utr  = sms.match(/(?:ref|utr|txn)[:\s.]*([A-Z0-9]{8,22})/i);
    const party= sms.match(/(?:to|paid to|from)\s+([A-Za-z0-9@._\s]{3,40}?)(?:\s+on|\.|,|$)/i);
    const upiId= sms.match(/([a-zA-Z0-9._-]+@[a-zA-Z]{2,})/);
    const dt   = sms.match(/\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/);
    return {
      id:crypto.randomUUID(),
      date:dt?.[0]??new Date().toLocaleDateString("en-IN"),
      merchant:party?.[1]?.trim()??upiId?.[1]??"Unknown",
      upiId:upiId?.[1]??"", utr:utr?.[1]??"",
      amount:parseFloat(amt[1].replace(/,/g,"")),
      type:/(?:debited|paid|sent)/i.test(sms)?"DEBIT":"CREDIT",
      source:"SMS" as const, matchStatus:"UNMATCHED" as const,
    };
  }).filter(Boolean) as UPITxn[];
}
