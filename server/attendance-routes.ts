import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { attendance, sites } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";

/**
 * POST /api/attendance/mark
 * Labour marks attendance with GPS + photo
 */
export async function markAttendance(req: Request, res: Response) {
  try {
    const schema = z.object({
      userId: z.union([z.number(), z.string()]),
      siteId: z.union([z.number(), z.string()]), // MongoDB uses string IDs
      photoUri: z.string(),
      gpsLat: z.string().or(z.number()),
      gpsLon: z.string().or(z.number()),
      timestamp: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const now = new Date();

    // Determine shift slot based on current hour
    const hour = now.getHours();
    let shiftSlot = 'afternoon';
    if (hour >= 8 && hour < 12) shiftSlot = 'morning';
    else if (hour >= 12 && hour < 16) shiftSlot = 'afternoon';
    else if (hour >= 16 && hour < 20) shiftSlot = 'evening';

    // Verify GPS is within site radius
    // Sites are stored in MongoDB, so check MongoDB first
    let siteData: any = null;

    try {
      const { MongoClient, ObjectId } = require('mongodb');
      const mongoUri = process.env.MONGODB_URI;
      if (mongoUri) {
        const client = new MongoClient(mongoUri);
        await client.connect();
        const mongoDb = client.db('infratrace');
        // Handle both string and number siteId
        const siteIdObj = typeof data.siteId === 'string' ? new ObjectId(data.siteId) : new ObjectId(data.siteId.toString());
        const mongoSite = await mongoDb.collection('sites').findOne({ _id: siteIdObj });
        if (mongoSite) {
          siteData = {
            latitude: mongoSite.latitude,
            longitude: mongoSite.longitude,
            radius: mongoSite.radius || 100,
            name: mongoSite.name,
          };
          console.log(`✅ Found site in MongoDB: ${mongoSite.name} (radius: ${mongoSite.radius}m)`);
        }
        await client.close();
      }
    } catch (err) {
      console.error('MongoDB site lookup error:', err);
      // Fallback to PostgreSQL if MongoDB fails
      try {
        const site = await db.select().from(sites).where(eq(sites.id, Number(data.siteId))).limit(1);
        if (site.length > 0) {
          siteData = site[0];
          console.log(`✅ Found site in PostgreSQL: ID ${data.siteId}`);
        }
      } catch (pgErr) {
        console.error('PostgreSQL site lookup also failed:', pgErr);
      }
    }

    if (!siteData) {
      return res.status(404).json({
        error: 'Site not found',
        message: `Site with ID ${data.siteId} not found in database`
      });
    }

    // Verify GPS is within radius and determine auto-approval
    let isWithinRadius = false;
    if (siteData.latitude && siteData.longitude && siteData.radius) {
      const lat1 = parseFloat(siteData.latitude.toString());
      const lon1 = parseFloat(siteData.longitude.toString());
      const lat2 = parseFloat(data.gpsLat.toString());
      const lon2 = parseFloat(data.gpsLon.toString());
      const radius = siteData.radius;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      if (distance > radius) {
        return res.status(400).json({
          error: 'Location not within site radius',
          message: `You must be within ${radius}m of the site center. You are ${Math.round(distance)}m away.`,
          distance: Math.round(distance),
          requiredRadius: radius,
        });
      }

      isWithinRadius = true;
      console.log(`✅ GPS verified: ${Math.round(distance)}m from site center (radius: ${radius}m) - Auto-approved`);
    }

    // Create attendance record
    // Convert IDs to numbers for PostgreSQL (MongoDB uses strings)
    const siteIdNum = typeof data.siteId === 'string' ? parseInt(data.siteId, 10) : Number(data.siteId);
    const userIdNum = typeof data.userId === 'string' ? parseInt(data.userId, 10) : Number(data.userId);

    // If siteId is MongoDB ObjectId (24 char hex), we can't convert to number
    // Store as null in PostgreSQL siteId, but keep MongoDB siteId in location/metadata
    const pgSiteId = isNaN(siteIdNum) ? null : siteIdNum;

    const [record] = await db.insert(attendance).values({
      userId: userIdNum,
      siteId: pgSiteId, // May be null if MongoDB ObjectId
      date: now,
      status: 'present',
      photoUri: data.photoUri,
      photoUrl: data.photoUri, // Keep for backward compat
      gpsLat: data.gpsLat.toString(),
      gpsLon: data.gpsLon.toString(),
      location: `${data.gpsLat}, ${data.gpsLon}`,
      // Store MongoDB siteId as string in location field for reference
      // siteId field in PostgreSQL may be null if site doesn't exist there
      shiftSlot: shiftSlot,
      // Auto-approve if GPS is within site radius (already verified above)
      // If within radius, mark as approved automatically - no supervisor approval needed
      approvalStatus: isWithinRadius ? 'approved' : 'pending',
      approvedBy: isWithinRadius ? null : null, // Auto-approved when within radius
      approvedAt: isWithinRadius ? now : null,
      isSynced: true,
    }).returning();

    // Format response to ensure camelCase consistency
    const formattedRecord = {
      id: record.id,
      userId: record.userId,
      siteId: record.siteId,
      date: record.date,
      status: record.status,
      photoUri: record.photoUri || record.photoUrl,
      gpsLat: record.gpsLat ? String(record.gpsLat) : null,
      gpsLon: record.gpsLon ? String(record.gpsLon) : null,
      shiftSlot: record.shiftSlot,
      approvalStatus: record.approvalStatus,
      approvedBy: record.approvedBy,
      approvedAt: record.approvedAt,
      location: record.location,
    };

    const isAutoApproved = formattedRecord.approvalStatus === 'approved';
    res.status(201).json({
      success: true,
      attendance: formattedRecord,
      message: isAutoApproved
        ? 'Attendance marked successfully and automatically approved (within site radius).'
        : 'Attendance marked successfully. Waiting for supervisor approval.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    }
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/attendance/pending
 * Supervisor: Get pending attendance for their site
 */
export async function getPendingAttendance(req: Request, res: Response) {
  try {
    const { siteId, supervisorId } = req.query;

    if (!siteId) {
      return res.status(400).json({ error: 'siteId is required' });
    }

    const pending = await db.select()
      .from(attendance)
      .where(
        and(
          eq(attendance.siteId, Number(siteId)),
          eq(attendance.approvalStatus, 'pending')
        )
      )
      .orderBy(desc(attendance.date));

    // Ensure all properties are in camelCase (Drizzle should handle this, but ensure consistency)
    const formattedPending = pending.map((item) => ({
      id: item.id,
      userId: item.userId,
      siteId: item.siteId,
      date: item.date,
      status: item.status,
      photoUri: item.photoUri || item.photoUrl,
      gpsLat: item.gpsLat ? String(item.gpsLat) : null,
      gpsLon: item.gpsLon ? String(item.gpsLon) : null,
      shiftSlot: item.shiftSlot,
      approvalStatus: item.approvalStatus,
      approvedBy: item.approvedBy,
      approvedAt: item.approvedAt,
      location: item.location,
    }));

    res.json({
      success: true,
      pending: formattedPending,
      count: formattedPending.length,
    });
  } catch (error) {
    console.error('Get pending attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/attendance/:id/approve
 * Supervisor: Approve or reject attendance
 */
export async function approveAttendance(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schema = z.object({
      approved: z.boolean(),
      supervisorId: z.number(),
      reason: z.string().optional(),
    });

    const data = schema.parse(req.body);
    const now = new Date();

    const [updated] = await db.update(attendance)
      .set({
        approvalStatus: data.approved ? 'approved' : 'rejected',
        approvedBy: data.supervisorId,
        approvedAt: now,
        status: data.approved ? 'present' : 'absent',
      })
      .where(eq(attendance.id, Number(id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    // Format response to ensure camelCase consistency
    const formattedUpdated = {
      id: updated.id,
      userId: updated.userId,
      siteId: updated.siteId,
      date: updated.date,
      status: updated.status,
      photoUri: updated.photoUri || updated.photoUrl,
      gpsLat: updated.gpsLat ? String(updated.gpsLat) : null,
      gpsLon: updated.gpsLon ? String(updated.gpsLon) : null,
      shiftSlot: updated.shiftSlot,
      approvalStatus: updated.approvalStatus,
      approvedBy: updated.approvedBy,
      approvedAt: updated.approvedAt,
      location: updated.location,
    };

    res.json({
      success: true,
      attendance: formattedUpdated,
      message: data.approved ? 'Attendance approved' : 'Attendance rejected',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    }
    console.error('Approve attendance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Helper: Calculate distance between two GPS coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Register attendance routes
 */
export function registerAttendanceRoutes(app: Express) {
  app.post('/api/attendance/mark', markAttendance);
  app.get('/api/attendance/pending', getPendingAttendance);
  app.patch('/api/attendance/:id/approve', approveAttendance);
}
