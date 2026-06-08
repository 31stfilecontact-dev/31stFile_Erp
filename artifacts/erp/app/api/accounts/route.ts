import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
export async function GET() {
  const data = await db.select().from(accounts).where(eq(accounts.isActive,true));
  return NextResponse.json(data);
}
export async function POST(req:Request) {
  try {
    const body = await req.json();
    const [acct] = await db.insert(accounts).values(body).returning();
    return NextResponse.json({success:true,account:acct});
  } catch(e:any){ return NextResponse.json({error:e.message},{status:500}); }
}
