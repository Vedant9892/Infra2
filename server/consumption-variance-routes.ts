import type { Express } from "express";
import { db } from "./db";
import { consumptionVariance } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const createVarianceSchema = z.object({
  siteId: z.number().int(),
  materialName: z.string().min(1),
  theoreticalQty: z.string(), // Decimal as string
  actualQty: z.string(), // Decimal as string
  unit: z.string().min(1),
  alertThreshold: z.string().optional(), // Default 10%
});

const updateActualQtySchema = z.object({
  actualQty: z.string(),
});

export function registerConsumptionVarianceRoutes(app: Express) {
  // Get all consumption variances (optionally filtered by site)
  app.get("/api/consumption-variance", async (req, res) => {
    try {
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(consumptionVariance);
      if (siteId) {
        query = query.where(eq(consumptionVariance.siteId, siteId)) as any;
      }
      
      const list = await query.orderBy(desc(consumptionVariance.updatedAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching consumption variance:", error);
      res.status(500).json({ error: "Failed to fetch consumption variance" });
    }
  });

  // Get variance by ID
  app.get("/api/consumption-variance/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [variance] = await db
        .select()
        .from(consumptionVariance)
        .where(eq(consumptionVariance.id, id));
      
      if (!variance) {
        return res.status(404).json({ error: "Consumption variance not found" });
      }
      
      res.json(variance);
    } catch (error) {
      console.error("Error fetching consumption variance:", error);
      res.status(500).json({ error: "Failed to fetch consumption variance" });
    }
  });

  // Create or update consumption variance
  app.post("/api/consumption-variance", async (req, res) => {
    try {
      const input = createVarianceSchema.parse(req.body);
      
      const theoreticalQty = parseFloat(input.theoreticalQty);
      const actualQty = parseFloat(input.actualQty);
      const threshold = input.alertThreshold ? parseFloat(input.alertThreshold) : 10.0;
      
      // Calculate variance
      const variance = actualQty - theoreticalQty;
      const variancePercent = theoreticalQty > 0 
        ? (variance / theoreticalQty) * 100 
        : 0;
      
      // Determine status based on variance percentage
      let status: "ok" | "warning" | "alert" = "ok";
      if (Math.abs(variancePercent) > threshold * 1.5) {
        status = "alert";
      } else if (Math.abs(variancePercent) > threshold) {
        status = "warning";
      }
      
      // Check if variance already exists for this material and site
      const existing = await db
        .select()
        .from(consumptionVariance)
        .where(
          and(
            eq(consumptionVariance.siteId, input.siteId),
            eq(consumptionVariance.materialName, input.materialName)
          )
        );
      
      if (existing.length > 0) {
        // Update existing
        const [updated] = await db
          .update(consumptionVariance)
          .set({
            theoreticalQty: input.theoreticalQty,
            actualQty: input.actualQty,
            variance: variance.toString(),
            variancePercent: variancePercent.toString(),
            status,
            updatedAt: new Date(),
          })
          .where(eq(consumptionVariance.id, existing[0].id))
          .returning();
        
        res.json(updated);
      } else {
        // Create new
        const [created] = await db
          .insert(consumptionVariance)
          .values({
            ...input,
            variance: variance.toString(),
            variancePercent: variancePercent.toString(),
            status,
            alertThreshold: threshold.toString(),
          })
          .returning();
        
        res.status(201).json(created);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating consumption variance:", error);
      res.status(500).json({ error: "Failed to create consumption variance" });
    }
  });

  // Update actual quantity (triggers recalculation)
  app.patch("/api/consumption-variance/:id/actual", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = updateActualQtySchema.parse(req.body);
      
      const [variance] = await db
        .select()
        .from(consumptionVariance)
        .where(eq(consumptionVariance.id, id));
      
      if (!variance) {
        return res.status(404).json({ error: "Consumption variance not found" });
      }
      
      const actualQty = parseFloat(input.actualQty);
      const theoreticalQty = parseFloat(variance.theoreticalQty);
      const threshold = variance.alertThreshold 
        ? parseFloat(variance.alertThreshold) 
        : 10.0;
      
      // Recalculate variance
      const newVariance = actualQty - theoreticalQty;
      const variancePercent = theoreticalQty > 0 
        ? (newVariance / theoreticalQty) * 100 
        : 0;
      
      // Determine status
      let status: "ok" | "warning" | "alert" = "ok";
      if (Math.abs(variancePercent) > threshold * 1.5) {
        status = "alert";
      } else if (Math.abs(variancePercent) > threshold) {
        status = "warning";
      }
      
      const [updated] = await db
        .update(consumptionVariance)
        .set({
          actualQty: input.actualQty,
          variance: newVariance.toString(),
          variancePercent: variancePercent.toString(),
          status,
          updatedAt: new Date(),
        })
        .where(eq(consumptionVariance.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating consumption variance:", error);
      res.status(500).json({ error: "Failed to update consumption variance" });
    }
  });
}
