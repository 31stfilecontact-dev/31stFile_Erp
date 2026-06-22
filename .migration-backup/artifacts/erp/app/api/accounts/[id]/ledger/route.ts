import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accounts, entryLines, entries } from "@/lib/db/schema";
import { eq, and, lte, gte, asc, sum } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  const { id } = await params;

  // Detect UUID vs account code
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUuid  = UUID_RE.test(id);

  const [acct] = await db.select().from(accounts)
    .where(isUuid ? eq(accounts.id, id) : eq(accounts.code, id))
    .limit(1);

  if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  return buildLedger(acct, from, to);
}

async function redirect(req: Request, acct: typeof accounts.$inferSelect) {
  return buildLedger(acct, new URL(req.url).searchParams.get("from"), new URL(req.url).searchParams.get("to"));
}

async function buildLedger(
  acct: typeof accounts.$inferSelect,
  from: string | null,
  to: string | null,
) {
  const openingBal = parseFloat(acct.openingBal ?? "0");
  const openingDrCr = acct.openingBalDrCr ?? "DR";

  // Opening balance as a signed net (positive = DR, negative = CR)
  let openingNet = openingDrCr === "DR" ? openingBal : -openingBal;

  // If date range given, compute balance of lines BEFORE `from` first
  let preBalance = openingNet;
  if (from) {
    const preFilter = and(
      eq(entryLines.accountId, acct.id),
      lte(entries.entryDate, shiftDay(from, -1)),
      eq(entries.status, "POSTED"),
    );
    const [preDr] = await db.select({ total: sum(entryLines.amount) })
      .from(entryLines).innerJoin(entries, eq(entries.id, entryLines.entryId))
      .where(and(preFilter!, eq(entryLines.side, "DR")));
    const [preCr] = await db.select({ total: sum(entryLines.amount) })
      .from(entryLines).innerJoin(entries, eq(entries.id, entryLines.entryId))
      .where(and(preFilter!, eq(entryLines.side, "CR")));
    preBalance = openingNet + parseFloat(preDr?.total ?? "0") - parseFloat(preCr?.total ?? "0");
  }

  // Fetch lines in range
  const conditions = [
    eq(entryLines.accountId, acct.id),
    eq(entries.status, "POSTED"),
    ...(from ? [gte(entries.entryDate, from)] : []),
    ...(to   ? [lte(entries.entryDate, to)]   : []),
  ];

  const rows = await db
    .select({
      lineId:    entryLines.id,
      entryId:   entries.id,
      entryDate: entries.entryDate,
      voucherNo: entries.voucherNo,
      voucherType: entries.voucherType,
      narration: entries.narration,
      reference: entries.reference,
      side:      entryLines.side,
      amount:    entryLines.amount,
      lineNote:  entryLines.lineNote,
    })
    .from(entryLines)
    .innerJoin(entries, eq(entries.id, entryLines.entryId))
    .where(and(...conditions))
    .orderBy(asc(entries.entryDate), asc(entries.createdAt));

  // Compute running balance
  let running = preBalance;
  const lines = rows.map(r => {
    const amt = parseFloat(r.amount);
    const dr  = r.side === "DR" ? amt : 0;
    const cr  = r.side === "CR" ? amt : 0;
    running += dr - cr;
    const balDrCr = running >= 0 ? "DR" : "CR";
    return { ...r, amount: amt, dr, cr, balance: Math.abs(running), balanceDrCr: balDrCr };
  });

  const totalDr = lines.reduce((s, r) => s + r.dr, 0);
  const totalCr = lines.reduce((s, r) => s + r.cr, 0);
  const closingNet = running;
  const closingBal = Math.abs(closingNet);
  const closingDrCr = closingNet >= 0 ? "DR" : "CR";

  return NextResponse.json({
    account: {
      id: acct.id,
      code: acct.code,
      name: acct.name,
      group: acct.group,
      subGroup: acct.subGroup,
      normalBal: acct.normalBal,
    },
    from, to,
    openingBalance: Math.abs(preBalance),
    openingDrCr: preBalance >= 0 ? "DR" : "CR",
    lines,
    totalDr,
    totalCr,
    closingBalance: closingBal,
    closingDrCr,
  });
}

function shiftDay(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
