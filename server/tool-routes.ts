import type { Express } from "express";
import { db } from "./db";
import { tools, toolRequests } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";
import crypto from "crypto";

const createToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  siteId: z.number().int(),
  quantity: z.number().int().min(1).default(1),
});

const requestToolSchema = z.object({
  toolId: z.number().int(),
  userId: z.number().int(),
  siteId: z.number().int(),
  requestedDuration: z.string().optional(),
});

const scanQRSchema = z.object({
  qrCode: z.string().min(1),
  userId: z.number().int(),
  action: z.enum(["checkout", "return"]),
});

export function registerToolRoutes(app: Express) {
  // Get all tools (optionally filtered by site)
  app.get("/api/tools", async (req, res) => {
    try {
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(tools);
      if (siteId) {
        query = query.where(eq(tools.siteId, siteId)) as any;
      }
      
      const list = await query.orderBy(desc(tools.createdAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  // Get tool by ID
  app.get("/api/tools/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [tool] = await db.select().from(tools).where(eq(tools.id, id));
      
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ error: "Failed to fetch tool" });
    }
  });

  // Get tool by QR code
  app.get("/api/tools/qr/:qrCode", async (req, res) => {
    try {
      const qrCode = req.params.qrCode;
      const [tool] = await db.select().from(tools).where(eq(tools.qrCode, qrCode));
      
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool by QR:", error);
      res.status(500).json({ error: "Failed to fetch tool" });
    }
  });

  // Create new tool (generates QR code)
  app.post("/api/tools", async (req, res) => {
    try {
      const input = createToolSchema.parse(req.body);
      
      // Generate unique QR code
      const qrCode = `TOOL-${crypto.randomBytes(8).toString("hex").toUpperCase()}`;
      
      const [tool] = await db
        .insert(tools)
        .values({
          ...input,
          qrCode,
        })
        .returning();
      
      res.status(201).json(tool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error creating tool:", error);
      res.status(500).json({ error: "Failed to create tool" });
    }
  });

  // Request tool
  app.post("/api/tools/request", async (req, res) => {
    try {
      const input = requestToolSchema.parse(req.body);
      
      // Check if tool exists and is available
      const [tool] = await db.select().from(tools).where(eq(tools.id, input.toolId));
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      // Check available quantity
      const activeRequests = await db
        .select()
        .from(toolRequests)
        .where(
          and(
            eq(toolRequests.toolId, input.toolId),
            eq(toolRequests.status, "issued")
          )
        );
      
      const availableQty = tool.quantity - activeRequests.length;
      if (availableQty <= 0) {
        return res.status(400).json({ error: "Tool is not available" });
      }
      
      const [request] = await db
        .insert(toolRequests)
        .values({
          ...input,
          status: "pending",
          requestedDuration: input.requestedDuration || "1h",
        })
        .returning();
      
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error requesting tool:", error);
      res.status(500).json({ error: "Failed to request tool" });
    }
  });

  // Approve/Issue tool request
  app.post("/api/tools/requests/:id/approve", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { approvedBy } = z.object({
        approvedBy: z.number().int().optional(),
      }).parse(req.body);
      
      const [request] = await db
        .select()
        .from(toolRequests)
        .where(eq(toolRequests.id, id));
      
      if (!request) {
        return res.status(404).json({ error: "Tool request not found" });
      }
      
      if (request.status !== "pending") {
        return res.status(400).json({ error: "Request is not in pending status" });
      }
      
      const [updated] = await db
        .update(toolRequests)
        .set({
          status: "issued",
          issuedAt: new Date(),
        })
        .where(eq(toolRequests.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error approving tool request:", error);
      res.status(500).json({ error: "Failed to approve tool request" });
    }
  });

  // Scan QR code for checkout/return
  app.post("/api/tools/scan-qr", async (req, res) => {
    try {
      const { qrCode, userId, action } = scanQRSchema.parse(req.body);
      
      // Find tool by QR code
      const [tool] = await db.select().from(tools).where(eq(tools.qrCode, qrCode));
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      if (action === "checkout") {
        // Find pending request for this tool and user
        const [request] = await db
          .select()
          .from(toolRequests)
          .where(
            and(
              eq(toolRequests.toolId, tool.id),
              eq(toolRequests.userId, userId),
              eq(toolRequests.status, "pending")
            )
          )
          .orderBy(desc(toolRequests.requestedAt))
          .limit(1);
        
        if (!request) {
          return res.status(404).json({ error: "No pending request found for this tool" });
        }
        
        // Update request to issued and record QR scan
        const [updated] = await db
          .update(toolRequests)
          .set({
            status: "issued",
            issuedAt: new Date(),
            qrScannedAt: new Date(),
          })
          .where(eq(toolRequests.id, request.id))
          .returning();
        
        res.json({
          success: true,
          message: "Tool checked out successfully",
          request: updated,
          tool,
        });
      } else if (action === "return") {
        // Find issued request for this tool and user
        const [request] = await db
          .select()
          .from(toolRequests)
          .where(
            and(
              eq(toolRequests.toolId, tool.id),
              eq(toolRequests.userId, userId),
              eq(toolRequests.status, "issued")
            )
          )
          .orderBy(desc(toolRequests.issuedAt))
          .limit(1);
        
        if (!request) {
          return res.status(404).json({ error: "No issued tool found to return" });
        }
        
        // Update request to returned
        const [updated] = await db
          .update(toolRequests)
          .set({
            status: "returned",
            returnedAt: new Date(),
          })
          .where(eq(toolRequests.id, request.id))
          .returning();
        
        res.json({
          success: true,
          message: "Tool returned successfully",
          request: updated,
          tool,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      console.error("Error scanning QR code:", error);
      res.status(500).json({ error: "Failed to process QR scan" });
    }
  });

  // Return tool
  app.post("/api/tools/requests/:id/return", async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      const [request] = await db
        .select()
        .from(toolRequests)
        .where(eq(toolRequests.id, id));
      
      if (!request) {
        return res.status(404).json({ error: "Tool request not found" });
      }
      
      if (request.status !== "issued") {
        return res.status(400).json({ error: "Tool is not issued" });
      }
      
      const [updated] = await db
        .update(toolRequests)
        .set({
          status: "returned",
          returnedAt: new Date(),
        })
        .where(eq(toolRequests.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error("Error returning tool:", error);
      res.status(500).json({ error: "Failed to return tool" });
    }
  });

  // Get tool requests (optionally filtered by user or site)
  app.get("/api/tools/requests", async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const siteId = req.query.siteId ? Number(req.query.siteId) : undefined;
      
      let query = db.select().from(toolRequests);
      
      const conditions = [];
      if (userId) {
        conditions.push(eq(toolRequests.userId, userId));
      }
      if (siteId) {
        conditions.push(eq(toolRequests.siteId, siteId));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      const list = await query.orderBy(desc(toolRequests.requestedAt));
      res.json(list);
    } catch (error) {
      console.error("Error fetching tool requests:", error);
      res.status(500).json({ error: "Failed to fetch tool requests" });
    }
  });
}
