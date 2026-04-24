import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validateBody = <T>(schema: ZodSchema<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'ValidationError', issues: result.error.errors });
    req.body = result.data;
    next();
  };
