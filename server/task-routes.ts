import type { Express, Request, Response } from "express";
import { db } from "./db";
import { tasks, users } from "@shared/schema";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod";

/**
 * POST /api/tasks
 * Engineer: Create task and assign to supervisor
 */
export async function createTask(req: Request, res: Response) {
  try {
    const schema = z.object({
      title: z.string().min(1),
      time: z.string(),
      location: z.string(),
      priority: z.string().default('medium'),
      siteId: z.number(),
      assignedToSupervisorId: z.number(),
      createdByEngineerId: z.number(),
    });

    const data = schema.parse(req.body);

    // Get supervisor name for display
    const supervisor = await db.select()
      .from(users)
      .where(eq(users.id, data.assignedToSupervisorId))
      .limit(1);

    const [task] = await db.insert(tasks).values({
      title: data.title,
      time: data.time,
      location: data.location,
      status: 'pending',
      priority: data.priority,
      siteId: data.siteId,
      assignedToSupervisorId: data.assignedToSupervisorId,
      createdByEngineerId: data.createdByEngineerId,
      supervisor: supervisor[0]?.name || 'Supervisor',
      date: new Date(),
    }).returning();

    // Format response to ensure camelCase consistency
    const formattedTask = {
      id: task.id,
      title: task.title,
      time: task.time,
      location: task.location,
      status: task.status,
      priority: task.priority,
      siteId: task.siteId,
      assignedToSupervisorId: task.assignedToSupervisorId,
      assignedToLabourId: task.assignedToLabourId,
      createdByEngineerId: task.createdByEngineerId,
      supervisor: task.supervisor,
      supervisorAvatar: task.supervisorAvatar,
      date: task.date,
    };

    res.status(201).json({
      success: true,
      task: formattedTask,
      message: 'Task created and assigned to supervisor',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    }
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * PATCH /api/tasks/:id/assign-labour
 * Supervisor: Assign task to specific labour
 */
export async function assignTaskToLabour(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const schema = z.object({
      assignedToLabourId: z.number(),
      supervisorId: z.number(),
    });

    const data = schema.parse(req.body);

    // Verify task is assigned to this supervisor
    const existingTask = await db.select()
      .from(tasks)
      .where(eq(tasks.id, Number(id)))
      .limit(1);

    if (existingTask.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (existingTask[0].assignedToSupervisorId !== data.supervisorId) {
      return res.status(403).json({ error: 'You are not assigned to this task' });
    }

    const [updated] = await db.update(tasks)
      .set({
        assignedToLabourId: data.assignedToLabourId,
      })
      .where(eq(tasks.id, Number(id)))
      .returning();

    // Format response to ensure camelCase consistency
    const formattedTask = {
      id: updated.id,
      title: updated.title,
      time: updated.time,
      location: updated.location,
      status: updated.status,
      priority: updated.priority,
      siteId: updated.siteId,
      assignedToSupervisorId: updated.assignedToSupervisorId,
      assignedToLabourId: updated.assignedToLabourId,
      createdByEngineerId: updated.createdByEngineerId,
      supervisor: updated.supervisor,
      supervisorAvatar: updated.supervisorAvatar,
      date: updated.date,
    };

    res.json({
      success: true,
      task: formattedTask,
      message: 'Task assigned to labour',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.issues,
      });
    }
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/tasks
 * Get tasks based on role (engineer/supervisor/labour)
 */
export async function getTasks(req: Request, res: Response) {
  try {
    const { userId, role, siteId } = req.query;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required' });
    }

    const userIdNum = Number(userId);
    let taskList;

    if (role === 'junior_engineer' || role === 'senior_engineer') {
      // Engineer: See all tasks they created
      taskList = await db.select()
        .from(tasks)
        .where(
          and(
            eq(tasks.createdByEngineerId, userIdNum),
            siteId ? eq(tasks.siteId, Number(siteId)) : undefined
          )
        );
    } else if (role === 'site_supervisor') {
      // Supervisor: See tasks assigned to them
      taskList = await db.select()
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToSupervisorId, userIdNum),
            siteId ? eq(tasks.siteId, Number(siteId)) : undefined
          )
        );
    } else if (role === 'labour') {
      // Labour: See only tasks assigned to them
      taskList = await db.select()
        .from(tasks)
        .where(
          and(
            eq(tasks.assignedToLabourId, userIdNum),
            siteId ? eq(tasks.siteId, Number(siteId)) : undefined
          )
        );
    } else {
      // Owner/Manager: See all tasks for their sites
      taskList = await db.select()
        .from(tasks)
        .where(siteId ? eq(tasks.siteId, Number(siteId)) : undefined);
    }

    // Format response to ensure camelCase consistency
    const formattedTasks = taskList.map((task) => ({
      id: task.id,
      title: task.title,
      time: task.time,
      location: task.location,
      status: task.status,
      priority: task.priority,
      siteId: task.siteId,
      assignedToSupervisorId: task.assignedToSupervisorId,
      assignedToLabourId: task.assignedToLabourId,
      createdByEngineerId: task.createdByEngineerId,
      supervisor: task.supervisor,
      supervisorAvatar: task.supervisorAvatar,
      date: task.date,
    }));

    res.json({
      success: true,
      tasks: formattedTasks,
      count: formattedTasks.length,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Register task routes
 */
export function registerTaskRoutes(app: Express) {
  app.post('/api/tasks', createTask);
  app.patch('/api/tasks/:id/assign-labour', assignTaskToLabour);
  app.get('/api/tasks', getTasks);
}
