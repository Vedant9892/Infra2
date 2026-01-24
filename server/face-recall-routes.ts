import type { Express } from "express";
import { db } from "./db";
import { dailyWagers, faceAttendance } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const wagerInputSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  role: z.string().optional(),
  siteId: z.number().optional(),
  dailyWage: z.string().optional(),
  photoUri: z.string().optional(),
  faceEncoding: z.string().optional(), // Base64 encoded face features
});

const recognitionInputSchema = z.object({
  photoUri: z.string(),
  faceEncoding: z.string().optional(),
  gpsLat: z.string().optional(),
  gpsLon: z.string().optional(),
  address: z.string().optional(),
  confidence: z.string().optional(),
});

export function registerFaceRecallRoutes(app: Express) {
  // Get all daily wagers (optionally filtered by site)
  app.get("/api/daily-wagers", async (req, res) => {
    try {
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(dailyWagers);
      if (siteId) {
        query = query.where(eq(dailyWagers.siteId, siteId)) as any;
      }
      
      const list = await query.orderBy(desc(dailyWagers.createdAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching daily wagers:", error);
      res.status(500).json({ error: "Failed to fetch daily wagers" });
    }
  });

  // Get wager by ID
  app.get("/api/daily-wagers/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [wager] = await db.select().from(dailyWagers).where(eq(dailyWagers.id, id));
      
      if (!wager) {
        return res.status(404).json({ error: "Daily wager not found" });
      }
      
      res.json(wager);
    } catch (error) {
      console.error("Error fetching daily wager:", error);
      res.status(500).json({ error: "Failed to fetch daily wager" });
    }
  });

  // Register new daily wager with face encoding
  app.post("/api/daily-wagers", async (req, res) => {
    try {
      const input = wagerInputSchema.parse(req.body);
      const [wager] = await db
        .insert(dailyWagers)
        .values(input)
        .returning();
      
      res.status(201).json(wager);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating daily wager:", error);
      res.status(500).json({ error: "Failed to create daily wager" });
    }
  });

  // Update wager face encoding
  app.patch("/api/daily-wagers/:id/face", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { faceEncoding, photoUri } = z.object({
        faceEncoding: z.string().optional(),
        photoUri: z.string().optional(),
      }).parse(req.body);
      
      const [wager] = await db
        .update(dailyWagers)
        .set({
          faceEncoding,
          photoUri,
          updatedAt: new Date(),
        })
        .where(eq(dailyWagers.id, id))
        .returning();
      
      if (!wager) {
        return res.status(404).json({ error: "Daily wager not found" });
      }
      
      res.json(wager);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error updating face encoding:", error);
      res.status(500).json({ error: "Failed to update face encoding" });
    }
  });

  // Recognize face and record attendance
  app.post("/api/face-recall/recognize", async (req, res) => {
    try {
      const input = recognitionInputSchema.parse(req.body);
      
      // In a real implementation, you would:
      // 1. Extract face features from the photo
      // 2. Compare with stored face encodings
      // 3. Find the best match (if confidence > threshold)
      // For now, we'll do a simple lookup by photoUri or return a mock match
      
      // Get all wagers to find a match (in production, use face recognition library)
      const wagers = await db.select().from(dailyWagers);
      
      // Mock: Find wager by checking if photoUri matches or use first wager
      // In production, use face recognition to find best match
      const matchedWager = wagers.find(w => w.photoUri === input.photoUri) || wagers[0];
      
      if (!matchedWager) {
        return res.status(404).json({ error: "No matching wager found" });
      }
      
      // Record face attendance
      const [attendance] = await db
        .insert(faceAttendance)
        .values({
          wagerId: matchedWager.id,
          siteId: matchedWager.siteId,
          photoUri: input.photoUri,
          confidence: input.confidence || "0.95",
          gpsLat: input.gpsLat,
          gpsLon: input.gpsLon,
          address: input.address,
        })
        .returning();
      
      // Update last wage date
      await db
        .update(dailyWagers)
        .set({ lastWageDate: new Date() })
        .where(eq(dailyWagers.id, matchedWager.id));
      
      res.json({
        success: true,
        wager: matchedWager,
        attendance,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error recognizing face:", error);
      res.status(500).json({ error: "Failed to recognize face" });
    }
  });

  // Get face attendance history
  app.get("/api/face-attendance", async (req, res) => {
    try {
      const wagerId = req.query.wagerId ? Number(req.query.wagerId) : undefined;
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(faceAttendance);
      if (wagerId) {
        query = query.where(eq(faceAttendance.wagerId, wagerId)) as any;
      }
      if (siteId) {
        query = query.where(eq(faceAttendance.siteId, siteId)) as any;
      }
      
      const list = await query.orderBy(desc(faceAttendance.recognizedAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching face attendance:", error);
      res.status(500).json({ error: "Failed to fetch face attendance" });
    }
  });
}
