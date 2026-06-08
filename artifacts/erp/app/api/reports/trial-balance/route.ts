import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts,entryLines,entries } from "@/lib/db/schema";
import { eq,and,lte,sum } from "drizzle-orm";

export async function GET(req:Request) {
  const { searchParams } = new URL(req.url);
  const asAt = searchParams.get("asAt") ?? new Date().toISOString().split("T")[0];
  const allAccs = await db.select().from(accounts).where(eq(accounts.isActive,true));

  const rows = await Promise.all(allAccs.map(async(a)=>{
    const getSum = async(side:"DR"|"CR") => {
      const [r] = await db.select({total:sum(entryLines.amount)})
        .from(entryLines).innerJoin(entries,eq(entries.id,entryLines.entryId))
        .where(and(eq(entryLines.accountId,a.id),eq(entryLines.side,side),lte(entries.entryDate,asAt),eq(entries.status,"POSTED")));
      return parseFloat(r?.total??"0");
    };
    const opBal  = parseFloat(a.openingBal??"0");
    const drAmt  = await getSum("DR") + (a.openingBalDrCr==="DR"?opBal:0);
    const crAmt  = await getSum("CR") + (a.openingBalDrCr==="CR"?opBal:0);
    return {...a, closingDr:Math.max(0,drAmt-crAmt), closingCr:Math.max(0,crAmt-drAmt)};
  }));

  const nonZero = rows.filter(r=>r.closingDr!==0||r.closingCr!==0);
  const totalDr = nonZero.reduce((s,r)=>s+r.closingDr,0);
  const totalCr = nonZero.reduce((s,r)=>s+r.closingCr,0);
  return NextResponse.json({accounts:nonZero,totalDr,totalCr,balanced:Math.abs(totalDr-totalCr)<0.01,asAt});
}
