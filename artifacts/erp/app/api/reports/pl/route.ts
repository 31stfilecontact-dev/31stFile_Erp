import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts,entryLines,entries } from "@/lib/db/schema";
import { eq,and,gte,lte,sum } from "drizzle-orm";

export async function GET(req:Request) {
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period")??"ytd";
  const now = new Date();
  const yr  = now.getMonth()>=3 ? now.getFullYear() : now.getFullYear()-1;
  const from = period==="month"
    ? `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`
    : `${yr}-04-01`;
  const to = now.toISOString().split("T")[0];

  async function getBal(acctId:string,side:"DR"|"CR"){
    const [r] = await db.select({total:sum(entryLines.amount)}).from(entryLines)
      .innerJoin(entries,eq(entries.id,entryLines.entryId))
      .where(and(eq(entryLines.accountId,acctId),eq(entryLines.side,side),
        gte(entries.entryDate,from),lte(entries.entryDate,to),eq(entries.status,"POSTED")));
    return parseFloat(r?.total??"0");
  }

  const incomeAccts  = await db.select().from(accounts).where(eq(accounts.group,"Income"));
  const expenseAccts = await db.select().from(accounts).where(eq(accounts.group,"Expenses"));

  const income   = await Promise.all(incomeAccts.map(async a=>({name:a.name,amount:await getBal(a.id,"CR")-await getBal(a.id,"DR")})));
  const expenses = await Promise.all(expenseAccts.map(async a=>({name:a.name,amount:await getBal(a.id,"DR")-await getBal(a.id,"CR")})));

  const grossIncome   = income.reduce((s,i)=>s+i.amount,0);
  const totalExpenses = expenses.reduce((s,e)=>s+e.amount,0);
  return NextResponse.json({income,expenses,grossIncome,totalExpenses,netProfit:grossIncome-totalExpenses,period,from,to});
}
