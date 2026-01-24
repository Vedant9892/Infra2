import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Phone number for Indian context
  name: text("name").notNull(),
  role: text("role").notNull(), // 'labour' | 'site_supervisor' | 'junior_engineer' | 'senior_engineer' | 'site_manager' | 'site_owner'
  avatar: text("avatar"),
  location: text("location"),
  preferredLanguage: text("preferred_language").default("English"),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  time: text("time").notNull(), 
  location: text("location").notNull(), 
  status: text("status").notNull().default("pending"), 
  priority: text("priority").notNull().default("medium"), 
  supervisor: text("supervisor"), 
  supervisorAvatar: text("supervisor_avatar"),
  date: timestamp("date").defaultNow(),
  // New fields for Engineer → Supervisor → Labour flow
  siteId: integer("site_id"),
  assignedToSupervisorId: integer("assigned_to_supervisor_id"),
  assignedToLabourId: integer("assigned_to_labour_id"),
  createdByEngineerId: integer("created_by_engineer_id"),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull(), 
  location: text("location"),
  photoUrl: text("photo_url"),
  isSynced: boolean("is_synced").default(true),
  // New fields for GPS attendance with supervisor approval
  shiftSlot: text("shift_slot"), // 'morning' | 'afternoon' | 'evening'
  approvalStatus: text("approval_status").default("pending"), // 'pending' | 'approved' | 'rejected'
  approvedBy: integer("approved_by"), // supervisor user_id
  approvedAt: timestamp("approved_at"),
  photoUri: text("photo_uri"), // Alternative photo field
  gpsLat: decimal("gps_lat", { precision: 10, scale: 8 }),
  gpsLon: decimal("gps_lon", { precision: 11, scale: 8 }),
  siteId: integer("site_id"), // Which site this attendance is for
});

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  attendanceRate: integer("attendance_rate").notNull(),
  hoursWorked: integer("hours_worked").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
});

// Sites table for owner site management
export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  address: text("address"),
  pincode: text("pincode"),
  projectType: text("project_type"), // 'residential' | 'commercial' | 'industrial' | 'infrastructure'
  budget: text("budget"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  radius: integer("radius"), // in meters (50-500)
  status: text("status").default("active"), // 'active' | 'completed' | 'on-hold'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === NEW FEATURE TABLES ===

// 1. Contractor Rating & Management
export const contractors = pgTable("contractors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  companyName: text("company_name"),
  phone: text("phone"),
  email: text("email"),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull().default("5.0"), // 1-10 scale
  deadlinesMet: integer("deadlines_met").notNull().default(0),
  totalProjects: integer("total_projects").notNull().default(0),
  defectCount: integer("defect_count").notNull().default(0),
  paymentAdvice: text("payment_advice").notNull().default("partial"), // 'release' | 'hold' | 'partial'
  siteId: integer("site_id").references(() => sites.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Face-Recall for Daily Wagers
export const dailyWagers = pgTable("daily_wagers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: text("role"), // 'Mason' | 'Helper' | 'Carpenter' | etc.
  faceEncoding: text("face_encoding"), // Base64 encoded face features for recognition
  photoUri: text("photo_uri"), // Reference photo
  siteId: integer("site_id").references(() => sites.id),
  dailyWage: decimal("daily_wage", { precision: 10, scale: 2 }),
  lastWageDate: timestamp("last_wage_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const faceAttendance = pgTable("face_attendance", {
  id: serial("id").primaryKey(),
  wagerId: integer("wager_id").notNull().references(() => dailyWagers.id),
  siteId: integer("site_id").references(() => sites.id),
  recognizedAt: timestamp("recognized_at").defaultNow(),
  photoUri: text("photo_uri"), // Photo taken during recognition
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // Recognition confidence score
  gpsLat: decimal("gps_lat", { precision: 10, scale: 8 }),
  gpsLon: decimal("gps_lon", { precision: 11, scale: 8 }),
  address: text("address"),
});

// 3. Tool Library Check-Out (enhanced with QR)
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  siteId: integer("site_id").notNull().references(() => sites.id),
  quantity: integer("quantity").notNull().default(1),
  qrCode: text("qr_code").unique(), // QR code identifier
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const toolRequests = pgTable("tool_requests", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id").notNull().references(() => tools.id),
  userId: integer("user_id").notNull().references(() => users.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  status: text("status").notNull().default("pending"), // 'pending' | 'issued' | 'returned' | 'rejected'
  requestedDuration: text("requested_duration"), // '30m' | '1h' | '2h' | etc.
  requestedAt: timestamp("requested_at").defaultNow(),
  issuedAt: timestamp("issued_at"),
  returnedAt: timestamp("returned_at"),
  qrScannedAt: timestamp("qr_scanned_at"), // When QR was scanned for checkout
});

// 4. OTP Permit-to-Work
export const workPermits = pgTable("work_permits", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  workerId: integer("worker_id").notNull().references(() => users.id),
  workerName: text("worker_name"),
  siteId: integer("site_id").notNull().references(() => sites.id),
  status: text("status").notNull().default("requested"), // 'requested' | 'otp_sent' | 'verified' | 'rejected'
  otp: text("otp"), // 4-digit OTP
  otpExpiresAt: timestamp("otp_expires_at"), // OTP expiry (e.g., 15 minutes)
  requestedAt: timestamp("requested_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => users.id), // Safety Officer
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
});

// 5. Petty Cash Wallet with Geotags
export const pettyCash = pgTable("petty_cash", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  siteId: integer("site_id").references(() => sites.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  purpose: text("purpose").notNull(),
  receiptUri: text("receipt_uri"), // Receipt photo
  gpsLat: decimal("gps_lat", { precision: 10, scale: 8 }).notNull(), // Required for validation
  gpsLon: decimal("gps_lon", { precision: 11, scale: 8 }).notNull(), // Required for validation
  address: text("address").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'approved' | 'rejected'
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// 6. Real-Time Consumption Variance
export const consumptionVariance = pgTable("consumption_variance", {
  id: serial("id").primaryKey(),
  siteId: integer("site_id").notNull().references(() => sites.id),
  materialName: text("material_name").notNull(),
  theoreticalQty: decimal("theoretical_qty", { precision: 10, scale: 2 }).notNull(),
  actualQty: decimal("actual_qty", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(), // 'kg' | 'bags' | 'sqm' | etc.
  variance: decimal("variance", { precision: 10, scale: 2 }).notNull(), // actual - theoretical
  variancePercent: decimal("variance_percent", { precision: 5, scale: 2 }).notNull(),
  status: text("status").notNull().default("ok"), // 'ok' | 'warning' | 'alert'
  alertThreshold: decimal("alert_threshold", { precision: 5, scale: 2 }).default("10.0"), // % threshold for alerts
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertStatsSchema = createInsertSchema(stats).omit({ id: true });
export const insertContractorSchema = createInsertSchema(contractors).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDailyWagerSchema = createInsertSchema(dailyWagers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFaceAttendanceSchema = createInsertSchema(faceAttendance).omit({ id: true });
export const insertToolSchema = createInsertSchema(tools).omit({ id: true, createdAt: true, updatedAt: true });
export const insertToolRequestSchema = createInsertSchema(toolRequests).omit({ id: true });
export const insertWorkPermitSchema = createInsertSchema(workPermits).omit({ id: true });
export const insertPettyCashSchema = createInsertSchema(pettyCash).omit({ id: true, timestamp: true });
export const insertConsumptionVarianceSchema = createInsertSchema(consumptionVariance).omit({ id: true, createdAt: true, updatedAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type UserStats = typeof stats.$inferSelect;
export type Contractor = typeof contractors.$inferSelect;
export type DailyWager = typeof dailyWagers.$inferSelect;
export type FaceAttendance = typeof faceAttendance.$inferSelect;
export type Tool = typeof tools.$inferSelect;
export type ToolRequest = typeof toolRequests.$inferSelect;
export type WorkPermit = typeof workPermits.$inferSelect;
export type PettyCash = typeof pettyCash.$inferSelect;
export type ConsumptionVariance = typeof consumptionVariance.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertContractor = z.infer<typeof insertContractorSchema>;
export type InsertDailyWager = z.infer<typeof insertDailyWagerSchema>;
export type InsertFaceAttendance = z.infer<typeof insertFaceAttendanceSchema>;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type InsertToolRequest = z.infer<typeof insertToolRequestSchema>;
export type InsertWorkPermit = z.infer<typeof insertWorkPermitSchema>;
export type InsertPettyCash = z.infer<typeof insertPettyCashSchema>;
export type InsertConsumptionVariance = z.infer<typeof insertConsumptionVarianceSchema>;

export type TasksListResponse = Task[];
export type UserProfileResponse = User & { stats?: UserStats };
