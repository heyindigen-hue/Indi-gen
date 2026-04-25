import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne } from '../db/client';
import { config } from '../config';
import { validateBody } from '../middleware/validate';
import { authLimit } from '../middleware/rateLimit';
import { audit } from '../services/audit';
import { grantTokens } from '../services/tokens';

const router = Router();

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const signupSchema = z.object({
  email: z.string().email(), password: z.string().min(8),
  name: z.string().optional(), phone: z.string().optional(),
  referralCode: z.string().optional(),
});

async function createSession(userId: string, ip?: string, ua?: string) {
  const jti = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000);
  await query(
    `INSERT INTO active_sessions (jti, user_id, ip_address, user_agent, expires_at) VALUES ($1,$2,$3,$4,$5)`,
    [jti, userId, ip || null, ua || null, expiresAt]
  );
  return jti;
}

router.post('/login', authLimit, validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await queryOne<any>(`SELECT * FROM users WHERE email=$1 AND deleted_at IS NULL`, [email]);
  const ok = user && await bcrypt.compare(password, user.password_hash);
  await query(
    `INSERT INTO login_attempts (email, ip_address, success, reason, user_agent) VALUES ($1,$2,$3,$4,$5)`,
    [email, req.ip || null, !!ok, ok ? null : 'bad_password', req.get('user-agent') || null]
  );
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const jti = await createSession(user.id, req.ip, req.get('user-agent') || undefined);
  await query('UPDATE users SET last_login_at=NOW() WHERE id=$1', [user.id]);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, jti }, config.jwtSecret, { expiresIn: '30d' });
  const needsOnboarding = !user.onboarding_completed_at;
  res.json({ token, needs_onboarding: needsOnboarding, user: { id: user.id, email: user.email, role: user.role, name: user.name, needs_onboarding: needsOnboarding } });
});

router.post('/signup', authLimit, validateBody(signupSchema), async (req, res) => {
  const { email, password, name, phone, referralCode } = req.body;
  const existing = await queryOne(`SELECT id FROM users WHERE email=$1`, [email]);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await queryOne<any>(
    `INSERT INTO users (email, password_hash, name, phone) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role`,
    [email, hash, name || null, phone || null]
  );
  await grantTokens({
    userId: user.id, amount: 10, source: 'promo',
    idempotencyKey: `signup-welcome:${user.id}`
  });
  if (referralCode) {
    const ref = await queryOne<any>(
      `SELECT u.id AS user_id FROM users u JOIN referrals r ON r.referrer_id=u.id WHERE r.code=$1`,
      [referralCode]
    );
    if (ref) {
      await query(
        `INSERT INTO referrals (referrer_id, referred_id, code, reward_tokens, reward_granted_at) VALUES ($1,$2,$3,$4,NOW())`,
        [ref.user_id, user.id, referralCode, 25]
      );
      await grantTokens({ userId: ref.user_id, amount: 25, source: 'promo', idempotencyKey: `referral:${user.id}` });
    }
  }
  const jti = await createSession(user.id, req.ip, req.get('user-agent') || undefined);
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, jti }, config.jwtSecret, { expiresIn: '30d' });
  await audit({ actorId: user.id, action: 'user.signup', targetType: 'user', targetId: user.id, ip: req.ip || undefined });
  res.status(201).json({ token, user });
});

router.post('/logout', async (req: any, res) => {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const payload = jwt.verify(header.slice(7), config.jwtSecret) as any;
      if (payload.jti) await query(`UPDATE active_sessions SET revoked_at=NOW() WHERE jti=$1`, [payload.jti]);
    }
  } catch {}
  res.json({ ok: true });
});

router.get('/me', async (req: any, res) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as any;
    const user = await queryOne<any>(
      `SELECT id, email, name, role, avatar_url, company_name, onboarding_completed_at FROM users WHERE id=$1 AND deleted_at IS NULL`,
      [payload.id]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ ...user, needs_onboarding: !user.onboarding_completed_at });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
