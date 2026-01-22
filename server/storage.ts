import { db } from "./db";
import {
  users, tasks, attendance, stats,
  type User, type Task, type Attendance, type UserStats,
  type InsertAttendance
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByPhoneAndRole(phone: string, role: string): Promise<User | undefined>;
  getUserStats(userId: number): Promise<UserStats | undefined>;
  getTasks(): Promise<Task[]>;
  updateTaskStatus(id: number, status: string): Promise<Task>;
  markAttendance(entry: InsertAttendance): Promise<Attendance>;
  getAttendanceHistory(userId: number): Promise<Attendance[]>;
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhoneAndRole(phone: string, role: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      and(eq(users.username, phone), eq(users.role, role))
    );
    return user;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    const [stat] = await db.select().from(stats).where(eq(stats.userId, userId));
    return stat;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.date));
  }

  async updateTaskStatus(id: number, status: string): Promise<Task> {
    const [updated] = await db.update(tasks)
      .set({ status })
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async markAttendance(entry: InsertAttendance): Promise<Attendance> {
    const [record] = await db.insert(attendance).values(entry).returning();
    return record;
  }

  async getAttendanceHistory(userId: number): Promise<Attendance[]> {
    return await db.select().from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(desc(attendance.date));
  }

  async seedData(): Promise<void> {
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) return;

    // Create Indian Demo Users for each role
    const roles = [
      { role: 'Labour', name: 'Ramesh Patil', phone: '9876543210', location: 'Mumbai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ramesh' },
      { role: 'Supervisor', name: 'Suresh Yadav', phone: '9876543211', location: 'Pune', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh' },
      { role: 'Engineer', name: 'Anjali Sharma', phone: '9876543212', location: 'Navi Mumbai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali' },
      { role: 'Owner', name: 'Rohit Deshmukh', phone: '9876543213', location: 'Thane', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit' }
    ];

    for (const r of roles) {
      const [u] = await db.insert(users).values({
        username: r.phone,
        name: r.name,
        role: r.role,
        location: r.location,
        avatar: r.avatar,
        preferredLanguage: 'en'
      }).returning();

      await db.insert(stats).values({
        userId: u.id,
        attendanceRate: 98,
        hoursWorked: 180,
        tasksCompleted: 45
      });
    }

    // Create Indian context tasks
    await db.insert(tasks).values([
      {
        title: "Brickwork - Wing A",
        time: "09:00-13:00",
        location: "Mumbai Site - Floor 4",
        status: "pending",
        priority: "heavy",
        supervisor: "Suresh Yadav",
        supervisorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Suresh",
        date: new Date()
      },
      {
        title: "Electrical Fitting",
        time: "14:00-18:00",
        location: "Pune Complex",
        status: "pending",
        priority: "medium",
        supervisor: "Anjali Sharma",
        supervisorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anjali",
        date: new Date()
      },
      {
        title: "Material Unloading",
        time: "08:00-09:30",
        location: "Thane Depot",
        status: "completed",
        priority: "light",
        supervisor: "Rohit Deshmukh",
        supervisorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rohit",
        date: new Date()
      }
    ]);
  }
}

export const storage = new DatabaseStorage();
