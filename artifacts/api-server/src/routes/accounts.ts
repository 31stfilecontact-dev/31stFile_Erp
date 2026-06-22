import { Router } from "express";
import { db } from "@workspace/db";
import { accounts, entryLines, entries } from "@workspace/db";
import { eq, and, gte, lte, sql, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/accounts", async (_req, res) => {
  try {
    const rows = await db.select().from(accounts).orderBy(asc(accounts.code));
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

router.post("/accounts", async (req, res) => {
  try {
    const { code, name, group, subGroup, normalBal } = req.body;
    if (!code || !name || !group) return res.status(400).json({ error: "code, name, group required" });

    const [existing] = await db.select().from(accounts).where(eq(accounts.code, code));
    if (existing) return res.status(409).json({ error: "Account code already exists" });

    const [acc] = await db.insert(accounts).values({
      id: randomUUID(), code, name, group,
      subGroup: subGroup || null,
      normalBal: normalBal || "DR",
    }).returning();
    res.status(201).json(acc);
  } catch (err) {
    res.status(500).json({ error: "Failed to create account" });
  }
});

router.get("/accounts/:code/ledger", async (req, res) => {
  try {
    const { code } = req.params;
    const { from, to } = req.query as { from?: string; to?: string };

    const [account] = await db.select().from(accounts).where(eq(accounts.code, code));
    if (!account) return res.status(404).json({ error: "Account not found" });

    const normalBal = account.normalBal || "DR";

    const conditions = [eq(entryLines.accountId, account.id)];
    if (from) conditions.push(gte(entries.entryDate, from));
    if (to) conditions.push(lte(entries.entryDate, to));

    const lines = await db
      .select({
        lineId: entryLines.id,
        entryId: entries.id,
        entryDate: entries.entryDate,
        voucherNo: entries.voucherNo,
        voucherType: entries.voucherType,
        narration: entries.narration,
        reference: entries.reference,
        side: entryLines.side,
        amount: entryLines.amount,
        lineNote: entryLines.note,
      })
      .from(entryLines)
      .innerJoin(entries, eq(entryLines.entryId, entries.id))
      .where(and(...conditions))
      .orderBy(asc(entries.entryDate), asc(entries.voucherNo));

    // Compute running balance
    let balance = 0;
    const processedLines = lines.map(l => {
      const amt = parseFloat(l.amount as string);
      const dr = l.side === "DR" ? amt : 0;
      const cr = l.side === "CR" ? amt : 0;
      if (normalBal === "DR") balance += dr - cr;
      else balance += cr - dr;
      const balanceDrCr = normalBal === "DR" ? (balance >= 0 ? "DR" : "CR") : (balance >= 0 ? "CR" : "DR");
      return { ...l, dr, cr, balance: Math.abs(balance), balanceDrCr };
    });

    const totalDr = processedLines.reduce((s, l) => s + l.dr, 0);
    const totalCr = processedLines.reduce((s, l) => s + l.cr, 0);
    const closingBalance = Math.abs(balance);
    const closingDrCr = normalBal === "DR" ? (balance >= 0 ? "DR" : "CR") : (balance >= 0 ? "CR" : "DR");

    res.json({
      account,
      from: from || null,
      to: to || null,
      openingBalance: 0,
      openingDrCr: normalBal,
      lines: processedLines,
      totalDr,
      totalCr,
      closingBalance,
      closingDrCr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

export default router;
