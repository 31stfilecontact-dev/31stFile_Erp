import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, entryLines, accounts } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { voucherType,date:entryDate,narration,reference,sourceType,utrNumber,upiId,lines } = await req.json();
    const dr = lines.filter((l:any)=>l.side==="DR").reduce((s:number,l:any)=>s+ +l.amount,0);
    const cr = lines.filter((l:any)=>l.side==="CR").reduce((s:number,l:any)=>s+ +l.amount,0);
    if(Math.abs(dr-cr)>0.01) return NextResponse.json({error:`Not balanced — DR:${dr} CR:${cr}`},{status:400});
    const [{value:cnt}] = await db.select({value:count()}).from(entries);
    const pfx:Record<string,string> = {PAYMENT:"PMT",RECEIPT:"RCP",JOURNAL:"JRN",CONTRA:"CTR",SALES:"SLS",PURCHASE:"PUR"};
    const voucherNo = `${pfx[voucherType]??"JRN"}-2526-${String(+cnt+1).padStart(5,"0")}`;
    const [entry] = await db.insert(entries).values({
      entryDate,voucherType,voucherNo,narration,reference,
      sourceType:sourceType??"MANUAL",utrNumber,upiId,status:"POSTED",
    }).returning();
    for(const line of lines){
      const [acct] = await db.select({id:accounts.id}).from(accounts).where(eq(accounts.code,line.accountCode)).limit(1);
      if(!acct) continue;
      await db.insert(entryLines).values({entryId:entry.id,accountId:acct.id,side:line.side,amount:String(line.amount),lineNote:line.note??null});
    }
    return NextResponse.json({success:true,entry,voucherNo});
  } catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}

export async function GET() {
  const data = await db.select().from(entries).orderBy(desc(entries.entryDate));
  return NextResponse.json(data);
}
