/**
 * Database Schema for Site Enrollment System
 * Production-ready with indexes and constraints
 */

export type Site = {
  id: string;                          // UUID
  ownerId: string;                     // Owner who created this site
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  radius: number;                      // Geofencing radius in meters
  address: string;
  pincode: string;
  projectType: 'residential' | 'commercial' | 'industrial' | 'infrastructure';
  status: 'active' | 'completed' | 'on-hold' | 'inactive';
  budget: string;
  startDate: Date;
  estimatedEndDate: Date;
  
  // Enrollment Code Management
  currentEnrollmentCode: string;       // Active 6-digit code
  codeGeneratedAt: Date;               // When code was generated
  codeExpiresAt: Date | null;          // Optional expiry (null = no expiry)
  codeUsageCount: number;              // Track how many workers enrolled
  maxEnrollments: number | null;       // Optional limit (null = unlimited)
  isEnrollmentActive: boolean;         // Manager can pause enrollments
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
};

export type Worker = {
  id: string;                          // UUID
  phoneNumber: string;                 // Primary login identifier (unique)
  name: string;
  email?: string;
  role: 'labour' | 'engineer' | 'supervisor' | 'manager';
  
  // Site Enrollment (Single site at a time)
  currentSiteId: string | null;        // Currently enrolled site
  enrolledAt: Date | null;             // When they joined current site
  enrollmentStatus: 'active' | 'suspended' | 'removed' | 'not_enrolled';
  
  // Profile
  dailyWage?: number;
  idProofType?: string;
  idProofNumber?: string;
  address?: string;
  emergencyContact?: string;
  
  // App Info
  deviceId?: string;                   // For offline-first sync
  lastSyncAt?: Date;
  fcmToken?: string;                   // For push notifications
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
};

export type Enrollment = {
  id: string;                          // UUID
  workerId: string;                    // Worker being enrolled
  siteId: string;                      // Site they're joining
  enrollmentCode: string;              // Code used to enroll
  
  // Status
  status: 'active' | 'completed' | 'revoked';
  enrolledAt: Date;                    // When enrollment started
  completedAt: Date | null;            // When they left/completed
  revokedAt: Date | null;              // If forcefully removed
  revokedBy: string | null;            // Who revoked (manager/owner)
  revokedReason: string | null;
  
  // Verification
  verifiedByManager: boolean;          // Manager approved this worker
  verifiedAt: Date | null;
  verifiedBy: string | null;           // Manager/supervisor ID
  
  // Metadata
  enrolledFromIp?: string;
  enrolledFromDevice?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EnrollmentCodeHistory = {
  id: string;
  siteId: string;
  code: string;
  generatedAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  usageCount: number;                  // How many workers used this code
  isActive: boolean;
};

/**
 * SQL Schema (PostgreSQL)
 */

export const SQL_SCHEMA = `
-- Sites Table
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius INTEGER NOT NULL DEFAULT 100,
  address TEXT,
  pincode VARCHAR(10),
  project_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  budget VARCHAR(50),
  start_date TIMESTAMP NOT NULL,
  estimated_end_date TIMESTAMP,
  
  -- Enrollment Code
  current_enrollment_code VARCHAR(6) NOT NULL UNIQUE,
  code_generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  code_expires_at TIMESTAMP,
  code_usage_count INTEGER NOT NULL DEFAULT 0,
  max_enrollments INTEGER,
  is_enrollment_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_owner_id (owner_id),
  INDEX idx_enrollment_code (current_enrollment_code),
  INDEX idx_status (status)
);

-- Workers Table
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(15) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(20) NOT NULL,
  
  -- Site Enrollment
  current_site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMP,
  enrollment_status VARCHAR(20) NOT NULL DEFAULT 'not_enrolled',
  
  -- Profile
  daily_wage DECIMAL(10, 2),
  id_proof_type VARCHAR(50),
  id_proof_number VARCHAR(50),
  address TEXT,
  emergency_contact VARCHAR(15),
  
  -- App Info
  device_id VARCHAR(255),
  last_sync_at TIMESTAMP,
  fcm_token VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_phone_number (phone_number),
  INDEX idx_current_site_id (current_site_id),
  INDEX idx_enrollment_status (enrollment_status)
);

-- Enrollments Table (History)
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  enrollment_code VARCHAR(6) NOT NULL,
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id),
  revoked_reason TEXT,
  
  -- Verification
  verified_by_manager BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  
  -- Metadata
  enrolled_from_ip VARCHAR(45),
  enrolled_from_device VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_active_enrollment UNIQUE (worker_id, site_id, status),
  
  -- Indexes
  INDEX idx_worker_id (worker_id),
  INDEX idx_site_id (site_id),
  INDEX idx_status (status),
  INDEX idx_enrollment_code (enrollment_code)
);

-- Enrollment Code History
CREATE TABLE enrollment_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_by UUID REFERENCES users(id),
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Indexes
  INDEX idx_site_id (site_id),
  INDEX idx_code (code),
  INDEX idx_is_active (is_active)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Drizzle ORM Schema (if using Drizzle)
 */
export const DRIZZLE_SCHEMA = `
import { pgTable, uuid, varchar, timestamp, decimal, integer, boolean, text, index } from 'drizzle-orm/pg-core';

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  radius: integer('radius').notNull().default(100),
  address: text('address'),
  pincode: varchar('pincode', { length: 10 }),
  projectType: varchar('project_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  budget: varchar('budget', { length: 50 }),
  startDate: timestamp('start_date').notNull(),
  estimatedEndDate: timestamp('estimated_end_date'),
  
  currentEnrollmentCode: varchar('current_enrollment_code', { length: 6 }).notNull().unique(),
  codeGeneratedAt: timestamp('code_generated_at').notNull().defaultNow(),
  codeExpiresAt: timestamp('code_expires_at'),
  codeUsageCount: integer('code_usage_count').notNull().default(0),
  maxEnrollments: integer('max_enrollments'),
  isEnrollmentActive: boolean('is_enrollment_active').notNull().default(true),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  ownerIdIdx: index('idx_owner_id').on(table.ownerId),
  enrollmentCodeIdx: index('idx_enrollment_code').on(table.currentEnrollmentCode),
  statusIdx: index('idx_status').on(table.status),
}));

export const workers = pgTable('workers', {
  id: uuid('id').primaryKey().defaultRandom(),
  phoneNumber: varchar('phone_number', { length: 15 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  role: varchar('role', { length: 20 }).notNull(),
  
  currentSiteId: uuid('current_site_id'),
  enrolledAt: timestamp('enrolled_at'),
  enrollmentStatus: varchar('enrollment_status', { length: 20 }).notNull().default('not_enrolled'),
  
  dailyWage: decimal('daily_wage', { precision: 10, scale: 2 }),
  idProofType: varchar('id_proof_type', { length: 50 }),
  idProofNumber: varchar('id_proof_number', { length: 50 }),
  address: text('address'),
  emergencyContact: varchar('emergency_contact', { length: 15 }),
  
  deviceId: varchar('device_id', { length: 255 }),
  lastSyncAt: timestamp('last_sync_at'),
  fcmToken: varchar('fcm_token', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  phoneNumberIdx: index('idx_phone_number').on(table.phoneNumber),
  currentSiteIdIdx: index('idx_current_site_id').on(table.currentSiteId),
  enrollmentStatusIdx: index('idx_enrollment_status').on(table.enrollmentStatus),
}));

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  workerId: uuid('worker_id').notNull(),
  siteId: uuid('site_id').notNull(),
  enrollmentCode: varchar('enrollment_code', { length: 6 }).notNull(),
  
  status: varchar('status', { length: 20 }).notNull().default('active'),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  revokedAt: timestamp('revoked_at'),
  revokedBy: uuid('revoked_by'),
  revokedReason: text('revoked_reason'),
  
  verifiedByManager: boolean('verified_by_manager').notNull().default(false),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by'),
  
  enrolledFromIp: varchar('enrolled_from_ip', { length: 45 }),
  enrolledFromDevice: varchar('enrolled_from_device', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  workerIdIdx: index('idx_worker_id').on(table.workerId),
  siteIdIdx: index('idx_site_id').on(table.siteId),
  statusIdx: index('idx_status').on(table.status),
  enrollmentCodeIdx: index('idx_enrollment_code').on(table.enrollmentCode),
}));
`;
