import type { Express } from "express";
import { db } from "./db";
import { contractors } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const contractorInputSchema = z.object({
  name: z.string().min(1),
  companyName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  siteId: z.number().optional(),
});

const updateRatingSchema = z.object({
  deadlinesMet: z.number().int().min(0).optional(),
  totalProjects: z.number().int().min(0).optional(),
  defectCount: z.number().int().min(0).optional(),
});

export function registerContractorRoutes(app: Express) {
  // Get all contractors (optionally filtered by site)
  app.get("/api/contractors", async (req, res) => {
    try {
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(contractors);
      if (siteId) {
        query = query.where(eq(contractors.siteId, siteId)) as any;
      }
      
      const list = await query.orderBy(desc(contractors.rating));
      
      // Calculate rating and payment advice dynamically
      const contractorsWithRating = list.map((c) => {
        // Calculate rating (1-10) based on performance
        const deadlineScore = c.totalProjects > 0 
          ? (c.deadlinesMet / c.totalProjects) * 5 
          : 5;
        const defectScore = Math.max(0, 5 - (c.defectCount * 0.5));
        const calculatedRating = Math.min(10, Math.max(1, deadlineScore + defectScore));
        
        // Determine payment advice
        let paymentAdvice: "release" | "hold" | "partial" = "partial";
        if (calculatedRating >= 8 && c.defectCount === 0) {
          paymentAdvice = "release";
        } else if (calculatedRating < 5 || c.defectCount > 3) {
          paymentAdvice = "hold";
        }
        
        return {
          ...c,
          rating: Number(calculatedRating.toFixed(1)),
          paymentAdvice,
        };
      });
      
      res.json(contractorsWithRating);
    } catch (error) {
      console.error("Error fetching contractors:", error);
      res.status(500).json({ error: "Failed to fetch contractors" });
    }
  });

  // Get contractor by ID
  app.get("/api/contractors/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
      
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      // Calculate rating dynamically
      const deadlineScore = contractor.totalProjects > 0 
        ? (contractor.deadlinesMet / contractor.totalProjects) * 5 
        : 5;
      const defectScore = Math.max(0, 5 - (contractor.defectCount * 0.5));
      const calculatedRating = Math.min(10, Math.max(1, deadlineScore + defectScore));
      
      let paymentAdvice: "release" | "hold" | "partial" = "partial";
      if (calculatedRating >= 8 && contractor.defectCount === 0) {
        paymentAdvice = "release";
      } else if (calculatedRating < 5 || contractor.defectCount > 3) {
        paymentAdvice = "hold";
      }
      
      res.json({
        ...contractor,
        rating: Number(calculatedRating.toFixed(1)),
        paymentAdvice,
      });
    } catch (error) {
      console.error("Error fetching contractor:", error);
      res.status(500).json({ error: "Failed to fetch contractor" });
    }
  });

  // Create new contractor
  app.post("/api/contractors", async (req, res) => {
    try {
      const input = contractorInputSchema.parse(req.body);
      const [contractor] = await db
        .insert(contractors)
        .values({
          ...input,
          rating: "5.0",
          deadlinesMet: 0,
          totalProjects: 0,
          defectCount: 0,
          paymentAdvice: "partial",
        })
        .returning();
      
      res.status(201).json(contractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating contractor:", error);
      res.status(500).json({ error: "Failed to create contractor" });
    }
  });

  // Update contractor rating/metrics
  app.patch("/api/contractors/:id/rating", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = updateRatingSchema.parse(req.body);
      
      const [contractor] = await db
        .update(contractors)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(contractors.id, id))
        .returning();
      
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      res.json(contractor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating contractor rating:", error);
      res.status(500).json({ error: "Failed to update contractor rating" });
    }
  });

  // Record project completion (updates deadlines met)
  app.post("/api/contractors/:id/project-complete", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { onTime } = z.object({ onTime: z.boolean() }).parse(req.body);
      
      const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      const [updated] = await db
        .update(contractors)
        .set({
          totalProjects: contractor.totalProjects + 1,
          deadlinesMet: onTime ? contractor.deadlinesMet + 1 : contractor.deadlinesMet,
          updatedAt: new Date(),
        })
        .where(eq(contractors.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error recording project completion:", error);
      res.status(500).json({ error: "Failed to record project completion" });
    }
  });

  // Record defect
  app.post("/api/contractors/:id/defect", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [contractor] = await db.select().from(contractors).where(eq(contractors.id, id));
      if (!contractor) {
        return res.status(404).json({ error: "Contractor not found" });
      }
      
      const [updated] = await db
        .update(contractors)
        .set({
          defectCount: contractor.defectCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(contractors.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error recording defect:", error);
      res.status(500).json({ error: "Failed to record defect" });
    }
  });
}
