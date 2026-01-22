# Site Enrollment System - Security & Best Practices

## 🔒 Security Considerations

### 1. Enrollment Code Security

#### **Code Generation**
- ✅ Use `crypto.randomInt()` for cryptographically secure random codes
- ✅ 6-digit codes = 1 million combinations (sufficient for construction sites)
- ✅ Store codes as plain text (not passwords, meant to be shared)
- ❌ Do NOT use predictable patterns (sequential, date-based)

#### **Code Expiry**
```typescript
// Recommended expiry times:
- Quick enrollment (same day): 1 day
- Normal enrollment: 7-30 days
- Long-term projects: 90-365 days
- No expiry: Only for stable, long-term sites

// Check expiry on every validation:
if (site.codeExpiresAt && new Date(site.codeExpiresAt) < new Date()) {
  return { valid: false, error: 'Code expired' };
}
```

#### **Usage Limits**
```typescript
// Prevent code abuse:
maxEnrollments: number | null

// Example scenarios:
- Small project (5-10 workers): maxEnrollments = 15
- Medium project (20-50 workers): maxEnrollments = 60
- Large project (100+ workers): maxEnrollments = 150
- Unlimited: maxEnrollments = null (risky, use with short expiry)
```

### 2. Preventing Duplicate Enrollment

#### **Database Constraints**
```sql
-- Unique constraint: one active enrollment per worker-site pair
CONSTRAINT unique_active_enrollment UNIQUE (worker_id, site_id, status);

-- Index for fast duplicate checks
CREATE INDEX idx_worker_site_active ON enrollments (worker_id, site_id) 
WHERE status = 'active';
```

#### **Application-Level Checks**
```typescript
// Check 1: Is worker already enrolled anywhere?
if (worker.currentSiteId && worker.enrollmentStatus === 'active') {
  return { error: 'Already enrolled in another site' };
}

// Check 2: Was worker previously enrolled in THIS site?
const previousEnrollment = await db.query.enrollments.findFirst({
  where: and(
    eq(enrollments.workerId, workerId),
    eq(enrollments.siteId, siteId),
    eq(enrollments.status, 'active')
  )
});

if (previousEnrollment) {
  return { error: 'Already enrolled in this site' };
}
```

### 3. Code Abuse Prevention

#### **Rate Limiting**
```typescript
// Implement rate limiting on validation endpoint
import rateLimit from 'express-rate-limit';

const validateCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per IP
  message: 'Too many validation attempts, try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/enrollment/validate-code', validateCodeLimiter, validateEnrollmentCode);
```

#### **Code Rotation**
```typescript
// Auto-rotate codes periodically
- After X enrollments (e.g., every 50 workers)
- After security incidents
- When manager suspects code leak

// Archive old codes to history table
await db.insert(enrollmentCodeHistory).values({
  siteId: site.id,
  code: site.currentEnrollmentCode,
  generatedAt: site.codeGeneratedAt,
  revokedAt: new Date(),
  revokedBy: managerId,
  usageCount: site.codeUsageCount,
  isActive: false,
});
```

#### **Pause Enrollments**
```typescript
// Manager can pause enrollment without changing code
site.isEnrollmentActive = false;

// Use case:
- Site reached worker capacity
- Security incident (code leaked publicly)
- Project on hold
- Manager reviewing pending enrollments
```

### 4. Manager Verification

#### **Two-Step Enrollment**
```typescript
// Step 1: Worker self-enrolls (automatic)
enrollment.verifiedByManager = false;
enrollment.status = 'active';
worker.enrollmentStatus = 'active'; // Can access basic features

// Step 2: Manager verifies (manual)
enrollment.verifiedByManager = true;
enrollment.verifiedAt = new Date();
enrollment.verifiedBy = managerId;
// Unlock full features (attendance, materials, etc.)
```

#### **Why Verification?**
- Prevents unauthorized enrollments
- Allows manager to review worker identity
- Catch mistakes (wrong site, wrong role)
- Security check (ID proof, background)

#### **Pending Enrollments Dashboard**
```typescript
// Show manager list of unverified workers
GET /api/enrollment/site/:siteId/pending

// Manager can:
1. Verify (approve) - worker gets full access
2. Revoke (reject) - worker loses site access
3. Update role - correct worker's role if wrong
```

### 5. Enrollment Revocation

#### **Reasons to Revoke**
- Worker quit/terminated
- Worker transferred to another site
- Security violation
- Fraudulent enrollment
- Project completed

#### **Revocation Flow**
```typescript
// 1. Mark enrollment as revoked
enrollment.status = 'revoked';
enrollment.revokedAt = new Date();
enrollment.revokedBy = managerId;
enrollment.revokedReason = 'Worker terminated';

// 2. Update worker status
worker.currentSiteId = null;
worker.enrollmentStatus = 'removed';

// 3. Block future access
// Worker cannot mark attendance, request materials, etc.

// 4. Keep historical data
// Preserve past attendance, work logs for records
```

### 6. Offline-First Security

#### **Data Encryption**
```typescript
// Store sensitive data encrypted
import * as SecureStore from 'expo-secure-store';

// For sensitive tokens/keys
await SecureStore.setItemAsync('authToken', token);

// For general data (AsyncStorage is okay)
await AsyncStorage.setItem('enrollmentData', JSON.stringify(data));
```

#### **Sync Validation**
```typescript
// Always re-validate on sync
const syncResult = await fetch('/api/enrollment/worker/:id/current');

if (syncResult.enrollmentStatus === 'revoked') {
  // Worker was revoked while offline
  await clearEnrollmentData();
  Alert.alert('Access Revoked', 'Your site access has been removed');
  router.replace('/login');
}
```

#### **Pending Actions Security**
```typescript
// Queue actions offline, sync when online
await queuePendingAction({
  type: 'attendance',
  data: {
    workerId,
    siteId,
    timestamp,
    photoUri, // Store locally, upload later
    latitude,
    longitude,
  },
  timestamp: new Date().toISOString(),
});

// On sync: validate worker still enrolled
// Reject if revoked in the meantime
```

### 7. API Security

#### **Authentication**
```typescript
// All endpoints require authentication
const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api/enrollment', authMiddleware);
```

#### **Authorization**
```typescript
// Verify user has permission for action
// Example: Only site owner can generate codes
if (site.ownerId !== req.user.id) {
  return res.status(403).json({ error: 'Access denied' });
}

// Example: Workers can only view their own enrollment
if (enrollment.workerId !== req.user.id && site.ownerId !== req.user.id) {
  return res.status(403).json({ error: 'Access denied' });
}
```

#### **Input Validation**
```typescript
// Use Zod for strict validation
const EnrollWorkerSchema = z.object({
  enrollmentCode: z.string().length(6).regex(/^[0-9]{6}$/),
  workerPhoneNumber: z.string().min(10).max(15),
  workerName: z.string().min(2).max(255),
  workerRole: z.enum(['labour', 'engineer', 'supervisor', 'manager']),
});

// Reject invalid input before database operations
```

#### **Logging & Monitoring**
```typescript
// Log all enrollment activities
await db.insert(auditLogs).values({
  action: 'worker_enrolled',
  userId: workerId,
  siteId: siteId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
  details: { enrollmentCode, workerName, workerRole },
});

// Monitor for suspicious patterns:
- Multiple enrollments from same IP
- Rapid code validations (brute force?)
- Enrollments outside business hours
- Geographic anomalies (IP location vs site location)
```

### 8. Privacy & Data Protection

#### **GDPR/Data Protection**
```typescript
// Store only necessary data
- Worker: name, phone, role (needed)
- Avoid: DOB, religion, caste, full address (unless required)

// Data retention
- Active enrollment: keep all data
- Revoked enrollment: keep 90 days (legal/payroll)
- After retention: anonymize or delete

// Worker rights
- View their data: GET /api/worker/:id/data
- Delete account: POST /api/worker/:id/delete (after clearing dues)
- Export data: GET /api/worker/:id/export (JSON)
```

#### **Minimal Data Sharing**
```typescript
// When validating code, don't leak sensitive info
// ✅ Good:
return {
  valid: true,
  site: {
    id: site.id,
    name: site.name,
    location: site.location,
  }
};

// ❌ Bad:
return {
  valid: true,
  site: site, // Exposes owner details, budget, etc.
};
```

---

## 🚀 Production Deployment Checklist

### Environment Variables
```bash
# .env
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
API_URL=https://api.yourapp.com
REDIS_URL=redis://localhost:6379 # For rate limiting

# Backend validation
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'changeme') {
  throw new Error('JWT_SECRET must be set in production');
}
```

### Database Indexes
```sql
-- Critical indexes for performance
CREATE INDEX idx_sites_enrollment_code ON sites (current_enrollment_code);
CREATE INDEX idx_workers_phone ON workers (phone_number);
CREATE INDEX idx_enrollments_worker_site ON enrollments (worker_id, site_id);
CREATE INDEX idx_enrollments_status ON enrollments (status);
```

### Backup Strategy
```bash
# Daily automated backups
pg_dump -U postgres construction_db > backup_$(date +%Y%m%d).sql

# Retention policy:
- Daily backups: keep 7 days
- Weekly backups: keep 4 weeks
- Monthly backups: keep 12 months
```

### Monitoring
```typescript
// Setup error tracking (Sentry, Rollbar)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Track critical metrics
- Enrollment success rate
- Average time to verify enrollment
- Code validation failures (detect attacks)
- Sync success rate (offline-first)
```

### Testing
```typescript
// Unit tests
- Code generation uniqueness
- Duplicate enrollment prevention
- Expiry validation

// Integration tests
- Full enrollment flow
- Revocation process
- Offline sync

// Load tests
- 100 simultaneous enrollments
- Rate limiting effectiveness
```

---

## 📊 Recommended Settings by Project Size

| Project Size | Workers | Code Expiry | Max Enrollments | Verification |
|-------------|---------|-------------|-----------------|--------------|
| **Small** (5-10) | 5-10 | 7 days | 15 | Required |
| **Medium** (20-50) | 20-50 | 30 days | 60 | Required |
| **Large** (100+) | 100+ | 90 days | 150 | Optional* |
| **Enterprise** (500+) | 500+ | No expiry | Unlimited | Auto-approve† |

*Auto-verify trusted sources (e.g., enrollment via HR system)
†Implement additional ID verification (Aadhaar, PAN)

---

## 🔄 Migration from Existing System

If you have existing workers in the system:

```typescript
// Bulk enrollment script
async function migrateExistingWorkers() {
  const existingWorkers = await getExistingWorkers();
  const site = await getSite();
  
  for (const worker of existingWorkers) {
    await db.insert(enrollments).values({
      workerId: worker.id,
      siteId: site.id,
      enrollmentCode: site.currentEnrollmentCode,
      status: 'active',
      enrolledAt: worker.joinDate || new Date(),
      verifiedByManager: true, // Pre-verified
      verifiedAt: new Date(),
      verifiedBy: site.ownerId,
    });
    
    await db.update(workers)
      .set({
        currentSiteId: site.id,
        enrollmentStatus: 'active',
      })
      .where(eq(workers.id, worker.id));
  }
}
```

---

## 📞 Support & Troubleshooting

### Common Issues

**"Code not working"**
- Check expiry date
- Verify enrollment is active (not paused)
- Check max enrollments not reached

**"Already enrolled"**
- Worker must be revoked from previous site first
- Contact previous site manager

**"Pending verification"**
- Worker enrolled successfully
- Waiting for manager to verify
- Manager checks pending list

**"Offline sync failed"**
- Check internet connection
- Verify worker still enrolled
- Check pending actions queue
