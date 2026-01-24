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

// === BASE SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertStatsSchema = createInsertSchema(stats).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===
export type User = typeof users.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type UserStats = typeof stats.$inferSelect;

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type TasksListResponse = Task[];
export type UserProfileResponse = User & { stats?: UserStats };
