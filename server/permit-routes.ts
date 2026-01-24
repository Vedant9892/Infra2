import type { Express } from "express";
import { db } from "./db";
import { workPermits } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

const requestPermitSchema = z.object({
  taskName: z.string().min(1),
  workerId: z.number().int(),
  workerName: z.string().optional(),
  siteId: z.number().int(),
});

const verifyOTPSchema = z.object({
  otp: z.string().length(4),
});

export function registerPermitRoutes(app: Express) {
  // Get all permits (optionally filtered by status or site)
  app.get("/api/permits", async (req, res) => {
    try {
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      const status = req.query.status as string | undefined;
      
      let query = db.select().from(workPermits);
      
      if (siteId && status) {
        query = query.where(
          and(eq(workPermits.siteId, siteId), eq(workPermits.status, status))
        ) as any;
      } else if (siteId) {
        query = query.where(eq(workPermits.siteId, siteId)) as any;
      } else if (status) {
        query = query.where(eq(workPermits.status, status)) as any;
      }
      
      const list = await query.orderBy(desc(workPermits.requestedAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching permits:", error);
      res.status(500).json({ error: "Failed to fetch permits" });
    }
  });

  // Get permit by ID
  app.get("/api/permits/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [permit] = await db.select().from(workPermits).where(eq(workPermits.id, id));
      
      if (!permit) {
        return res.status(404).json({ error: "Permit not found" });
      }
      
      res.json(permit);
    } catch (error) {
      console.error("Error fetching permit:", error);
      res.status(500).json({ error: "Failed to fetch permit" });
    }
  });

  // Request permit (generates OTP)
  app.post("/api/permits/request", async (req, res) => {
    try {
      const input = requestPermitSchema.parse(req.body);
      
      // Generate 4-digit OTP
      const otp = String(1000 + Math.floor(Math.random() * 9000));
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
      
      const [permit] = await db
        .insert(workPermits)
        .values({
          ...input,
          status: "otp_sent",
          otp,
          otpExpiresAt,
        })
        .returning();
      
      // In production, send OTP via SMS/WhatsApp to Safety Officer
      // For now, return it in response (should be removed in production)
      res.status(201).json({
        ...permit,
        otp, // Remove this in production - OTP should only be sent to Safety Officer
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error requesting permit:", error);
      res.status(500).json({ error: "Failed to request permit" });
    }
  });

  // Verify OTP (Safety Officer endpoint)
  app.post("/api/permits/:id/verify", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { otp, verifiedBy } = z.object({
        otp: z.string().length(4),
        verifiedBy: z.number().int(),
      }).parse(req.body);
      
      const [permit] = await db.select().from(workPermits).where(eq(workPermits.id, id));
      
      if (!permit) {
        return res.status(404).json({ error: "Permit not found" });
      }
      
      if (permit.status !== "otp_sent") {
        return res.status(400).json({ error: "Permit is not in OTP verification state" });
      }
      
      // Check if OTP is expired
      if (permit.otpExpiresAt && new Date(permit.otpExpiresAt) < new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
      }
      
      // Verify OTP
      if (permit.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }
      
      // Update permit status
      const [updated] = await db
        .update(workPermits)
        .set({
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy,
        })
        .where(eq(workPermits.id, id))
        .returning();
      
      res.json({
        success: true,
        permit: updated,
        message: "Safety clearance granted. Work can proceed.",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" });
    }
  });

  // Reject permit
  app.post("/api/permits/:id/reject", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { rejectionReason, rejectedBy } = z.object({
        rejectionReason: z.string().min(1),
        rejectedBy: z.number().int().optional(),
      }).parse(req.body);
      
      const [permit] = await db.select().from(workPermits).where(eq(workPermits.id, id));
      
      if (!permit) {
        return res.status(404).json({ error: "Permit not found" });
      }
      
      const [updated] = await db
        .update(workPermits)
        .set({
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason,
        })
        .where(eq(workPermits.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error rejecting permit:", error);
      res.status(500).json({ error: "Failed to reject permit" });
    }
  });
}
