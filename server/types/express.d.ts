// server/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        phoneNumber: string;
        name?: string;
      };
      db?: any; // Your Drizzle database instance
      schema?: any; // Your Drizzle schema
    }
  }
}

export {};