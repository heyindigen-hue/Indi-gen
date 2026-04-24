import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { query } from '../db/client';

export interface AuthPayload { id: string; email: string; role: string; jti?: string; }
export interface AuthedReq extends Request { user?: AuthPayload; }

export async function requireAuth(req: AuthedReq, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthPayload;
    if (payload.jti) {
      const rev = await query('SELECT revoked_at FROM active_sessions WHERE jti=$1', [payload.jti]);
      if (rev.length && rev[0].revoked_at) return res.status(401).json({ error: 'Session revoked' });
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...roles: string[]) {
  return async (req: AuthedReq, res: Response, next: NextFunction) => {
    if (!req.user) {
      // run requireAuth inline first
      await new Promise<void>((resolve) => requireAuth(req, res, () => resolve()));
      if (!req.user) return; // requireAuth already responded 401
    }
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

export const requireAdmin = requireRole('admin', 'super_admin');
export const requireSuperAdmin = requireRole('super_admin');
