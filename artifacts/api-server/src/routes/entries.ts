import { Router } from "express";
import { db } from "@workspace/db";
import { entries, entryLines, accounts } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/entries", async (_req, res) => {
  try {
    const rows = await db.select().from(entries).orderBy(desc(entries.entryDate), desc(entries.createdAt));
    res.json(rows);
  } catch {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

router.get("/entries/:id", async (req, res) => {
  try {
    const [entry] = await db.select().from(entries).where(eq(entries.id, req.params.id));
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    const lines = await db
      .select({
        id: entryLines.id,
        side: entryLines.side,
        amount: entryLines.amount,
        note: entryLines.note,
        accountCode: accounts.code,
        accountName: accounts.name,
      })
      .from(entryLines)
      .innerJoin(accounts, eq(entryLines.accountId, accounts.id))
      .where(eq(entryLines.entryId, entry.id));

    const totalDr = lines.filter(l => l.side === "DR").reduce((s, l) => s + parseFloat(l.amount as string), 0);
    const totalCr = lines.filter(l => l.side === "CR").reduce((s, l) => s + parseFloat(l.amount as string), 0);

    res.json({ ...entry, lines, totalDr, totalCr });
  } catch {
    res.status(500).json({ error: "Failed to fetch entry" });
  }
});

async function getNextVoucherNo(voucherType: string): Promise<string> {
  const prefix = voucherType.substring(0, 3).toUpperCase();
  const year = new Date().getFullYear();
  const count = await db.select({ cnt: sql<number>`count(*)` }).from(entries).where(eq(entries.voucherType, voucherType));
  const num = (Number(count[0]?.cnt ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}-${year}-${num}`;
}

router.post("/entries", async (req, res) => {
  try {
    const { entryDate, voucherType, narration, reference, lines } = req.body;

    if (!entryDate || !narration || !lines?.length) {
      return res.status(400).json({ error: "entryDate, narration, lines required" });
    }
    if (lines.length < 2) return res.status(400).json({ error: "At least 2 lines required" });

    const totalDr = lines.filter((l: any) => l.side === "DR").reduce((s: number, l: any) => s + Number(l.amount), 0);
    const totalCr = lines.filter((l: any) => l.side === "CR").reduce((s: number, l: any) => s + Number(l.amount), 0);
    if (Math.abs(totalDr - totalCr) > 0.01) {
      return res.status(400).json({ error: `Entry not balanced: DR ${totalDr} ≠ CR ${totalCr}` });
    }

    const voucherNo = await getNextVoucherNo(voucherType || "JOURNAL");

    const [entry] = await db.insert(entries).values({
      id: randomUUID(),
      entryDate,
      voucherNo,
      voucherType: voucherType || "JOURNAL",
      narration,
      reference: reference || null,
      status: "posted",
    }).returning();

    const lineRows = lines.map((l: any) => ({
      id: randomUUID(),
      entryId: entry.id,
      accountId: l.accountId,
      side: l.side,
      amount: l.amount.toString(),
      note: l.note || null,
    }));
    await db.insert(entryLines).values(lineRows);

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.post("/entries/upi-batch", async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ error: "transactions array required" });

  let success = 0; let failed = 0;

  for (const txn of transactions) {
    try {
      const [bankAccount] = await db.select().from(accounts).where(eq(accounts.code, "1002"));
      const [cashAccount] = await db.select().from(accounts).where(eq(accounts.code, "1001"));
      const [miscAccount] = await db.select().from(accounts).where(eq(accounts.code, "4999"));

      const bankAcc = bankAccount || cashAccount;
      const otherAcc = miscAccount;

      if (!bankAcc || !otherAcc) { failed++; continue; }

      const voucherNo = await getNextVoucherNo("PAYMENT");
      const isDebit = txn.type === "DEBIT";
      const [entry] = await db.insert(entries).values({
        id: randomUUID(),
        entryDate: txn.date || new Date().toISOString().split("T")[0],
        voucherNo,
        voucherType: isDebit ? "PAYMENT" : "RECEIPT",
        narration: `UPI ${isDebit ? "Payment" : "Receipt"} — ${txn.merchant}`,
        reference: txn.utr || null,
        status: "posted",
      }).returning();

      const lines = isDebit
        ? [
            { id: randomUUID(), entryId: entry.id, accountId: otherAcc.id, side: "DR", amount: txn.amount.toString(), note: null },
            { id: randomUUID(), entryId: entry.id, accountId: bankAcc.id, side: "CR", amount: txn.amount.toString(), note: null },
          ]
        : [
            { id: randomUUID(), entryId: entry.id, accountId: bankAcc.id, side: "DR", amount: txn.amount.toString(), note: null },
            { id: randomUUID(), entryId: entry.id, accountId: otherAcc.id, side: "CR", amount: txn.amount.toString(), note: null },
          ];

      await db.insert(entryLines).values(lines);
      success++;
    } catch { failed++; }
  }

  res.json({ success, failed });
});

export default router;
