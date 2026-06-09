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
      .where(and(
        eq(entryLines.accountId,acctId),
        eq(entryLines.side,side),
        lte(entries.entryDate,asAt),
        eq(entries.status,"POSTED"),
      ));
    return parseFloat(r?.total??"0");
  };

  const balances = await Promise.all(allAccs.map(async a=>{
    const op = parseFloat(a.openingBal??"0");
    const dr = await getBal(a.id,"DR")+(a.openingBalDrCr==="DR"?op:0);
    const cr = await getBal(a.id,"CR")+(a.openingBalDrCr==="CR"?op:0);
    return {...a, net:dr-cr};
  }));

  // Assets — positive net = debit balance (normal for assets)
  const assetAccts    = balances.filter(a=>a.group==="Assets");
  const totalAssets   = assetAccts.reduce((s,a)=>s+Math.max(0,a.net),0);
  const currentAssets = assetAccts.filter(a=>a.subGroup==="Current Assets").map(a=>({code:a.code,name:a.name,amount:Math.max(0,a.net)}));
  const fixedAssets   = assetAccts.filter(a=>a.subGroup==="Fixed Assets").map(a=>({code:a.code,name:a.name,amount:Math.max(0,a.net)}));
  const otherAssets   = assetAccts.filter(a=>a.subGroup!=="Current Assets"&&a.subGroup!=="Fixed Assets").map(a=>({code:a.code,name:a.name,amount:Math.max(0,a.net)}));

  // Equity
  const capitalAcct  = balances.find(a=>a.code==="2101");
  const drawingsAcct = balances.find(a=>a.code==="2102");
  const capital  = capitalAcct  ? Math.max(0,-capitalAcct.net)  : 0;
  const drawings = drawingsAcct ? Math.max(0, drawingsAcct.net) : 0;

  // Net profit embedded in equity (income - expenses up to asAt)
  const totalIncome   = balances.filter(a=>a.group==="Income").reduce((s,a)=>s+Math.max(0,-a.net),0);
  const totalExpenses = balances.filter(a=>a.group==="Expenses").reduce((s,a)=>s+Math.max(0,a.net),0);
  const netProfit     = totalIncome-totalExpenses;
  const totalEquity   = capital+netProfit-drawings;

  // Liabilities
  const liabAccts   = balances.filter(a=>a.group==="Liabilities");
  const currentLiab = liabAccts.filter(a=>a.subGroup==="Current Liabilities").reduce((s,a)=>s+Math.max(0,-a.net),0);
  const longTermLiab= liabAccts.filter(a=>a.subGroup!=="Current Liabilities").reduce((s,a)=>s+Math.max(0,-a.net),0);
  const totalEquityLiab = totalEquity+currentLiab+longTermLiab;

  return NextResponse.json({
    asAt,
    totalAssets,
    totalEquityLiabilities: totalEquityLiab,
    balanced: Math.abs(totalAssets-totalEquityLiab)<1,
    assets: {
      currentAssets,
      fixedAssets,
      otherAssets,
      total: totalAssets,
    },
    equity: { capital, netProfit, drawings, total: totalEquity },
    liabilities: {
      current: currentLiab,
      longTerm: longTermLiab,
      total: currentLiab+longTermLiab,
      breakdown: liabAccts.map(a=>({code:a.code,name:a.name,subGroup:a.subGroup,amount:Math.max(0,-a.net)})),
    },
    // legacy field kept for UI compatibility
    currentLiabilities: currentLiab,
    breakdown: currentAssets,
  });
}
