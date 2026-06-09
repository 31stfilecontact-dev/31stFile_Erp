import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { entries, entryLines, accounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const [entry] = await db.select().from(entries)
    .where(eq(entries.id, params.id)).limit(1);

  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  const lines = await db
    .select({
      id:        entryLines.id,
      side:      entryLines.side,
      amount:    entryLines.amount,
      lineNote:  entryLines.lineNote,
      accountId: entryLines.accountId,
      code:      accounts.code,
      name:      accounts.name,
      group:     accounts.group,
    })
    .from(entryLines)
    .innerJoin(accounts, eq(accounts.id, entryLines.accountId))
    .where(eq(entryLines.entryId, params.id));

  const totalDr = lines.filter(l => l.side === "DR").reduce((s, l) => s + parseFloat(l.amount), 0);
  const totalCr = lines.filter(l => l.side === "CR").reduce((s, l) => s + parseFloat(l.amount), 0);

  return NextResponse.json({
    ...entry,
    lines: lines.map(l => ({ ...l, amount: parseFloat(l.amount) })),
    totalDr,
    totalCr,
    balanced: Math.abs(totalDr - totalCr) < 0.01,
  });
}
