import { Request, Response, NextFunction } from 'express';
import { redis } from '../redis';

export function rateLimit(opts: { key: (req: Request) => string; limit: number; windowSec: number }) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const k = `rl:${opts.key(req)}`;
      const count = await redis.incr(k);
      if (count === 1) await redis.expire(k, opts.windowSec);
      if (count > opts.limit) return res.status(429).json({ error: 'Rate limit exceeded' });
      res.setHeader('X-RateLimit-Remaining', Math.max(0, opts.limit - count));
    } catch {
      // fail open when Redis is unavailable
    }
    next();
  };
}

export const ipLimit = rateLimit({ key: (r) => r.ip || 'unknown', limit: 300, windowSec: 60 });
export const authLimit = rateLimit({
  key: (r) => `${r.ip}:${r.body?.email || ''}`,
  limit: 5, windowSec: 60,
});
