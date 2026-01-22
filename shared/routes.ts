import { z } from 'zod';
import { insertAttendanceSchema, tasks, users, stats, attendance } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login',
      input: z.object({
        phoneNumber: z.string(),
        role: z.string(),
        language: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect & { stats?: typeof stats.$inferSelect }>(),
        401: z.object({ message: z.string() }),
      },
    },
  },
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/users/me',
      responses: {
        200: z.custom<typeof users.$inferSelect & { stats: typeof stats.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id/status',
      input: z.object({ status: z.string() }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
      },
    }
  },
  attendance: {
    mark: {
      method: 'POST' as const,
      path: '/api/attendance',
      input: insertAttendanceSchema,
      responses: {
        201: z.custom<typeof attendance.$inferSelect>(),
      },
    },
    history: {
      method: 'GET' as const,
      path: '/api/attendance',
      responses: {
        200: z.array(z.custom<typeof attendance.$inferSelect>()),
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type TaskResponse = z.infer<typeof api.tasks.list.responses[200]>[number];
export type UserResponse = z.infer<typeof api.users.me.responses[200]>;
