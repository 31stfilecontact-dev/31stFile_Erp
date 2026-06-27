import { db } from "@workspace/db";
import { hsnCodes, tdsSections } from "@workspace/db";
import { count } from "drizzle-orm";

const hsnSeedData = [
  { code: "9983", description: "Information Technology (IT) services", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "SAC" },
  { code: "9985", description: "Support services", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "SAC" },
  { code: "9954", description: "Construction services", cgstRate: "0.00", sgstRate: "0.00", igstRate: "12.00", type: "SAC" },
  { code: "9971", description: "Financial and related services", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "SAC" },
  { code: "9992", description: "Education services", cgstRate: "0.00", sgstRate: "0.00", igstRate: "0.00", type: "SAC" },
  { code: "8471", description: "Computers/laptops", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "HSN" },
  { code: "8443", description: "Printers/copiers", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "HSN" },
  { code: "6109", description: "T-shirts/clothing", cgstRate: "0.00", sgstRate: "0.00", igstRate: "12.00", type: "HSN" },
  { code: "0401", description: "Milk/dairy", cgstRate: "0.00", sgstRate: "0.00", igstRate: "0.00", type: "HSN" },
  { code: "2106", description: "Food preparations", cgstRate: "0.00", sgstRate: "0.00", igstRate: "5.00", type: "HSN" },
  { code: "4820", description: "Stationery/registers", cgstRate: "0.00", sgstRate: "0.00", igstRate: "12.00", type: "HSN" },
  { code: "7326", description: "Iron/steel articles", cgstRate: "0.00", sgstRate: "0.00", igstRate: "18.00", type: "HSN" },
  { code: "3304", description: "Cosmetics", cgstRate: "0.00", sgstRate: "0.00", igstRate: "28.00", type: "HSN" },
  { code: "2710", description: "Petrol/diesel", cgstRate: "0.00", sgstRate: "0.00", igstRate: "0.00", type: "HSN" },
  { code: "9021", description: "Medical equipment", cgstRate: "0.00", sgstRate: "0.00", igstRate: "5.00", type: "HSN" },
];

const tdsSeedData = [
  { code: "194C", description: "Payment to contractors", individualRate: "1.00", companyRate: "2.00", thresholdSingle: "30000.00", thresholdAggregate: "100000.00" },
  { code: "194J", description: "Professional/technical fees", individualRate: "10.00", companyRate: "10.00", thresholdSingle: "30000.00" },
  { code: "194I", description: "Rent", individualRate: "10.00", companyRate: "10.00", thresholdSingle: "240000.00" },
  { code: "194H", description: "Commission/brokerage", individualRate: "5.00", companyRate: "5.00", thresholdSingle: "15000.00" },
  { code: "194A", description: "Interest (other than securities)", individualRate: "10.00", companyRate: "10.00", thresholdSingle: "40000.00" },
  { code: "194B", description: "Lottery/prize winnings", individualRate: "30.00", companyRate: "30.00", thresholdSingle: "10000.00" },
  { code: "194D", description: "Insurance commission", individualRate: "5.00", companyRate: "5.00", thresholdSingle: "15000.00" },
  { code: "194G", description: "Commission on lottery tickets", individualRate: "5.00", companyRate: "5.00", thresholdSingle: "15000.00" },
  { code: "194LA", description: "Compensation for acquisition", individualRate: "10.00", companyRate: "10.00", thresholdSingle: "250000.00" },
  { code: "192", description: "Salary", individualRate: "0.00", companyRate: "0.00" },
  { code: "194Q", description: "Purchase of goods", individualRate: "0.10", companyRate: "0.10", thresholdAggregate: "5000000.00" },
  { code: "206C(1H)", description: "TCS on sale of goods", individualRate: "0.10", companyRate: "0.10" },
];

export async function seedIfEmpty() {
  try {
    const [{ count: hsnCount }] = await db.select({ count: count() }).from(hsnCodes);
    if (hsnCount === 0) {
      console.log("Seeding HSN codes...");
      await db.insert(hsnCodes).values(hsnSeedData);
    }

    const [{ count: tdsCount }] = await db.select({ count: count() }).from(tdsSections);
    if (tdsCount === 0) {
      console.log("Seeding TDS sections...");
      await db.insert(tdsSections).values(tdsSeedData);
    }
  } catch (error) {
    console.error("Failed to seed database:", error);
  }
}
