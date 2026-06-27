import { Router } from "express";
import { db } from "@workspace/db";
import { vendors, entries } from "@workspace/db";
import { eq, ilike, desc, sql, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { requireAuth, requireRole } from "./auth";

const router = Router();

router.use("/vendors", requireAuth, requireRole(["admin", "accountant"]));

router.get("/vendors", async (req, res) => {
  try {
    const { q, limit = "50", offset = "0" } = req.query;
    
    let query = db.select().from(vendors);
    if (q) {
      query = query.where(ilike(vendors.name, `%${q}%`)) as any;
    }
    
    const allVendors = await query
      .orderBy(desc(vendors.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));
      
    res.json(allVendors);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

router.get("/vendors/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    const matches = await db.select({
      id: vendors.id,
      name: vendors.name,
      gstNo: vendors.gstNo,
      pan: vendors.pan,
      tdsApplicable: vendors.tdsApplicable,
    })
    .from(vendors)
    .where(ilike(vendors.name, `%${q}%`))
    .limit(10);
    
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: "Failed to search vendors" });
  }
});

router.get("/vendors/:id", async (req, res) => {
  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, req.params.id));
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendor" });
  }
});

router.post("/vendors", async (req: any, res) => {
  try {
    const { name, displayName, gstNo, pan, email, phone, address, category, tdsApplicable, tdsSectionCode, defaultHsnCode, defaultAccountId } = req.body;
    
    if (!name) return res.status(400).json({ error: "Name is required" });
    
    const [newVendor] = await db.insert(vendors).values({
      id: randomUUID(),
      name,
      displayName,
      gstNo,
      pan,
      email,
      phone,
      address,
      category,
      tdsApplicable,
      tdsSectionCode,
      defaultHsnCode,
      defaultAccountId,
    }).returning();
    
    res.status(201).json(newVendor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create vendor" });
  }
});

router.put("/vendors/:id", async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

    const [updated] = await db.update(vendors)
      .set(updates)
      .where(eq(vendors.id, req.params.id))
      .returning();
      
    if (!updated) return res.status(404).json({ error: "Vendor not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

router.delete("/vendors/:id", async (req, res) => {
  try {
    const [deleted] = await db.update(vendors)
      .set({ isActive: false })
      .where(eq(vendors.id, req.params.id))
      .returning({ id: vendors.id });
      
    if (!deleted) return res.status(404).json({ error: "Vendor not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete vendor" });
  }
});

router.get("/vendors/:id/recommendations", async (req, res) => {
  // Try to find the most common accountId used for this vendor in past entries
  try {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, req.params.id));
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    
    // We would look at past entryLines for entries matching this vendorId, 
    // excluding bank/cash accounts (1001, 1002).
    // For now, return the defaults if set.
    res.json({
      accountId: vendor.defaultAccountId || null,
      hsnCode: vendor.defaultHsnCode || null,
      tdsSectionCode: vendor.tdsSectionCode || null,
      tdsApplicable: vendor.tdsApplicable,
      confidence: vendor.defaultAccountId ? 100 : 0
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

export default router;
