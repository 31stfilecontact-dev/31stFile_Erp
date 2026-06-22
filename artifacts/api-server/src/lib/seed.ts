import { db } from "@workspace/db";
import { users, accounts } from "@workspace/db";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const DEFAULT_ACCOUNTS = [
  { code: "1001", name: "Cash in Hand",          group: "Assets",      normalBal: "DR" },
  { code: "1002", name: "Bank — Current A/c",     group: "Assets",      normalBal: "DR" },
  { code: "1101", name: "Trade Receivables",       group: "Assets",      normalBal: "DR" },
  { code: "1201", name: "Advances & Deposits",     group: "Assets",      normalBal: "DR" },
  { code: "2001", name: "Trade Payables",          group: "Liabilities", normalBal: "CR" },
  { code: "2101", name: "GST Payable",             group: "Liabilities", normalBal: "CR" },
  { code: "3001", name: "Capital Account",         group: "Equity",      normalBal: "CR" },
  { code: "3002", name: "Drawings",                group: "Equity",      normalBal: "DR" },
  { code: "4101", name: "Sales Revenue",           group: "Income",      normalBal: "CR" },
  { code: "4102", name: "Other Income",            group: "Income",      normalBal: "CR" },
  { code: "5101", name: "Salary & Wages",          group: "Expenses",    normalBal: "DR" },
  { code: "5102", name: "Rent Expense",            group: "Expenses",    normalBal: "DR" },
  { code: "5103", name: "Office Expenses",         group: "Expenses",    normalBal: "DR" },
  { code: "5104", name: "Travel & Conveyance",     group: "Expenses",    normalBal: "DR" },
  { code: "5105", name: "Professional Fees",       group: "Expenses",    normalBal: "DR" },
  { code: "5106", name: "Bank Charges",            group: "Expenses",    normalBal: "DR" },
  { code: "5107", name: "Depreciation",            group: "Expenses",    normalBal: "DR" },
  { code: "4999", name: "Miscellaneous Expenses",  group: "Expenses",    normalBal: "DR" },
];

export async function seedIfNeeded() {
  try {
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length === 0) {
      const hash = await bcrypt.hash("admin123", 12);
      await db.insert(users).values({
        id: randomUUID(),
        email: "admin@31stfile.com",
        name: "Admin",
        passwordHash: hash,
        role: "admin",
      }).onConflictDoNothing();
      console.log("Seeded default admin user: admin@31stfile.com / admin123");
    }

    const existingAccounts = await db.select().from(accounts).limit(1);
    if (existingAccounts.length === 0) {
      await db.insert(accounts).values(
        DEFAULT_ACCOUNTS.map(a => ({
          id: randomUUID(),
          code: a.code,
          name: a.name,
          group: a.group,
          subGroup: null,
          normalBal: a.normalBal,
          isSystem: true,
        }))
      ).onConflictDoNothing();
      console.log("Seeded default chart of accounts");
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
