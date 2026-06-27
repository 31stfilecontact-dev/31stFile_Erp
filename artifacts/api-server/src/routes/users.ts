import { Router } from "express";
import { db } from "@workspace/db";
import { users } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { requireAuth, requireRole } from "./auth";

const router = Router();

// Protect all /users routes so only admins can access them
router.use("/users", requireAuth, requireRole(["admin"]));

router.get("/users", async (_req, res) => {
  try {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users);
    res.json(allUsers);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) {
      return res.status(400).json({ error: "Email, name and password are required" });
    }
    
    const existing = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    
    const [newUser] = await db.insert(users).values({
      id: randomUUID(),
      email: email.toLowerCase(),
      name,
      passwordHash,
      role: role || "user"
    }).returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    });
    
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const { role, name } = req.body;
    const updates: any = {};
    if (role) updates.role = role;
    if (name) updates.name = name;
    
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: "Nothing to update" });

    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, req.params.id))
      .returning({ id: users.id, name: users.name, role: users.role });
      
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.put("/users/:id/password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    
    const [updated] = await db.update(users)
      .set({ passwordHash })
      .where(eq(users.id, req.params.id))
      .returning({ id: users.id });
      
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset password" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, req.params.id))
      .returning({ id: users.id });
      
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
