import {
  pgTable, text, numeric, timestamp, boolean, integer, pgEnum
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  group: text("group").notNull(),
  subGroup: text("sub_group"),
  normalBal: text("normal_bal").notNull().default("DR"),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const entries = pgTable("entries", {
  id: text("id").primaryKey(),
  entryDate: text("entry_date").notNull(),
  voucherNo: text("voucher_no").notNull(),
  voucherType: text("voucher_type").notNull().default("Journal"),
  narration: text("narration").notNull(),
  reference: text("reference"),
  status: text("status").notNull().default("posted"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const entryLines = pgTable("entry_lines", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id),
  side: text("side").notNull(),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  note: text("note"),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").references(() => entries.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  mimeType: text("mime_type"),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const upiStaging = pgTable("upi_staging", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  merchant: text("merchant").notNull(),
  upiId: text("upi_id"),
  utr: text("utr"),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
  type: text("type").notNull(),
  source: text("source").notNull().default("CSV"),
  matchStatus: text("match_status").notNull().default("UNMATCHED"),
  ledgerAccount: text("ledger_account"),
  entryId: text("entry_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const upiRules = pgTable("upi_rules", {
  id: text("id").primaryKey(),
  keyword: text("keyword").notNull(),
  accountId: text("account_id").references(() => accounts.id),
  accountCode: text("account_code"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
