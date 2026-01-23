import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Initialize seed data
  await storage.seedData();

  // Demo User Context (Hardcoded for hackathon demo)
  const DEMO_USER_ID = 1;

  app.get(api.users.me.path, async (req, res) => {
    const user = await storage.getUser(DEMO_USER_ID);
    const stats = await storage.getUserStats(DEMO_USER_ID);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ ...user, stats });
  });

  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.json(tasks);
  });

  app.patch(api.tasks.updateStatus.path, async (req, res) => {
    const { status } = req.body;
    const task = await storage.updateTaskStatus(Number(req.params.id), status);
    res.json(task);
  });

  app.post(api.attendance.mark.path, async (req, res) => {
    try {
      const input = api.attendance.mark.input.parse(req.body);
      // Force demo user ID
      const record = await storage.markAttendance({ ...input, userId: DEMO_USER_ID });
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.issues[0].message,
          field: err.issues[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.get(api.attendance.history.path, async (req, res) => {
    const history = await storage.getAttendanceHistory(DEMO_USER_ID);
    res.json(history);
  });

  // ============= ADD THIS NEW ROUTE =============
  app.post('/api/users/complete-profile', async (req, res) => {
    try {
      const { userId, name, profilePhoto } = req.body;

      console.log('📥 Complete profile request:', { 
        userId, 
        name, 
        hasPhoto: !!profilePhoto 
      });

      if (!userId || !name || !profilePhoto) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields: userId, name, or profilePhoto' 
        });
      }

      // For now, just return success
      // You'll need to implement actual storage later
      const user = {
        id: userId,
        name,
        profilePhoto,
        isProfileComplete: true,
      };

      console.log('✅ Profile completed successfully');

      res.json({
        success: true,
        message: 'Profile completed successfully',
        user,
      });
    } catch (error) {
      console.error('❌ Complete profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  });
  // ============= END NEW ROUTE =============

  return httpServer;
}