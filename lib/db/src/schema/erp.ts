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
  vendorId: text("vendor_id").references(() => vendors.id),
  invoiceNo: text("invoice_no"),
  invoiceDate: text("invoice_date"),
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
  pendingApproval: boolean("pending_approval").default(true),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

export const upiRules = pgTable("upi_rules", {
  id: text("id").primaryKey(),
  keyword: text("keyword").notNull(),
  accountId: text("account_id").references(() => accounts.id),
  accountCode: text("account_code"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  displayName: text("display_name"),
  gstNo: text("gst_no"),
  pan: text("pan"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  category: text("category"),
  tdsApplicable: boolean("tds_applicable").default(false),
  tdsSectionCode: text("tds_section_code"), // Will be a foreign key to tdsSections
  defaultHsnCode: text("default_hsn_code"), // Will be a foreign key to hsnCodes
  defaultAccountId: text("default_account_id").references(() => accounts.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hsnCodes = pgTable("hsn_codes", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).default("0"),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).default("0"),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).default("0"),
  type: text("type").default("HSN"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tdsSections = pgTable("tds_sections", {
  code: text("code").primaryKey(),
  description: text("description").notNull(),
  individualRate: numeric("individual_rate", { precision: 5, scale: 2 }).notNull(),
  companyRate: numeric("company_rate", { precision: 5, scale: 2 }).notNull(),
  thresholdSingle: numeric("threshold_single", { precision: 18, scale: 2 }),
  thresholdAggregate: numeric("threshold_aggregate", { precision: 18, scale: 2 }),
  surchargeApplicable: boolean("surcharge_applicable").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gstLines = pgTable("gst_lines", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  entryLineId: text("entry_line_id").references(() => entryLines.id, { onDelete: "cascade" }),
  hsnCode: text("hsn_code").references(() => hsnCodes.code),
  description: text("description"),
  taxableAmount: numeric("taxable_amount", { precision: 18, scale: 2 }).notNull(),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).default("0"),
  cgstAmount: numeric("cgst_amount", { precision: 18, scale: 2 }).default("0"),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).default("0"),
  sgstAmount: numeric("sgst_amount", { precision: 18, scale: 2 }).default("0"),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).default("0"),
  igstAmount: numeric("igst_amount", { precision: 18, scale: 2 }).default("0"),
  totalGst: numeric("total_gst", { precision: 18, scale: 2 }).default("0"),
  isInterstate: boolean("is_interstate").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tdsDeductions = pgTable("tds_deductions", {
  id: text("id").primaryKey(),
  entryId: text("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  vendorId: text("vendor_id").references(() => vendors.id),
  sectionCode: text("section_code").references(() => tdsSections.code),
  panNo: text("pan_no"),
  tdsRate: numeric("tds_rate", { precision: 5, scale: 2 }).notNull(),
  baseAmount: numeric("base_amount", { precision: 18, scale: 2 }).notNull(),
  tdsAmount: numeric("tds_amount", { precision: 18, scale: 2 }).notNull(),
  tdsCertNo: text("tds_cert_no"),
  financialYear: text("financial_year"),
  createdAt: timestamp("created_at").defaultNow(),
});
