import { Router } from "express";
import { db } from "@workspace/db";
import { entries, entryLines, accounts } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth } from "./auth";

const router = Router();

function fyTag(dateStr: string): string {
  const yr = parseInt(dateStr.slice(0, 4));
  const mo = parseInt(dateStr.slice(5, 7));
  const startYr = mo >= 4 ? yr : yr - 1;
  return `${String(startYr).slice(2)}${String(startYr + 1).slice(2)}`;
}

async function getNextVoucherNo(voucherType: string, dateStr?: string): Promise<string> {
  const prefix = voucherType.substring(0, 3).toUpperCase();
  const tag = dateStr ? fyTag(dateStr) : fyTag(new Date().toISOString().split("T")[0]);
  const count = await db.select({ cnt: sql<number>`count(*)` }).from(entries).where(eq(entries.voucherType, voucherType));
  const num = (Number(count[0]?.cnt ?? 0) + 1).toString().padStart(4, "0");
  return `${prefix}-${tag}-${num}`;
}

router.get("/entries", requireAuth, async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: entries.id, entryDate: entries.entryDate, voucherNo: entries.voucherNo,
        voucherType: entries.voucherType, narration: entries.narration,
        reference: entries.reference, status: entries.status, createdAt: entries.createdAt,
        lineId: entryLines.id, lineSide: entryLines.side, lineAmount: entryLines.amount,
        lineNote: entryLines.note, lineAccountId: accounts.id,
        lineAccountCode: accounts.code, lineAccountName: accounts.name,
      })
      .from(entries)
      .leftJoin(entryLines, eq(entryLines.entryId, entries.id))
      .leftJoin(accounts, eq(accounts.id, entryLines.accountId))
      .orderBy(desc(entries.entryDate), desc(entries.createdAt));

    const entryMap = new Map<string, any>();
    for (const row of rows) {
      if (!entryMap.has(row.id)) {
        entryMap.set(row.id, {
          id: row.id, entryDate: row.entryDate, voucherNo: row.voucherNo,
          voucherType: row.voucherType, narration: row.narration,
          reference: row.reference, status: row.status, createdAt: row.createdAt, lines: [],
        });
      }
      if (row.lineId) {
        entryMap.get(row.id).lines.push({
          id: row.lineId, side: row.lineSide, amount: row.lineAmount,
          note: row.lineNote, accountCode: row.lineAccountCode, accountName: row.lineAccountName,
        });
      }
    }
    res.json([...entryMap.values()]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

router.get("/entries/:id", requireAuth, async (req, res) => {
  try {
    const [entry] = await db.select().from(entries).where(eq(entries.id, req.params.id as string));
    if (!entry) return res.status(404).json({ error: "Entry not found" });

    const lines = await db
      .select({
        id: entryLines.id, side: entryLines.side, amount: entryLines.amount,
        note: entryLines.note, accountCode: accounts.code, accountName: accounts.name,
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

router.post("/entries", requireAuth, async (req, res) => {
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

    const voucherNo = await getNextVoucherNo(voucherType || "JOURNAL", entryDate);

    const [entry] = await db.insert(entries).values({
      id: randomUUID(), entryDate, voucherNo,
      voucherType: voucherType || "JOURNAL",
      narration, reference: reference || null, status: "posted",
    }).returning();

    const lineRows: any[] = [];
    for (const l of lines) {
      if (l.accountId) {
        const [acct] = await db.select().from(accounts).where(eq(accounts.id, l.accountId));
        if (!acct) {
          await db.delete(entries).where(eq(entries.id, entry.id));
          return res.status(400).json({ error: `Account ID "${l.accountId}" not found. Entry rolled back.` });
        }
        lineRows.push({ id: randomUUID(), entryId: entry.id, accountId: acct.id, side: l.side, amount: l.amount.toString(), note: l.note || null });
      } else if (l.accountCode) {
        const [acct] = await db.select().from(accounts).where(eq(accounts.code, l.accountCode));
        if (!acct) {
          await db.delete(entries).where(eq(entries.id, entry.id));
          return res.status(400).json({ error: `Account code "${l.accountCode}" not found. Entry rolled back.` });
        }
        lineRows.push({ id: randomUUID(), entryId: entry.id, accountId: acct.id, side: l.side, amount: l.amount.toString(), note: l.note || null });
      }
    }

    await db.insert(entryLines).values(lineRows);
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create entry" });
  }
});

router.post("/entries/upi-batch", requireAuth, async (req, res) => {
  const { transactions } = req.body;
  if (!Array.isArray(transactions)) return res.status(400).json({ error: "transactions array required" });

  let success = 0; let failed = 0;
  const [bankAccount] = await db.select().from(accounts).where(eq(accounts.code, "1002"));
  const [cashAccount] = await db.select().from(accounts).where(eq(accounts.code, "1001"));
  const bankAcc = bankAccount || cashAccount;
  if (!bankAcc) return res.status(400).json({ error: "Bank/cash account (code 1002 or 1001) not found" });

  for (const txn of transactions) {
    try {
      let ledgerAcc: any = null;
      if (txn.accountId) {
        [ledgerAcc] = await db.select().from(accounts).where(eq(accounts.id, txn.accountId));
      } else if (txn.accountCode) {
        [ledgerAcc] = await db.select().from(accounts).where(eq(accounts.code, txn.accountCode));
      }
      if (!ledgerAcc) {
        const [misc] = await db.select().from(accounts).where(eq(accounts.code, "4999"));
        ledgerAcc = misc;
      }
      if (!ledgerAcc) { failed++; continue; }

      const isDebit = txn.type === "DEBIT";
      const entryDate = txn.date || new Date().toISOString().split("T")[0];
      const voucherNo = await getNextVoucherNo(isDebit ? "PAYMENT" : "RECEIPT", entryDate);

      const [entry] = await db.insert(entries).values({
        id: randomUUID(), entryDate, voucherNo,
        voucherType: isDebit ? "PAYMENT" : "RECEIPT",
        narration: `UPI ${isDebit ? "Payment" : "Receipt"} — ${txn.merchant}`,
        reference: txn.utr || null, status: "posted",
      }).returning();

      const lines: any[] = isDebit
        ? [
            { id: randomUUID(), entryId: entry.id, accountId: ledgerAcc.id, side: "DR", amount: txn.amount.toString(), note: null },
            { id: randomUUID(), entryId: entry.id, accountId: bankAcc.id, side: "CR", amount: txn.amount.toString(), note: null },
          ]
        : [
            { id: randomUUID(), entryId: entry.id, accountId: bankAcc.id, side: "DR", amount: txn.amount.toString(), note: null },
            { id: randomUUID(), entryId: entry.id, accountId: ledgerAcc.id, side: "CR", amount: txn.amount.toString(), note: null },
          ];

      await db.insert(entryLines).values(lines);
      success++;
    } catch (e) { console.error(e); failed++; }
  }

  res.json({ success, failed });
});

export default router;
