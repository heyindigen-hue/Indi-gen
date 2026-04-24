import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';

const router = Router();

// User consent — schema: user_id, purpose, action, policy_version, ip_address, user_agent, created_at
const consentSchema = z.object({
  purpose: z.string().min(1),
  granted: z.boolean(),
});

router.post('/consent', validateBody(consentSchema), async (req: any, res) => {
  const { purpose, granted } = req.body;
  const action = granted ? 'grant' : 'withdraw';
  await query(
    `INSERT INTO consent_records (user_id, purpose, action) VALUES ($1,$2,$3)`,
    [req.user.id, purpose, action]
  );
  await audit({ actorId: req.user.id, action: granted ? 'dpdp.consent_grant' : 'dpdp.consent_withdraw', targetType: 'consent', targetId: purpose });
  res.status(201).json({ ok: true });
});

// Erasure request (user-initiated)
router.post('/erasure-request', async (req: any, res) => {
  const existing = await queryOne<any>(
    `SELECT id FROM erasure_requests WHERE user_id=$1 AND status IN ('pending','approved')`,
    [req.user.id]
  );
  if (existing) return res.status(409).json({ error: 'An erasure request is already in progress' });

  const row = await queryOne<any>(
    `INSERT INTO erasure_requests (user_id, status) VALUES ($1,'pending') RETURNING id`,
    [req.user.id]
  );
  await audit({ actorId: req.user.id, action: 'dpdp.erasure_request', targetType: 'user', targetId: req.user.id });
  res.status(201).json({ requestId: row.id, status: 'pending' });
});

// Data export — leads columns: name, company, headline, status; no deleted_at on leads
router.get('/data-export', async (req: any, res) => {
  const [user, leads, outreach, tokens, consents] = await Promise.all([
    queryOne<any>(`SELECT id, email, name, phone, created_at, last_login_at FROM users WHERE id=$1`, [req.user.id]),
    query(`SELECT id, name, company, headline, status, created_at FROM leads WHERE owner_id=$1`, [req.user.id]),
    query(`SELECT id, channel, sent_at FROM outreach_log WHERE user_id=$1 ORDER BY sent_at DESC LIMIT 500`, [req.user.id]),
    query(`SELECT delta, kind, reason, created_at FROM token_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 500`, [req.user.id]),
    query(`SELECT purpose, action, created_at FROM consent_records WHERE user_id=$1`, [req.user.id]),
  ]);
  await audit({ actorId: req.user.id, action: 'dpdp.data_export', targetType: 'user', targetId: req.user.id });
  res.json({ user, leads, outreach, tokens, consents, exportedAt: new Date().toISOString() });
});

// Admin: erasure requests
router.get('/erasure-requests', async (req, res) => {
  const { status, limit = '50', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (status) { params.push(status); conditions.push(`er.status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT er.*, u.email FROM erasure_requests er JOIN users u ON u.id=er.user_id
     ${where} ORDER BY er.requested_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

router.post('/erasure-requests/:id/verify', async (req: any, res) => {
  await query(
    `UPDATE erasure_requests SET status='verified', processed_at=NOW() WHERE id=$1`,
    [req.params.id]
  );
  res.json({ ok: true });
});

router.post('/erasure-requests/:id/preview', async (req, res) => {
  const req_ = await queryOne<any>(`SELECT user_id FROM erasure_requests WHERE id=$1`, [req.params.id]);
  if (!req_) return res.status(404).json({ error: 'Request not found' });

  const tables = ['leads', 'outreach_log', 'token_transactions', 'active_sessions', 'login_attempts', 'scraper_runs', 'audit_log', 'consent_records'];
  const counts: Record<string, number> = {};

  for (const table of tables) {
    const userCol = table === 'audit_log' ? 'actor_id' : 'user_id';
    try {
      const rows = await query(`SELECT COUNT(*)::int AS c FROM ${table} WHERE ${userCol}=$1`, [req_.user_id]);
      counts[table] = rows[0]?.c || 0;
    } catch {
      counts[table] = -1;
    }
  }
  counts['users'] = 1;

  res.json({ userId: req_.user_id, tableCounts: counts });
});

router.post('/erasure-requests/:id/approve', async (req: any, res) => {
  const erasureReq = await queryOne<any>(`SELECT * FROM erasure_requests WHERE id=$1 AND status='pending'`, [req.params.id]);
  if (!erasureReq) return res.status(404).json({ error: 'Pending request not found' });

  await query(
    `UPDATE erasure_requests SET status='approved', processed_at=NOW() WHERE id=$1`,
    [req.params.id]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'dpdp.erasure_approve', targetType: 'user', targetId: erasureReq.user_id });
  res.json({ ok: true });
});

// Breach management — table: breach_log
// schema: discovered_at, severity, data_categories, affected_users_count, description, mitigation, status, created_by
router.get('/breach', async (req, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const rows = await query(
    `SELECT * FROM breach_log ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

const breachSchema = z.object({
  description: z.string().min(1),
  mitigation: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  affected_users_count: z.number().int().min(0).optional(),
  discovered_at: z.string().optional(),
});

router.post('/breach', validateBody(breachSchema), async (req: any, res) => {
  const { description, mitigation, severity, affected_users_count, discovered_at } = req.body;
  const row = await queryOne<any>(
    `INSERT INTO breach_log (description, mitigation, severity, affected_users_count, discovered_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [description, mitigation || null, severity, affected_users_count || 0, discovered_at ? new Date(discovered_at) : new Date(), req.user.id]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'dpdp.breach_create', targetType: 'breach', targetId: row.id });
  res.status(201).json(row);
});

router.patch('/breach/:id', async (req: any, res) => {
  const { description, mitigation, severity, affected_users_count, status } = req.body;
  const updates: string[] = [];
  const params: any[] = [];
  if (description !== undefined) { params.push(description); updates.push(`description=$${params.length}`); }
  if (mitigation !== undefined) { params.push(mitigation); updates.push(`mitigation=$${params.length}`); }
  if (severity !== undefined) { params.push(severity); updates.push(`severity=$${params.length}`); }
  if (affected_users_count !== undefined) { params.push(affected_users_count); updates.push(`affected_users_count=$${params.length}`); }
  if (status !== undefined) { params.push(status); updates.push(`status=$${params.length}`); }
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  params.push(req.params.id);
  const row = await queryOne<any>(
    `UPDATE breach_log SET ${updates.join(',')} WHERE id=$${params.length} RETURNING *`,
    params
  );
  if (!row) return res.status(404).json({ error: 'Breach record not found' });
  res.json(row);
});

router.post('/breach/:id/report-pdf', async (req: any, res) => {
  const breach = await queryOne<any>(`SELECT * FROM breach_log WHERE id=$1`, [req.params.id]);
  if (!breach) return res.status(404).json({ error: 'Breach not found' });
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'dpdp.breach_pdf_generate', targetType: 'breach', targetId: req.params.id });
  res.json({ ok: true, message: 'PDF generation queued (DPB report generation will be implemented in a future task)', breachId: req.params.id });
});

export default router;
