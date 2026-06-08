import { pgTable,uuid,varchar,numeric,boolean,date,timestamp,text,char,integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const now = () => timestamp("created_at").defaultNow();

export const accounts = pgTable("accounts",{
  id:id(), code:varchar("code",{length:10}).unique().notNull(),
  name:varchar("name",{length:255}).notNull(),
  group:varchar("group",{length:50}).notNull(),
  subGroup:varchar("sub_group",{length:80}),
  normalBal:char("normal_balance",{length:2}).default("DR"),
  openingBal:numeric("opening_balance",{precision:18,scale:2}).default("0"),
  openingBalDrCr:char("opening_dr_cr",{length:2}).default("DR"),
  isActive:boolean("is_active").default(true), createdAt:now(),
});

export const entries = pgTable("entries",{
  id:id(), entryDate:date("entry_date").notNull(),
  voucherType:varchar("voucher_type",{length:20}).notNull(),
  voucherNo:varchar("voucher_no",{length:30}).unique().notNull(),
  narration:text("narration").notNull(),
  reference:varchar("reference",{length:100}),
  fiscalYear:varchar("fiscal_year",{length:9}).default("2025-26"),
  sourceType:varchar("source_type",{length:20}).default("MANUAL"),
  utrNumber:varchar("utr_number",{length:30}),
  upiId:varchar("upi_id",{length:100}),
  status:varchar("status",{length:20}).default("POSTED"),
  createdAt:now(),
});

export const entryLines = pgTable("entry_lines",{
  id:id(),
  entryId:uuid("entry_id").references(()=>entries.id).notNull(),
  accountId:uuid("account_id").references(()=>accounts.id).notNull(),
  side:char("side",{length:2}).notNull(),
  amount:numeric("amount",{precision:18,scale:2}).notNull(),
  lineNote:text("line_note"),
});

export const documents = pgTable("documents",{
  id:id(),
  entryId:uuid("entry_id").references(()=>entries.id),
  filename:varchar("filename",{length:255}).notNull(),
  fileUrl:text("file_url").notNull(),
  fileSize:integer("file_size"),
  fileType:varchar("file_type",{length:50}),
  uploadedAt:timestamp("uploaded_at").defaultNow(),
});

export const upiStaging = pgTable("upi_staging",{
  id:id(), utr:varchar("utr",{length:30}),
  merchant:varchar("merchant",{length:255}),
  upiId:varchar("upi_id",{length:100}),
  amount:numeric("amount",{precision:18,scale:2}),
  txnDate:date("txn_date"), txnType:varchar("txn_type",{length:10}).default("DEBIT"),
  source:varchar("source",{length:10}).default("CSV"),
  drAccountId:uuid("dr_account_id").references(()=>accounts.id),
  crAccountId:uuid("cr_account_id").references(()=>accounts.id),
  notes:text("notes"), status:varchar("status",{length:20}).default("PENDING"),
  postedId:uuid("posted_entry_id").references(()=>entries.id),
  createdAt:now(),
});

export const upiRules = pgTable("upi_rules",{
  id:id(), keyword:varchar("keyword",{length:100}).notNull(),
  accountId:uuid("account_id").references(()=>accounts.id),
  isActive:boolean("is_active").default(true),
});

export const users = pgTable("users",{
  id:id(),
  email:varchar("email",{length:255}).unique().notNull(),
  passwordHash:varchar("password_hash",{length:255}).notNull(),
  name:varchar("name",{length:100}).notNull(),
  company:varchar("company",{length:100}),
  role:varchar("role",{length:20}).default("admin"),
  isActive:boolean("is_active").default(true),
  createdAt:now(),
  lastLoginAt:timestamp("last_login_at"),
});
