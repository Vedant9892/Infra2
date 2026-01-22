/**
 * Backend API Endpoints for Site Enrollment System
 * Production-ready with validation, error handling, and security
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GenerateCodeSchema = z.object({
  siteId: z.string().uuid(),
  expiresInDays: z.number().min(0).max(365).optional(), // null = no expiry
  maxEnrollments: z.number().min(1).max(1000).optional(), // null = unlimited
});

const EnrollWorkerSchema = z.object({
  enrollmentCode: z.string().length(6).regex(/^[0-9]{6}$/, 'Code must be 6 digits'),
  workerPhoneNumber: z.string().min(10).max(15),
  workerName: z.string().min(2).max(255),
  workerRole: z.enum(['labour', 'engineer', 'supervisor', 'manager']),
  deviceId: z.string().optional(),
});

const ValidateCodeSchema = z.object({
  enrollmentCode: z.string().length(6),
});

const RevokeEnrollmentSchema = z.object({
  workerId: z.string().uuid(),
  siteId: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a secure 6-digit enrollment code
 */
function generateEnrollmentCode(): string {
  // Generate cryptographically secure random 6-digit number
  const code = crypto.randomInt(100000, 999999).toString();
  return code;
}

/**
 * Check if enrollment code is valid and not expired
 */
async function isCodeValid(code: string, db: any): Promise<{ valid: boolean; site?: any; error?: string }> {
  const site = await db.query.sites.findFirst({
    where: (sites: any, { eq }: any) => eq(sites.currentEnrollmentCode, code),
  });

  if (!site) {
    return { valid: false, error: 'Invalid enrollment code' };
  }

  if (!site.isEnrollmentActive) {
    return { valid: false, error: 'Enrollment is currently paused for this site' };
  }

  if (site.codeExpiresAt && new Date(site.codeExpiresAt) < new Date()) {
    return { valid: false, error: 'Enrollment code has expired' };
  }

  if (site.maxEnrollments && site.codeUsageCount >= site.maxEnrollments) {
    return { valid: false, error: 'Maximum enrollment limit reached' };
  }

  if (site.status !== 'active') {
    return { valid: false, error: 'Site is not active' };
  }

  return { valid: true, site };
}

/**
 * Check if worker is already enrolled in a site
 */
async function isWorkerEnrolled(workerId: string, db: any): Promise<{ enrolled: boolean; currentSiteId?: string }> {
  const worker = await db.query.workers.findFirst({
    where: (workers: any, { eq }: any) => eq(workers.id, workerId),
  });

  if (worker?.currentSiteId && worker.enrollmentStatus === 'active') {
    return { enrolled: true, currentSiteId: worker.currentSiteId };
  }

  return { enrolled: false };
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /api/enrollment/generate-code
 * Generate new enrollment code for a site (Manager/Owner only)
 */
export async function generateEnrollmentCode(req: Request, res: Response) {
  try {
    // Validate request
    const { siteId, expiresInDays, maxEnrollments } = GenerateCodeSchema.parse(req.body);
    const managerId = req.user?.id; // Assuming auth middleware adds user

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify manager owns this site or is authorized
    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, siteId),
    });

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (site.ownerId !== managerId) {
      return res.status(403).json({ error: 'You do not have permission to manage this site' });
    }

    // Generate new code
    const newCode = generateEnrollmentCode();
    const now = new Date();
    const expiresAt = expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : null;

    // Archive old code to history
    if (site.currentEnrollmentCode) {
      await req.db.insert(req.schema.enrollmentCodeHistory).values({
        siteId: site.id,
        code: site.currentEnrollmentCode,
        generatedAt: site.codeGeneratedAt,
        expiresAt: site.codeExpiresAt,
        revokedAt: now,
        revokedBy: managerId,
        usageCount: site.codeUsageCount,
        isActive: false,
      });
    }

    // Update site with new code
    await req.db.update(req.schema.sites)
      .set({
        currentEnrollmentCode: newCode,
        codeGeneratedAt: now,
        codeExpiresAt: expiresAt,
        codeUsageCount: 0,
        maxEnrollments: maxEnrollments || null,
        isEnrollmentActive: true,
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.sites.id, siteId));

    res.status(200).json({
      success: true,
      enrollmentCode: newCode,
      expiresAt,
      maxEnrollments,
      message: 'New enrollment code generated successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Generate code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/enrollment/validate-code
 * Validate enrollment code (before showing enrollment form)
 */
export async function validateEnrollmentCode(req: Request, res: Response) {
  try {
    const { enrollmentCode } = ValidateCodeSchema.parse(req.body);

    const validation = await isCodeValid(enrollmentCode, req.db);

    if (!validation.valid) {
      return res.status(400).json({ 
        valid: false, 
        error: validation.error 
      });
    }

    // Return site info (without sensitive data)
    res.status(200).json({
      valid: true,
      site: {
        id: validation.site.id,
        name: validation.site.name,
        location: validation.site.location,
        projectType: validation.site.projectType,
        remainingSlots: validation.site.maxEnrollments 
          ? validation.site.maxEnrollments - validation.site.codeUsageCount 
          : null,
        expiresAt: validation.site.codeExpiresAt,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Validate code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/enrollment/enroll
 * Enroll worker into site using enrollment code
 */
export async function enrollWorker(req: Request, res: Response) {
  try {
    const data = EnrollWorkerSchema.parse(req.body);
    const { enrollmentCode, workerPhoneNumber, workerName, workerRole, deviceId } = data;

    // Validate enrollment code
    const validation = await isCodeValid(enrollmentCode, req.db);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const site = validation.site;

    // Check if worker already exists
    let worker = await req.db.query.workers.findFirst({
      where: (workers: any, { eq }: any) => eq(workers.phoneNumber, workerPhoneNumber),
    });

    // If worker exists, check current enrollment
    if (worker) {
      const enrollmentCheck = await isWorkerEnrolled(worker.id, req.db);
      
      if (enrollmentCheck.enrolled) {
        // Worker already enrolled in a site
        const currentSite = await req.db.query.sites.findFirst({
          where: (sites: any, { eq }: any) => eq(sites.id, enrollmentCheck.currentSiteId),
        });

        return res.status(400).json({ 
          error: 'Already enrolled',
          message: `You are already enrolled in: ${currentSite?.name}. Please contact your manager to transfer.`,
          currentSite: {
            id: currentSite?.id,
            name: currentSite?.name,
            location: currentSite?.location,
          },
        });
      }

      // Check if worker was previously enrolled in THIS site (re-enrollment)
      const previousEnrollment = await req.db.query.enrollments.findFirst({
        where: (enrollments: any, { and, eq }: any) => and(
          eq(enrollments.workerId, worker.id),
          eq(enrollments.siteId, site.id),
        ),
        orderBy: (enrollments: any, { desc }: any) => desc(enrollments.enrolledAt),
      });

      if (previousEnrollment && previousEnrollment.status === 'active') {
        return res.status(400).json({ 
          error: 'Already enrolled in this site',
        });
      }
    } else {
      // Create new worker
      const newWorker = await req.db.insert(req.schema.workers).values({
        phoneNumber: workerPhoneNumber,
        name: workerName,
        role: workerRole,
        deviceId: deviceId || null,
        enrollmentStatus: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      worker = newWorker[0];
    }

    // Create enrollment record
    const now = new Date();
    const enrollment = await req.db.insert(req.schema.enrollments).values({
      workerId: worker.id,
      siteId: site.id,
      enrollmentCode: enrollmentCode,
      status: 'active',
      enrolledAt: now,
      enrolledFromIp: req.ip || req.headers['x-forwarded-for'],
      enrolledFromDevice: deviceId || req.headers['user-agent'],
      verifiedByManager: false, // Manager needs to verify
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Update worker with current site
    await req.db.update(req.schema.workers)
      .set({
        currentSiteId: site.id,
        enrolledAt: now,
        enrollmentStatus: 'active',
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.workers.id, worker.id));

    // Increment code usage count
    await req.db.update(req.schema.sites)
      .set({
        codeUsageCount: site.codeUsageCount + 1,
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.sites.id, site.id));

    // Return success with site info
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled! Waiting for manager verification.',
      enrollment: {
        id: enrollment[0].id,
        workerId: worker.id,
        workerName: worker.name,
        siteId: site.id,
        siteName: site.name,
        enrolledAt: now,
        needsVerification: true,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Enroll worker error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/enrollment/site/:siteId/pending
 * Get pending enrollments for manager verification
 */
export async function getPendingEnrollments(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify manager access
    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, siteId),
    });

    if (!site || site.ownerId !== managerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get pending enrollments
    const pendingEnrollments = await req.db.query.enrollments.findMany({
      where: (enrollments: any, { and, eq }: any) => and(
        eq(enrollments.siteId, siteId),
        eq(enrollments.status, 'active'),
        eq(enrollments.verifiedByManager, false),
      ),
      with: {
        worker: true,
      },
      orderBy: (enrollments: any, { desc }: any) => desc(enrollments.enrolledAt),
    });

    res.status(200).json({
      success: true,
      pendingCount: pendingEnrollments.length,
      enrollments: pendingEnrollments,
    });
  } catch (error: any) {
    console.error('Get pending enrollments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/enrollment/verify/:enrollmentId
 * Manager verifies/approves worker enrollment
 */
export async function verifyEnrollment(req: Request, res: Response) {
  try {
    const { enrollmentId } = req.params;
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const enrollment = await req.db.query.enrollments.findFirst({
      where: (enrollments: any, { eq }: any) => eq(enrollments.id, enrollmentId),
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    // Verify manager access to this site
    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, enrollment.siteId),
    });

    if (!site || site.ownerId !== managerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update enrollment
    const now = new Date();
    await req.db.update(req.schema.enrollments)
      .set({
        verifiedByManager: true,
        verifiedAt: now,
        verifiedBy: managerId,
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.enrollments.id, enrollmentId));

    res.status(200).json({
      success: true,
      message: 'Worker enrollment verified successfully',
    });
  } catch (error: any) {
    console.error('Verify enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/enrollment/revoke
 * Revoke worker enrollment (remove from site)
 */
export async function revokeEnrollment(req: Request, res: Response) {
  try {
    const { workerId, siteId, reason } = RevokeEnrollmentSchema.parse(req.body);
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify manager access
    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, siteId),
    });

    if (!site || site.ownerId !== managerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find active enrollment
    const enrollment = await req.db.query.enrollments.findFirst({
      where: (enrollments: any, { and, eq }: any) => and(
        eq(enrollments.workerId, workerId),
        eq(enrollments.siteId, siteId),
        eq(enrollments.status, 'active'),
      ),
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Active enrollment not found' });
    }

    // Revoke enrollment
    const now = new Date();
    await req.db.update(req.schema.enrollments)
      .set({
        status: 'revoked',
        revokedAt: now,
        revokedBy: managerId,
        revokedReason: reason,
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.enrollments.id, enrollment.id));

    // Update worker status
    await req.db.update(req.schema.workers)
      .set({
        currentSiteId: null,
        enrollmentStatus: 'removed',
        updatedAt: now,
      })
      .where(req.db.eq(req.schema.workers.id, workerId));

    res.status(200).json({
      success: true,
      message: 'Worker enrollment revoked successfully',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Revoke enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * POST /api/enrollment/pause/:siteId
 * Pause/resume enrollments for a site
 */
export async function toggleEnrollmentStatus(req: Request, res: Response) {
  try {
    const { siteId } = req.params;
    const { isPaused } = req.body;
    const managerId = req.user?.id;

    if (!managerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, siteId),
    });

    if (!site || site.ownerId !== managerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await req.db.update(req.schema.sites)
      .set({
        isEnrollmentActive: !isPaused,
        updatedAt: new Date(),
      })
      .where(req.db.eq(req.schema.sites.id, siteId));

    res.status(200).json({
      success: true,
      message: isPaused ? 'Enrollment paused' : 'Enrollment resumed',
    });
  } catch (error: any) {
    console.error('Toggle enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/enrollment/worker/:workerId/current
 * Get worker's current enrollment (for offline-first sync)
 */
export async function getWorkerCurrentEnrollment(req: Request, res: Response) {
  try {
    const { workerId } = req.params;

    const worker = await req.db.query.workers.findFirst({
      where: (workers: any, { eq }: any) => eq(workers.id, workerId),
    });

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    if (!worker.currentSiteId) {
      return res.status(200).json({
        enrolled: false,
        message: 'Not enrolled in any site',
      });
    }

    const site = await req.db.query.sites.findFirst({
      where: (sites: any, { eq }: any) => eq(sites.id, worker.currentSiteId),
    });

    const enrollment = await req.db.query.enrollments.findFirst({
      where: (enrollments: any, { and, eq }: any) => and(
        eq(enrollments.workerId, workerId),
        eq(enrollments.siteId, worker.currentSiteId),
        eq(enrollments.status, 'active'),
      ),
    });

    res.status(200).json({
      enrolled: true,
      site: {
        id: site.id,
        name: site.name,
        location: site.location,
        latitude: site.latitude,
        longitude: site.longitude,
        radius: site.radius,
      },
      enrollment: {
        id: enrollment?.id,
        enrolledAt: enrollment?.enrolledAt,
        verified: enrollment?.verifiedByManager,
      },
    });
  } catch (error: any) {
    console.error('Get worker enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
