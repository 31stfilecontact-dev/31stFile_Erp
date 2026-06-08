import { db } from "./index";
import { accounts } from "./schema";
const ACCS = [
  {code:"1001",name:"Cash in Hand",          group:"Assets",      subGroup:"Current Assets",      normalBal:"DR"},
  {code:"1002",name:"Bank — Current Account",group:"Assets",      subGroup:"Current Assets",      normalBal:"DR"},
  {code:"1003",name:"Bank — Savings Account",group:"Assets",      subGroup:"Current Assets",      normalBal:"DR"},
  {code:"1004",name:"Trade Receivables",     group:"Assets",      subGroup:"Current Assets",      normalBal:"DR"},
  {code:"1005",name:"Advances & Deposits",   group:"Assets",      subGroup:"Current Assets",      normalBal:"DR"},
  {code:"1101",name:"Fixed Assets — Gross",  group:"Assets",      subGroup:"Non-Current Assets",  normalBal:"DR"},
  {code:"1102",name:"Accumulated Depreciation",group:"Assets",    subGroup:"Non-Current Assets",  normalBal:"CR"},
  {code:"2001",name:"Trade Payables",        group:"Liabilities", subGroup:"Current Liabilities", normalBal:"CR"},
  {code:"2002",name:"TDS Payable",           group:"Liabilities", subGroup:"Current Liabilities", normalBal:"CR"},
  {code:"2003",name:"GST Payable",           group:"Liabilities", subGroup:"Current Liabilities", normalBal:"CR"},
  {code:"2004",name:"Salary Payable",        group:"Liabilities", subGroup:"Current Liabilities", normalBal:"CR"},
  {code:"2101",name:"Capital Account",       group:"Liabilities", subGroup:"Equity",              normalBal:"CR"},
  {code:"2102",name:"Drawings",              group:"Liabilities", subGroup:"Equity",              normalBal:"DR"},
  {code:"2103",name:"Secured Loans",         group:"Liabilities", subGroup:"Non-Current",         normalBal:"CR"},
  {code:"3001",name:"Sales Revenue",         group:"Income",      subGroup:"Operating",           normalBal:"CR"},
  {code:"3002",name:"Service Income",        group:"Income",      subGroup:"Operating",           normalBal:"CR"},
  {code:"3003",name:"Interest Income",       group:"Income",      subGroup:"Other Income",        normalBal:"CR"},
  {code:"3004",name:"Other Income",          group:"Income",      subGroup:"Other Income",        normalBal:"CR"},
  {code:"4101",name:"Salary & Wages",        group:"Expenses",    subGroup:"Employee Costs",      normalBal:"DR"},
  {code:"4102",name:"PF Contribution",       group:"Expenses",    subGroup:"Employee Costs",      normalBal:"DR"},
  {code:"4201",name:"Rent Expense",          group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4202",name:"Power & Fuel",          group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4203",name:"Professional Fees",     group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4204",name:"Repairs & Maintenance", group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4205",name:"Travel & Conveyance",   group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4206",name:"Office Expenses",       group:"Expenses",    subGroup:"Operating",           normalBal:"DR"},
  {code:"4207",name:"Bank Charges",          group:"Expenses",    subGroup:"Finance",             normalBal:"DR"},
  {code:"4208",name:"Interest Expense",      group:"Expenses",    subGroup:"Finance",             normalBal:"DR"},
  {code:"4301",name:"Depreciation",          group:"Expenses",    subGroup:"Depreciation",        normalBal:"DR"},
  {code:"4401",name:"Purchases",             group:"Expenses",    subGroup:"COGS",                normalBal:"DR"},
];
async function seed(){
  await db.insert(accounts).values(ACCS).onConflictDoNothing();
  console.log(`✅ Seeded ${ACCS.length} accounts`);
  process.exit(0);
}
seed().catch(e=>{console.error(e);process.exit(1);});
