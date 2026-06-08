import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts,entryLines,entries } from "@/lib/db/schema";
import { eq,and,lte,sum } from "drizzle-orm";

export async function GET(req:Request) {
  const { searchParams } = new URL(req.url);
  const asAt = searchParams.get("asAt") ?? new Date().toISOString().split("T")[0];

  const allAccs = await db.select().from(accounts).where(eq(accounts.isActive,true));

  const getBal = async(acctId:string,side:"DR"|"CR") => {
    const [r] = await db.select({total:sum(entryLines.amount)}).from(entryLines)
      .innerJoin(entries,eq(entries.id,entryLines.entryId))
      .where(and(eq(entryLines.accountId,acctId),eq(entryLines.side,side),lte(entries.entryDate,asAt),eq(entries.status,"POSTED")));
    return parseFloat(r?.total??"0");
  };

  const balances = await Promise.all(allAccs.map(async a=>{
    const op = parseFloat(a.openingBal??"0");
    const dr = await getBal(a.id,"DR")+(a.openingBalDrCr==="DR"?op:0);
    const cr = await getBal(a.id,"CR")+(a.openingBalDrCr==="CR"?op:0);
    return {...a,net:dr-cr};
  }));

  const g = (group:string,positive:boolean) =>
    balances.filter(a=>a.group===group).reduce((s,a)=>{
      const v = positive ? Math.max(0,a.net) : Math.max(0,-a.net);
      return s+v;
    },0);

  const totalAssets        = g("Assets",true);
  const capital            = balances.find(a=>a.code==="2101")?Math.abs(balances.find(a=>a.code==="2101")!.net):0;
  const drawings           = balances.find(a=>a.code==="2102")?Math.abs(balances.find(a=>a.code==="2102")!.net):0;
  const totalIncome        = balances.filter(a=>a.group==="Income").reduce((s,a)=>s+Math.max(0,-a.net),0);
  const totalExpenses      = balances.filter(a=>a.group==="Expenses").reduce((s,a)=>s+Math.max(0,a.net),0);
  const netProfit          = totalIncome - totalExpenses;
  const totalEquity        = capital + netProfit - drawings;
  const currentLiab        = balances.filter(a=>a.group==="Liabilities"&&a.subGroup==="Current Liabilities").reduce((s,a)=>s+Math.max(0,-a.net),0);
  const totalEquityLiab    = totalEquity + currentLiab;

  return NextResponse.json({
    totalAssets, totalEquityLiabilities:totalEquityLiab,
    balanced: Math.abs(totalAssets-totalEquityLiab)<1,
    equity:{ capital, netProfit, drawings, total:totalEquity },
    currentLiabilities: currentLiab,
    breakdown: balances.filter(a=>a.group==="Assets"&&a.subGroup==="Current Assets")
      .map(a=>({code:a.code,name:a.name,amount:Math.abs(a.net)})),
  });
}
