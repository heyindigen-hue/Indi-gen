import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { query, queryOne, transaction } from '../db/client';
import { config } from '../config';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';
import { grantTokens } from '../services/tokens';
import { getSetting, setSetting } from '../db/settings';
import { logger } from '../logger';

const router = Router();

// Stats
router.get('/stats', async (_req, res) => {
  const [mrr, dau, leadsToday, scrapeToday, topUsers] = await Promise.all([
    query(`SELECT COALESCE(SUM(p.price_monthly),0) AS mrr FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.status='active'`),
    query(`SELECT COUNT(DISTINCT user_id)::int AS dau FROM active_sessions WHERE created_at > NOW()-INTERVAL '24h' AND revoked_at IS NULL`),
    query(`SELECT COUNT(*)::int AS count FROM leads WHERE created_at > NOW()-INTERVAL '24h'`),
    query(`SELECT COUNT(*)::int AS count FROM scrape_jobs WHERE created_at > NOW()-INTERVAL '24h'`),
    query(`SELECT u.id, u.email, COUNT(l.id) AS lead_count FROM users u LEFT JOIN leads l ON l.owner_id=u.id GROUP BY u.id ORDER BY lead_count DESC LIMIT 5`),
  ]);
  res.json({
    mrr: parseFloat(mrr[0]?.mrr || '0'),
    dau: dau[0]?.dau || 0,
    leadsToday: leadsToday[0]?.count || 0,
    scrapeJobsToday: scrapeToday[0]?.count || 0,
    topUsers,
  });
});

// Users
router.get('/users', async (req, res) => {
  const { q, limit = '50', offset = '0' } = req.query;
  const conditions = ['deleted_at IS NULL'];
  const params: any[] = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(email ILIKE $${params.length} OR name ILIKE $${params.length})`);
  }
  const where = conditions.join(' AND ');
  params.push(parseInt(limit as string), parseInt(offset as string));
  const users = await query(
    `SELECT id, email, name, role, created_at, last_login_at, is_active FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(users);
});

router.get('/users/:id', async (req, res) => {
  const user = await queryOne<any>(`SELECT * FROM users WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const [subs, tokenBalance, outreach] = await Promise.all([
    query(`SELECT s.*, p.name AS plan_name FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.user_id=$1`, [req.params.id]),
    query(`SELECT COALESCE(SUM(delta),0)::bigint AS balance FROM token_transactions WHERE user_id=$1`, [req.params.id]),
    query(`SELECT COUNT(*)::int AS count FROM outreach_logs WHERE user_id=$1`, [req.params.id]),
  ]);
  delete user.password_hash;
  res.json({ ...user, subscriptions: subs, tokenBalance: parseInt(tokenBalance[0]?.balance || '0'), outreachCount: outreach[0]?.count || 0 });
});

router.post('/users/:id/impersonate', async (req: any, res) => {
  const target = await queryOne<any>(`SELECT id, email, role FROM users WHERE id=$1 AND deleted_at IS NULL`, [req.params.id]);
  if (!target) return res.status(404).json({ error: 'User not found' });
  const token = jwt.sign({ id: target.id, email: target.email, role: target.role, impersonatedBy: req.user.id }, config.jwtSecret, { expiresIn: '30m' });
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.impersonate', targetType: 'user', targetId: target.id });
  res.json({ token, expiresIn: '30m' });
});

const grantSchema = z.object({ amount: z.number().int().positive(), reason: z.string().min(1) });
router.post('/users/:id/grant-tokens', validateBody(grantSchema), async (req: any, res) => {
  const { amount, reason } = req.body;
  await grantTokens({ userId: req.params.id, amount, source: 'admin_grant', idempotencyKey: `admin:grant:${req.user.id}:${req.params.id}:${Date.now()}` });
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.grant_tokens', targetType: 'user', targetId: req.params.id, after: { amount, reason } });
  res.json({ ok: true });
});

router.delete('/users/:id', async (req: any, res) => {
  await query(`UPDATE users SET deleted_at=NOW(), updated_at=NOW() WHERE id=$1`, [req.params.id]);
  await query(`INSERT INTO erasure_requests (user_id, requested_by, status) VALUES ($1,$2,'pending') ON CONFLICT DO NOTHING`, [req.params.id, req.user.id]);
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.delete_user', targetType: 'user', targetId: req.params.id });
  res.json({ ok: true });
});

// Audit
router.get('/audit', async (req, res) => {
  const { actor, action, limit = '50', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (actor) { params.push(actor); conditions.push(`actor_id=$${params.length}`); }
  if (action) { params.push(`%${action}%`); conditions.push(`action ILIKE $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

// Webhooks
router.get('/webhooks', async (req, res) => {
  const { provider, limit = '50', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (provider) { params.push(provider); conditions.push(`provider=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT * FROM webhooks_log ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

router.post('/webhooks/:id/replay', async (req: any, res) => {
  const wh = await queryOne<any>(`SELECT * FROM webhooks_log WHERE id=$1`, [req.params.id]);
  if (!wh) return res.status(404).json({ error: 'Webhook log not found' });
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.webhook_replay', targetType: 'webhook', targetId: req.params.id });
  res.json({ ok: true, message: 'Replay queued (manual processing required)' });
});

// Alerts
router.get('/alerts', async (req, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const rows = await query(
    `SELECT * FROM system_alerts WHERE acked_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

router.post('/alerts/:id/ack', async (req: any, res) => {
  await query(`UPDATE system_alerts SET acked_at=NOW(), acked_by=$1 WHERE id=$2`, [req.user.id, req.params.id]);
  res.json({ ok: true });
});

// Errors
router.get('/errors/groups', async (req, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const rows = await query(
    `SELECT * FROM error_groups WHERE resolved_at IS NULL ORDER BY last_seen DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

router.post('/errors/groups/:id/resolve', async (req: any, res) => {
  await query(`UPDATE error_groups SET resolved_at=NOW(), resolved_by=$1 WHERE id=$2`, [req.user.id, req.params.id]);
  res.json({ ok: true });
});

// Settings
router.get('/settings', async (_req, res) => {
  const rows = await query(`SELECT key, value, is_secret, updated_at FROM app_settings ORDER BY key ASC`);
  res.json(rows.map(r => ({ ...r, value: r.is_secret ? '***' : r.value })));
});

const settingSchema = z.object({ value: z.string() });
router.put('/settings/:key', validateBody(settingSchema), async (req: any, res) => {
  await setSetting(req.params.key, req.body.value, req.user.id);
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.setting_update', targetType: 'setting', targetId: req.params.key });
  res.json({ ok: true });
});

router.get('/settings/secret/:key', async (req: any, res) => {
  const row = await queryOne<any>(`SELECT value, is_secret FROM app_settings WHERE key=$1`, [req.params.key]);
  if (!row) return res.status(404).json({ error: 'Setting not found' });
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.secret_view', targetType: 'setting', targetId: req.params.key });
  res.json({ key: req.params.key, value: row.value });
});

// Feature flags
router.get('/feature_flags', async (_req, res) => {
  const rows = await query(`SELECT * FROM feature_flags ORDER BY key ASC`);
  res.json(rows);
});

const flagSchema = z.object({ key: z.string().min(1), value: z.any(), description: z.string().optional() });
router.post('/feature_flags', validateBody(flagSchema), async (req: any, res) => {
  const flag = await queryOne<any>(
    `INSERT INTO feature_flags (key, value, description, created_by) VALUES ($1,$2,$3,$4) RETURNING *`,
    [req.body.key, JSON.stringify(req.body.value), req.body.description || null, req.user.id]
  );
  res.status(201).json(flag);
});

router.patch('/feature_flags/:id', async (req: any, res) => {
  const { value, description } = req.body;
  const updates: string[] = [];
  const params: any[] = [];
  if (value !== undefined) { params.push(JSON.stringify(value)); updates.push(`value=$${params.length}`); }
  if (description !== undefined) { params.push(description); updates.push(`description=$${params.length}`); }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  await query(`UPDATE feature_flags SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length}`, params);
  res.json({ ok: true });
});

router.delete('/feature_flags/:id', async (req: any, res) => {
  await query(`DELETE FROM feature_flags WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

router.post('/feature_flags/:id/toggle', async (req: any, res) => {
  const flag = await queryOne<any>(`SELECT id, value FROM feature_flags WHERE id=$1`, [req.params.id]);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  const current = typeof flag.value === 'boolean' ? flag.value : flag.value === 'true';
  await query(`UPDATE feature_flags SET value=$1, updated_at=NOW() WHERE id=$2`, [JSON.stringify(!current), req.params.id]);
  res.json({ ok: true, enabled: !current });
});

// Approvals
router.get('/approvals', async (req, res) => {
  const rows = await query(
    `SELECT * FROM approval_queue WHERE status='pending' ORDER BY created_at ASC LIMIT 50`
  );
  res.json(rows);
});

const approvalActionSchema = z.object({ note: z.string().optional() });
router.post('/approvals/:id/approve', validateBody(approvalActionSchema), async (req: any, res) => {
  await query(
    `UPDATE approval_queue SET status='approved', reviewed_by=$1, reviewed_at=NOW(), note=$2 WHERE id=$3`,
    [req.user.id, req.body.note || null, req.params.id]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.approval_approve', targetType: 'approval', targetId: req.params.id });
  res.json({ ok: true });
});

router.post('/approvals/:id/reject', validateBody(approvalActionSchema), async (req: any, res) => {
  await query(
    `UPDATE approval_queue SET status='rejected', reviewed_by=$1, reviewed_at=NOW(), note=$2 WHERE id=$3`,
    [req.user.id, req.body.note || null, req.params.id]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.approval_reject', targetType: 'approval', targetId: req.params.id });
  res.json({ ok: true });
});

// SQL playground (read-only)
router.get('/sql/preview', async (req, res) => {
  const { sql } = req.query;
  if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'sql query param required' });
  const normalized = sql.trim().toUpperCase();
  if (!normalized.startsWith('SELECT') && !normalized.startsWith('WITH')) {
    return res.status(400).json({ error: 'Only SELECT and WITH queries are allowed' });
  }
  try {
    const rows = await query(`SET LOCAL statement_timeout = '30s'; ${sql} LIMIT 10000`);
    res.json({ rows: rows.slice(0, 10000), count: rows.length });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
