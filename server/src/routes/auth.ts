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
import {
  isFirebaseAdminReady,
  firebaseAdminInitError,
  verifyIdToken,
} from '../middleware/firebaseAdmin';
import { logger } from '../logger';

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
  res.json({
    token,
    needs_onboarding: needsOnboarding,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url || null,
      company_name: user.company_name || null,
      onboarding_completed_at: user.onboarding_completed_at || null,
      needs_onboarding: needsOnboarding,
    },
  });
});

router.post('/signup', authLimit, validateBody(signupSchema), async (req, res) => {
  const { email, password, name, phone, referralCode } = req.body;
  const existing = await queryOne(`SELECT id FROM users WHERE email=$1`, [email]);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = await bcrypt.hash(password, 10);
  const user = await queryOne<any>(
    `INSERT INTO users (email, password_hash, name, phone) VALUES ($1,$2,$3,$4) RETURNING id, email, name, role, phone, avatar_url, company_name, onboarding_completed_at`,
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
  res.status(201).json({
    token,
    needs_onboarding: true,
    user: { ...user, needs_onboarding: true },
  });
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
      `SELECT id, email, name, phone, role, avatar_url, company_name, onboarding_completed_at FROM users WHERE id=$1 AND deleted_at IS NULL`,
      [payload.id]
    );
    if (!user) return res.status(401).json({ error: 'User not found' });
    res.json({ ...user, needs_onboarding: !user.onboarding_completed_at });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const patchMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

router.patch('/me', async (req: any, res) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as any;
    const result = patchMeSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: 'ValidationError', issues: result.error.errors });

    const { name, phone, avatar_url } = result.data;
    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) { params.push(name); updates.push(`name=$${params.length}`); }
    if (phone !== undefined) { params.push(phone); updates.push(`phone=$${params.length}`); }
    if (avatar_url !== undefined) { params.push(avatar_url); updates.push(`avatar_url=$${params.length}`); }

    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    params.push(payload.id);
    const user = await queryOne<any>(
      `UPDATE users SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length} AND deleted_at IS NULL RETURNING id, email, name, phone, avatar_url`,
      params
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ----- Firebase Phone OTP verification -----
const firebaseVerifySchema = z.object({
  idToken: z.string().min(10),
});

router.post('/firebase-verify', authLimit, validateBody(firebaseVerifySchema), async (req, res) => {
  if (!isFirebaseAdminReady()) {
    const reason = firebaseAdminInitError() || 'Firebase Admin SDK not configured on this server.';
    logger.warn({ reason }, 'firebase-verify called but admin not initialized');
    return res.status(503).json({
      error: 'FIREBASE_ADMIN_NOT_CONFIGURED',
      message:
        'Phone sign-in is not enabled on this server yet. Service account JSON missing.',
      hint: reason,
    });
  }

  const { idToken } = req.body as { idToken: string };

  let decoded: any;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'firebase-verify: invalid token');
    return res.status(401).json({ error: 'INVALID_FIREBASE_TOKEN', message: err?.message || 'Invalid token' });
  }

  const firebaseUid: string = decoded.uid;
  const phone: string | null = decoded.phone_number || null;
  const email: string | null = decoded.email || null;
  const displayName: string | null = decoded.name || null;

  if (!firebaseUid) {
    return res.status(401).json({ error: 'INVALID_FIREBASE_TOKEN', message: 'Token missing uid' });
  }
  if (!phone && !email) {
    return res
      .status(400)
      .json({ error: 'NO_IDENTIFIER', message: 'Token has no phone_number or email' });
  }

  // Look up by firebase_uid first, then phone, then email.
  let user: any = await queryOne<any>(
    `SELECT * FROM users WHERE firebase_uid = $1 AND deleted_at IS NULL`,
    [firebaseUid]
  );
  if (!user && phone) {
    user = await queryOne<any>(
      `SELECT * FROM users WHERE phone = $1 AND deleted_at IS NULL`,
      [phone]
    );
  }
  if (!user && email) {
    user = await queryOne<any>(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
  }

  let isNewUser = false;
  if (user) {
    // Backfill firebase_uid / phone / provider on existing user if missing.
    const updates: string[] = [];
    const params: any[] = [];
    if (!user.firebase_uid && firebaseUid) {
      params.push(firebaseUid);
      updates.push(`firebase_uid = $${params.length}`);
    }
    if (!user.phone && phone) {
      params.push(phone);
      updates.push(`phone = $${params.length}`);
    }
    if (user.provider == null || user.provider === 'email') {
      params.push(phone ? 'phone' : 'firebase');
      updates.push(`provider = $${params.length}`);
    }
    if (updates.length) {
      params.push(user.id);
      await query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params
      );
    }
  } else {
    isNewUser = true;
    // Create a new user. Email uniqueness — synthesize one if absent.
    const placeholderEmail =
      email ||
      `firebase+${firebaseUid}@users.leadhangover.local`;
    const placeholderHash = await bcrypt.hash(uuidv4(), 10);
    user = await queryOne<any>(
      `INSERT INTO users (email, password_hash, name, phone, firebase_uid, provider, role)
       VALUES ($1, $2, $3, $4, $5, $6, 'user')
       RETURNING *`,
      [
        placeholderEmail,
        placeholderHash,
        displayName,
        phone,
        firebaseUid,
        phone ? 'phone' : 'firebase',
      ]
    );
    try {
      await grantTokens({
        userId: user.id,
        amount: 10,
        source: 'promo',
        idempotencyKey: `signup-welcome:${user.id}`,
      });
    } catch (err) {
      logger.warn({ err }, 'failed to grant welcome tokens for firebase signup');
    }
    try {
      await audit({
        actorId: user.id,
        action: 'user.signup.firebase',
        targetType: 'user',
        targetId: user.id,
        ip: req.ip || undefined,
      });
    } catch (err) {
      logger.warn({ err }, 'audit failed for firebase signup');
    }
  }

  const jti = await createSession(user.id, req.ip, req.get('user-agent') || undefined);
  await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, jti },
    config.jwtSecret,
    { expiresIn: '30d' }
  );

  const needsOnboarding = !user.onboarding_completed_at;
  res.status(isNewUser ? 201 : 200).json({
    token,
    needs_onboarding: needsOnboarding,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar_url: user.avatar_url || null,
      onboarding_completed_at: user.onboarding_completed_at || null,
      needs_onboarding: needsOnboarding,
    },
  });
});

export default router;
