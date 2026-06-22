import { Router } from "express";
import { db } from "@workspace/db";
import { accounts, entries, entryLines } from "@workspace/db";
import { eq, and, lte, gte, sql, asc, desc } from "drizzle-orm";

const router = Router();

function fyDates() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${year}-04-01`, to: `${year + 1}-03-31` };
}

router.get("/reports/trial-balance", async (req, res) => {
  try {
    const asAt = (req.query.asAt as string) || new Date().toISOString().split("T")[0];

    const accts = await db.select().from(accounts).orderBy(asc(accounts.group), asc(accounts.code));

    const rows = await Promise.all(accts.map(async (acc) => {
      const lines = await db
        .select({ side: entryLines.side, amount: entryLines.amount })
        .from(entryLines)
        .innerJoin(entries, eq(entryLines.entryId, entries.id))
        .where(and(eq(entryLines.accountId, acc.id), lte(entries.entryDate, asAt)));

      let net = 0;
      for (const l of lines) {
        const amt = parseFloat(l.amount as string);
        if (acc.normalBal === "DR") net += l.side === "DR" ? amt : -amt;
        else net += l.side === "CR" ? amt : -amt;
      }

      return {
        accountId: acc.id, code: acc.code, name: acc.name, group: acc.group,
        subGroup: acc.subGroup, normalBal: acc.normalBal,
        dr: acc.normalBal === "DR" && net > 0 ? net : (acc.normalBal === "CR" && net < 0 ? Math.abs(net) : 0),
        cr: acc.normalBal === "CR" && net > 0 ? net : (acc.normalBal === "DR" && net < 0 ? Math.abs(net) : 0),
      };
    }));

    const totalDr = rows.reduce((s, r) => s + r.dr, 0);
    const totalCr = rows.reduce((s, r) => s + r.cr, 0);

    res.json({ rows, totalDr, totalCr, balanced: Math.abs(totalDr - totalCr) < 0.01 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute trial balance" });
  }
});

router.get("/reports/pl", async (req, res) => {
  try {
    const period = req.query.period as string || "ytd";
    const fy = fyDates();
    let from = fy.from;
    let to = fy.to;

    if (period === "month") {
      const now = new Date();
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      to = now.toISOString().split("T")[0];
    }

    const incomeAccts = await db.select().from(accounts).where(eq(accounts.group, "Income"));
    const expenseAccts = await db.select().from(accounts).where(eq(accounts.group, "Expenses"));

    async function getBalance(acc: typeof accounts.$inferSelect) {
      const lines = await db
        .select({ side: entryLines.side, amount: entryLines.amount })
        .from(entryLines)
        .innerJoin(entries, eq(entryLines.entryId, entries.id))
        .where(and(eq(entryLines.accountId, acc.id), gte(entries.entryDate, from), lte(entries.entryDate, to)));
      let net = 0;
      for (const l of lines) {
        const amt = parseFloat(l.amount as string);
        if (acc.normalBal === "DR") net += l.side === "DR" ? amt : -amt;
        else net += l.side === "CR" ? amt : -amt;
      }
      return net;
    }

    const income = await Promise.all(incomeAccts.map(async acc => ({ name: acc.name, amount: await getBalance(acc) })));
    const expenses = await Promise.all(expenseAccts.map(async acc => ({ name: acc.name, amount: await getBalance(acc) })));

    const grossIncome = income.reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    res.json({ income, expenses, grossIncome, totalExpenses, netProfit: grossIncome - totalExpenses, from, to });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute P&L" });
  }
});

router.get("/reports/balance-sheet", async (req, res) => {
  try {
    const asAt = (req.query.asAt as string) || new Date().toISOString().split("T")[0];
    const fy = fyDates();

    const accts = await db.select().from(accounts).orderBy(asc(accounts.code));

    async function getBalance(acc: typeof accounts.$inferSelect, limitTo?: string) {
      const conds = [eq(entryLines.accountId, acc.id)];
      if (limitTo) conds.push(lte(entries.entryDate, limitTo));
      const lines = await db
        .select({ side: entryLines.side, amount: entryLines.amount })
        .from(entryLines)
        .innerJoin(entries, eq(entryLines.entryId, entries.id))
        .where(and(...conds));
      let net = 0;
      for (const l of lines) {
        const amt = parseFloat(l.amount as string);
        if (acc.normalBal === "DR") net += l.side === "DR" ? amt : -amt;
        else net += l.side === "CR" ? amt : -amt;
      }
      return net;
    }

    const assetAccts = accts.filter(a => a.group === "Assets");
    const liabilityAccts = accts.filter(a => a.group === "Liabilities");
    const equityAccts = accts.filter(a => a.group === "Equity");
    const incomeAccts = accts.filter(a => a.group === "Income");
    const expenseAccts = accts.filter(a => a.group === "Expenses");

    const assetBalances = await Promise.all(assetAccts.map(async acc => ({ name: acc.name, amount: await getBalance(acc, asAt) })));
    const liabilityBalances = await Promise.all(liabilityAccts.map(async acc => getBalance(acc, asAt)));
    const equityBalances = await Promise.all(equityAccts.map(async acc => getBalance(acc, asAt)));
    const incomeBalances = await Promise.all(incomeAccts.map(async acc => getBalance(acc)));
    const expenseBalances = await Promise.all(expenseAccts.map(async acc => getBalance(acc)));

    const totalAssets = assetBalances.reduce((s, b) => s + b.amount, 0);
    const totalLiabilities = liabilityBalances.reduce((s, b) => s + b, 0);
    const capitalEquity = equityBalances.reduce((s, b) => s + b, 0);
    const netProfit = incomeBalances.reduce((s, b) => s + b, 0) - expenseBalances.reduce((s, b) => s + b, 0);

    const totalEquity = capitalEquity + netProfit;
    const totalEquityLiabilities = totalEquity + totalLiabilities;

    res.json({
      totalAssets,
      totalEquityLiabilities,
      balanced: Math.abs(totalAssets - totalEquityLiabilities) < 1,
      equity: { capital: capitalEquity, netProfit, drawings: 0, total: totalEquity },
      currentLiabilities: totalLiabilities,
      breakdown: assetBalances.filter(b => b.amount !== 0),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute balance sheet" });
  }
});

router.get("/reports/dashboard", async (_req, res) => {
  try {
    const accts = await db.select().from(accounts);
    const recentEntries = await db.select().from(entries).orderBy(desc(entries.entryDate), desc(entries.createdAt)).limit(5);
    const totalEntries = await db.select({ cnt: sql<number>`count(*)` }).from(entries);

    async function getAcctBalance(code: string) {
      const [acc] = accts.filter(a => a.code === code);
      if (!acc) return 0;
      const lines = await db.select({ side: entryLines.side, amount: entryLines.amount }).from(entryLines).innerJoin(entries, eq(entryLines.entryId, entries.id)).where(eq(entryLines.accountId, acc.id));
      let net = 0;
      for (const l of lines) {
        const amt = parseFloat(l.amount as string);
        if (acc.normalBal === "DR") net += l.side === "DR" ? amt : -amt;
        else net += l.side === "CR" ? amt : -amt;
      }
      return net;
    }

    const now = new Date();
    const monthFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthTo = now.toISOString().split("T")[0];

    const incomeAccts = accts.filter(a => a.group === "Income");
    const expenseAccts = accts.filter(a => a.group === "Expenses");

    async function getMonthBalance(acc: typeof accounts.$inferSelect) {
      const lines = await db.select({ side: entryLines.side, amount: entryLines.amount })
        .from(entryLines)
        .innerJoin(entries, eq(entryLines.entryId, entries.id))
        .where(and(eq(entryLines.accountId, acc.id), gte(entries.entryDate, monthFrom), lte(entries.entryDate, monthTo)));
      let net = 0;
      for (const l of lines) {
        const amt = parseFloat(l.amount as string);
        if (acc.normalBal === "DR") net += l.side === "DR" ? amt : -amt;
        else net += l.side === "CR" ? amt : -amt;
      }
      return net;
    }

    const [thisMonthIncome, thisMonthExpenses, cashBalance, bankBalance] = await Promise.all([
      Promise.all(incomeAccts.map(getMonthBalance)).then(bs => bs.reduce((s, b) => s + b, 0)),
      Promise.all(expenseAccts.map(getMonthBalance)).then(bs => bs.reduce((s, b) => s + b, 0)),
      getAcctBalance("1001"),
      getAcctBalance("1002"),
    ]);

    res.json({
      totalEntries: Number(totalEntries[0]?.cnt ?? 0),
      totalAccounts: accts.length,
      cashBalance,
      bankBalance,
      recentEntries,
      thisMonthIncome,
      thisMonthExpenses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load dashboard" });
  }
});

export default router;
