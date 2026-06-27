import { Router } from "express";
import { db } from "@workspace/db";
import { hsnCodes, tdsSections } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireRole } from "./auth";

const router = Router();

router.use("/masters", requireAuth);

// --- HSN Codes ---

router.get("/masters/hsn", async (_req, res) => {
  try {
    const all = await db.select().from(hsnCodes);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch HSN codes" });
  }
});

router.get("/masters/hsn/:code", async (req, res) => {
  try {
    const [hsn] = await db.select().from(hsnCodes).where(eq(hsnCodes.code, req.params.code));
    if (!hsn) return res.status(404).json({ error: "HSN code not found" });
    res.json(hsn);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch HSN code" });
  }
});

router.post("/masters/hsn", requireRole(["admin"]), async (req, res) => {
  try {
    const { code, description, cgstRate, sgstRate, igstRate, type } = req.body;
    if (!code || !description) return res.status(400).json({ error: "Code and description required" });

    const [newHsn] = await db.insert(hsnCodes).values({
      code,
      description,
      cgstRate,
      sgstRate,
      igstRate,
      type
    }).returning();
    
    res.status(201).json(newHsn);
  } catch (err) {
    res.status(500).json({ error: "Failed to create HSN code" });
  }
});

router.put("/masters/hsn/:code", requireRole(["admin"]), async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

    const [updated] = await db.update(hsnCodes)
      .set(updates)
      .where(eq(hsnCodes.code, req.params.code as string))
      .returning();
      
    if (!updated) return res.status(404).json({ error: "HSN code not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update HSN code" });
  }
});

// --- TDS Sections ---

router.get("/masters/tds", async (_req, res) => {
  try {
    const all = await db.select().from(tdsSections);
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch TDS sections" });
  }
});

router.get("/masters/tds/:code", async (req, res) => {
  try {
    const [tds] = await db.select().from(tdsSections).where(eq(tdsSections.code, req.params.code));
    if (!tds) return res.status(404).json({ error: "TDS section not found" });
    res.json(tds);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch TDS section" });
  }
});

router.post("/masters/tds", requireRole(["admin"]), async (req, res) => {
  try {
    const { code, description, individualRate, companyRate, thresholdSingle, thresholdAggregate, surchargeApplicable } = req.body;
    if (!code || !description) return res.status(400).json({ error: "Code and description required" });

    const [newTds] = await db.insert(tdsSections).values({
      code,
      description,
      individualRate,
      companyRate,
      thresholdSingle,
      thresholdAggregate,
      surchargeApplicable
    }).returning();
    
    res.status(201).json(newTds);
  } catch (err) {
    res.status(500).json({ error: "Failed to create TDS section" });
  }
});

router.put("/masters/tds/:code", requireRole(["admin"]), async (req, res) => {
  try {
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

    const [updated] = await db.update(tdsSections)
      .set(updates)
      .where(eq(tdsSections.code, req.params.code as string))
      .returning();
      
    if (!updated) return res.status(404).json({ error: "TDS section not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update TDS section" });
  }
});

export default router;
