import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Phone number for Indian context
  name: text("name").notNull(),
  role: text("role").notNull(), // 'Labour', 'Supervisor', 'Engineer', 'Owner'
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
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull(), 
  location: text("location"),
  photoUrl: text("photo_url"),
  isSynced: boolean("is_synced").default(true),
});

export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  attendanceRate: integer("attendance_rate").notNull(),
  hoursWorked: integer("hours_worked").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
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
