import { Router } from "express";
import { db } from "@workspace/db";
import { accounts, upiRules } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { randomUUID } from "crypto";

const router = Router();

router.get("/upi/rules", async (_req, res) => {
  try {
    const rules = await db
      .select({
        id: upiRules.id,
        keyword: upiRules.keyword,
        accountId: upiRules.accountId,
        accountCode: upiRules.accountCode,
        active: upiRules.active,
        createdAt: upiRules.createdAt,
        accountName: accounts.name,
      })
      .from(upiRules)
      .leftJoin(accounts, eq(accounts.id, upiRules.accountId))
      .orderBy(asc(upiRules.createdAt));
    res.json(rules);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch UPI rules" });
  }
});

router.post("/upi/rules", async (req, res) => {
  try {
    const { keyword, accountId } = req.body;
    if (!keyword || !accountId) return res.status(400).json({ error: "keyword and accountId required" });
    const [acct] = await db.select().from(accounts).where(eq(accounts.id, accountId));
    if (!acct) return res.status(400).json({ error: "Account not found" });

    const [rule] = await db.insert(upiRules).values({
      id: randomUUID(),
      keyword: keyword.trim().toLowerCase(),
      accountId: acct.id,
      accountCode: acct.code,
      active: true,
    }).returning();
    res.status(201).json({ ...rule, accountName: acct.name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create UPI rule" });
  }
});

router.delete("/upi/rules/:id", async (req, res) => {
  try {
    await db.delete(upiRules).where(eq(upiRules.id, req.params.id));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete rule" });
  }
});

router.get("/upi/accounts", async (_req, res) => {
  try {
    const accts = await db.select({
      id: accounts.id, code: accounts.code, name: accounts.name, group: accounts.group, subGroup: accounts.subGroup,
    }).from(accounts).orderBy(asc(accounts.group), asc(accounts.code));
    res.json(accts);
  } catch {
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

export default router;
