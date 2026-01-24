import type { Express, Request, Response } from "express";
import { db } from "./db";
import { sites } from "@shared/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

/**
 * POST /api/sites
 * Owner: Create new site with GPS location and radius
 */
export async function createSite(req: Request, res: Response) {
  try {
    const schema = z.object({
      ownerId: z.union([z.number(), z.string()]),
      name: z.string().min(1),
      description: z.string().optional(),
      address: z.string().min(1),
      latitude: z.number(),
      longitude: z.number(),
      radius: z.number().min(50).max(500),
      projectType: z.enum(['residential', 'commercial', 'industrial', 'infrastructure']).optional(),
      budget: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const [site] = await db.insert(sites).values({
      ownerId: typeof data.ownerId === 'string' ? parseInt(data.ownerId) : data.ownerId,
      name: data.name,
      location: data.address, // Use address as location name
      address: data.address,
      latitude: String(data.latitude),
      longitude: String(data.longitude),
      radius: data.radius,
      projectType: data.projectType || 'residential',
      budget: data.budget || null,
      status: 'active',
    }).returning();

    res.status(201).json({
      success: true,
      site: {
        id: site.id,
        ownerId: site.ownerId,
        name: site.name,
        address: site.address,
        latitude: site.latitude ? String(site.latitude) : null,
        longitude: site.longitude ? String(site.longitude) : null,
        radius: site.radius,
        projectType: site.projectType,
        status: site.status,
      },
      siteId: site.id, // Keep for backward compat
      message: 'Site created successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.issues,
      });
    }
    console.error('Create site error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * GET /api/sites/owner/:ownerId
 * Get all sites for an owner
 */
export async function getOwnerSites(req: Request, res: Response) {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({ success: false, error: 'ownerId is required' });
    }

    const ownerSites = await db.select()
      .from(sites)
      .where(eq(sites.ownerId, Number(ownerId)));

    // Format response to ensure camelCase consistency
    const formattedSites = ownerSites.map((site) => ({
      id: site.id,
      ownerId: site.ownerId,
      name: site.name,
      location: site.location,
      address: site.address,
      pincode: site.pincode,
      projectType: site.projectType,
      budget: site.budget,
      latitude: site.latitude ? String(site.latitude) : null,
      longitude: site.longitude ? String(site.longitude) : null,
      radius: site.radius,
      status: site.status,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
    }));

    res.json({
      success: true,
      sites: formattedSites,
      count: formattedSites.length,
    });
  } catch (error) {
    console.error('Get owner sites error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Register sites routes
 */
export function registerSitesRoutes(app: Express) {
  app.post('/api/sites', createSite);
  app.get('/api/sites/owner/:ownerId', getOwnerSites);
}
