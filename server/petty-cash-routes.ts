import type { Express } from "express";
import { db } from "./db";
import { pettyCash } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createPettyCashSchema = z.object({
  userId: z.number().int(),
  siteId: z.number().int().optional(),
  amount: z.string(), // Decimal as string
  purpose: z.string().min(1),
  receiptUri: z.string().optional().nullable(),
  gpsLat: z.string(), // Required for GPS validation
  gpsLon: z.string(), // Required for GPS validation
  address: z.string().min(1),
});

const validateGPSSchema = z.object({
  gpsLat: z.string(),
  gpsLon: z.string(),
  siteId: z.number().int().optional(),
});

export function registerPettyCashRoutes(app: Express) {
  // Get all petty cash entries (optionally filtered by user or site)
  app.get("/api/petty-cash", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      const status = req.query.status as string | undefined;
      
      let query = db.select().from(pettyCash);
      
      const conditions = [];
      if (userId) {
        conditions.push(eq(pettyCash.userId, userId));
      }
      if (siteId) {
        conditions.push(eq(pettyCash.siteId, siteId));
      }
      if (status) {
        conditions.push(eq(pettyCash.status, status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const list = await query.orderBy(desc(pettyCash.timestamp));
      res.json(list);
    } catch (error) {
      console.error("Error fetching petty cash:", error);
      res.status(500).json({ error: "Failed to fetch petty cash entries" });
    }
  });

  // Get petty cash entry by ID
  app.get("/api/petty-cash/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [entry] = await db.select().from(pettyCash).where(eq(pettyCash.id, id));
      
      if (!entry) {
        return res.status(404).json({ error: "Petty cash entry not found" });
      }
      
      res.json(entry);
    } catch (error) {
      console.error("Error fetching petty cash entry:", error);
      res.status(500).json({ error: "Failed to fetch petty cash entry" });
    }
  });

  // Create new petty cash entry with GPS validation
  app.post("/api/petty-cash", async (req, res) => {
    try {
      const input = createPettyCashSchema.parse(req.body);
      
      // Validate GPS coordinates are provided (required for fraud prevention)
      if (!input.gpsLat || !input.gpsLon) {
        return res.status(400).json({ 
          error: "GPS coordinates are required for expense validation" 
        });
      }
      
      // In production, you could validate GPS is within site boundaries
      // For now, we just ensure GPS is provided
      
      const [entry] = await db
        .insert(pettyCash)
        .values({
          ...input,
          status: "pending",
        })
        .returning();
      
      res.status(201).json({
        ...entry,
        message: "Expense submitted with GPS validation",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating petty cash entry:", error);
      res.status(500).json({ error: "Failed to create petty cash entry" });
    }
  });

  // Validate GPS coordinates (check if within site boundaries)
  app.post("/api/petty-cash/validate-gps", async (req, res) => {
    try {
      const { gpsLat, gpsLon, siteId } = validateGPSSchema.parse(req.body);
      
      // In production, fetch site boundaries and check if GPS is within radius
      // For now, return validation success
      const lat = parseFloat(gpsLat);
      const lon = parseFloat(gpsLon);
      
      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Invalid GPS coordinates" });
      }
      
      // Basic validation: coordinates should be valid
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return res.status(400).json({ error: "GPS coordinates out of range" });
      }
      
      res.json({
        valid: true,
        message: "GPS coordinates validated",
        // In production, include distance from site center if siteId provided
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error validating GPS:", error);
      res.status(500).json({ error: "Failed to validate GPS" });
    }
  });

  // Approve petty cash entry
  app.post("/api/petty-cash/:id/approve", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { approvedBy } = z.object({
        approvedBy: z.number().int(),
      }).parse(req.body);
      
      const [entry] = await db.select().from(pettyCash).where(eq(pettyCash.id, id));
      
      if (!entry) {
        return res.status(404).json({ error: "Petty cash entry not found" });
      }
      
      if (entry.status !== "pending") {
        return res.status(400).json({ error: "Entry is not in pending status" });
      }
      
      const [updated] = await db
        .update(pettyCash)
        .set({
          status: "approved",
          approvedBy,
          approvedAt: new Date(),
        })
        .where(eq(pettyCash.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error approving petty cash:", error);
      res.status(500).json({ error: "Failed to approve petty cash entry" });
    }
  });

  // Reject petty cash entry
  app.post("/api/petty-cash/:id/reject", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { rejectionReason, rejectedBy } = z.object({
        rejectionReason: z.string().min(1),
        rejectedBy: z.number().int().optional(),
      }).parse(req.body);
      
      const [entry] = await db.select().from(pettyCash).where(eq(pettyCash.id, id));
      
      if (!entry) {
        return res.status(404).json({ error: "Petty cash entry not found" });
      }
      
      const [updated] = await db
        .update(pettyCash)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason,
        })
        .where(eq(pettyCash.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error rejecting petty cash:", error);
      res.status(500).json({ error: "Failed to reject petty cash entry" });
    }
  });
}
