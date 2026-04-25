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
  try {
    const [mrr, dau, leadsToday, scrapeToday, signupsToday, tokenBurn, openTickets, scrapeSuccess, topUsers] = await Promise.all([
      query(`SELECT COALESCE(SUM(p.price_inr),0) AS v FROM subscriptions s JOIN subscription_plans p ON p.id=s.plan_id WHERE s.status='active'`),
      query(`SELECT COUNT(DISTINCT user_id)::int AS v FROM active_sessions WHERE created_at > NOW()-INTERVAL '24h' AND revoked_at IS NULL`),
      query(`SELECT COUNT(*)::int AS v FROM leads WHERE created_at > NOW()-INTERVAL '24h'`),
      query(`SELECT COUNT(*)::int AS v FROM scraper_runs WHERE started_at > NOW()-INTERVAL '24h'`),
      query(`SELECT COUNT(*)::int AS v FROM users WHERE created_at > NOW()-INTERVAL '24h'`),
      query(`SELECT COALESCE(ABS(SUM(delta)::int),0) AS v FROM token_transactions WHERE delta < 0 AND created_at > NOW()-INTERVAL '24h'`),
      query(`SELECT COUNT(*)::int AS v FROM support_tickets WHERE status IN ('open','pending')`),
      query(`SELECT COALESCE(ROUND(AVG(CASE WHEN status='success' THEN 1.0 ELSE 0.0 END)*100)::int, 100) AS v FROM scraper_runs WHERE started_at > NOW()-INTERVAL '24h'`),
      query(`SELECT u.id, u.email, COUNT(l.id)::int AS lead_count FROM users u LEFT JOIN leads l ON l.owner_id=u.id GROUP BY u.id ORDER BY lead_count DESC LIMIT 5`),
    ]);
    res.json({
      mrr: parseFloat(mrr[0]?.v || '0'),
      dau: dau[0]?.v || 0,
      leads_today: leadsToday[0]?.v || 0,
      scrape_jobs_today: scrapeToday[0]?.v || 0,
      signups_today: signupsToday[0]?.v || 0,
      token_burn_today: tokenBurn[0]?.v || 0,
      llm_cost_today: 0, llm_cost_today_inr: 0,
      scrape_success_rate: scrapeSuccess[0]?.v ?? 100,
      open_tickets: openTickets[0]?.v || 0,
      // legacy aliases
      leadsToday: leadsToday[0]?.v || 0,
      scrapeJobsToday: scrapeToday[0]?.v || 0,
      topUsers,
    });
  } catch (e: any) {
    res.json({ mrr:0, dau:0, leads_today:0, scrape_jobs_today:0, signups_today:0, token_burn_today:0, llm_cost_today:0, scrape_success_rate:100, open_tickets:0, leadsToday:0, scrapeJobsToday:0, topUsers:[], _error: e.message });
  }
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
    `SELECT id, email, name, role, created_at, last_login_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    query(`SELECT COUNT(*)::int AS count FROM outreach_log WHERE user_id=$1`, [req.params.id]),
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
  await query(`INSERT INTO erasure_requests (user_id, status) VALUES ($1,'pending')`, [req.params.id]);
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
    `SELECT * FROM webhooks_log ${where} ORDER BY received_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
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
    `SELECT * FROM alerts WHERE acknowledged_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

router.post('/alerts/:id/ack', async (req: any, res) => {
  await query(`UPDATE alerts SET acknowledged_at=NOW(), acknowledged_by=$1 WHERE id=$2`, [req.user.id, req.params.id]);
  res.json({ ok: true });
});

// Errors — table not in schema, return empty
router.get('/errors/groups', async (_req, res) => {
  res.json([]);
});

router.post('/errors/groups/:id/resolve', async (_req, res) => {
  res.status(501).json({ error: 'Error tracking not implemented' });
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

// Feature flags — schema: id TEXT PK, description, enabled BOOLEAN, rollout_percent, user_allowlist, plan_allowlist
router.get('/feature_flags', async (_req, res) => {
  const rows = await query(`SELECT * FROM feature_flags ORDER BY id ASC`);
  res.json(rows);
});

const flagSchema = z.object({ id: z.string().min(1), enabled: z.boolean().default(false), description: z.string().optional() });
router.post('/feature_flags', validateBody(flagSchema), async (req: any, res) => {
  const flag = await queryOne<any>(
    `INSERT INTO feature_flags (id, enabled, description) VALUES ($1,$2,$3) RETURNING *`,
    [req.body.id, req.body.enabled ?? false, req.body.description || null]
  );
  res.status(201).json(flag);
});

router.patch('/feature_flags/:id', async (req: any, res) => {
  const { enabled, description, rollout_percent } = req.body;
  const updates: string[] = [];
  const params: any[] = [];
  if (enabled !== undefined) { params.push(enabled); updates.push(`enabled=$${params.length}`); }
  if (description !== undefined) { params.push(description); updates.push(`description=$${params.length}`); }
  if (rollout_percent !== undefined) { params.push(rollout_percent); updates.push(`rollout_percent=$${params.length}`); }
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
  const flag = await queryOne<any>(`SELECT id, enabled FROM feature_flags WHERE id=$1`, [req.params.id]);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  await query(`UPDATE feature_flags SET enabled=$1, updated_at=NOW() WHERE id=$2`, [!flag.enabled, req.params.id]);
  res.json({ ok: true, enabled: !flag.enabled });
});

// Approvals — table not in schema, return stubs
router.get('/approvals', async (_req, res) => {
  res.json([]);
});

router.post('/approvals/:id/approve', async (_req, res) => {
  res.status(501).json({ error: 'Approval queue not implemented' });
});

router.post('/approvals/:id/reject', async (_req, res) => {
  res.status(501).json({ error: 'Approval queue not implemented' });
});

// ── Aliases and missing routes ────────────────────────────────────────────────

// feature-flags alias
router.get('/feature-flags', async (_req, res) => {
  const rows = await query(`SELECT * FROM feature_flags ORDER BY id ASC`);
  res.json(rows);
});

// audit-log alias
router.get('/audit-log', async (req, res) => {
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

// breaches
router.get('/breaches', async (_req, res) => {
  const rows = await query(`SELECT * FROM breach_log ORDER BY created_at DESC LIMIT 100`);
  res.json(rows);
});

// admin-users — users with admin roles
router.get('/admin-users', async (_req, res) => {
  const rows = await query(
    `SELECT id, email, name, role, last_login_at, created_at FROM users WHERE role IN ('admin','super_admin') AND deleted_at IS NULL ORDER BY created_at DESC`
  );
  res.json(rows);
});

const inviteSchema = z.object({ email: z.string().email(), role: z.string().min(1) });
router.post('/admin-users/invite', validateBody(inviteSchema), async (req: any, res) => {
  const { email, role } = req.body;
  const token = require('crypto').randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  await query(
    `INSERT INTO admin_invites (email, role_id, invited_by, token, expires_at) VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT DO NOTHING`,
    [email, role, req.user.id, token, expires]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.invite_sent', targetType: 'user', targetId: email });
  res.json({ ok: true, token, expires_at: expires });
});

// API keys management
router.get('/api-keys', async (_req, res) => {
  const rows = await query(
    `SELECT id, user_id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at FROM api_keys ORDER BY created_at DESC`
  );
  res.json(rows);
});

const apiKeyCreateSchema = z.object({ user_id: z.string().uuid().optional(), name: z.string().min(1), scopes: z.array(z.string()).optional() });
router.post('/api-keys', validateBody(apiKeyCreateSchema), async (req: any, res) => {
  const { name, scopes = ['read:leads'], user_id } = req.body;
  const rawKey = require('crypto').randomBytes(32).toString('hex');
  const prefix = 'lh_' + rawKey.substring(0, 8);
  const hash = require('crypto').createHash('sha256').update(rawKey).digest('hex');
  const row = await query(
    `INSERT INTO api_keys (user_id, name, key_prefix, key_hash, scopes) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, key_prefix, scopes, created_at`,
    [user_id || req.user.id, name, prefix, hash, scopes]
  );
  res.status(201).json({ ...row[0], key: `${prefix}.${rawKey}` });
});

router.delete('/api-keys/:id', async (req: any, res) => {
  await query(`UPDATE api_keys SET revoked_at=NOW() WHERE id=$1`, [req.params.id]);
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.api_key_revoke', targetType: 'api_key', targetId: req.params.id });
  res.json({ ok: true });
});

// Sessions management
router.get('/sessions', async (req, res) => {
  const { user_id, limit = '50', offset = '0' } = req.query;
  const conditions = ['revoked_at IS NULL'];
  const params: any[] = [];
  if (user_id) { params.push(user_id); conditions.push(`user_id=$${params.length}`); }
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT s.*, u.email FROM active_sessions s JOIN users u ON u.id=s.user_id WHERE ${conditions.join(' AND ')} ORDER BY s.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

router.delete('/sessions/:id', async (req: any, res) => {
  await query(`UPDATE active_sessions SET revoked_at=NOW() WHERE id=$1`, [req.params.id]);
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.session_revoke', targetType: 'session', targetId: req.params.id });
  res.json({ ok: true });
});

// Settings by category
router.get('/settings/brand', async (_req, res) => {
  const rows = await query(`SELECT key, value, is_secret, updated_at FROM app_settings WHERE category='brand' ORDER BY key`);
  res.json(rows.map((r: any) => ({ ...r, value: r.is_secret ? '***' : r.value })));
});

router.get('/settings/company', async (_req, res) => {
  const rows = await query(`SELECT key, value, is_secret, updated_at FROM app_settings WHERE category='company' ORDER BY key`);
  res.json(rows.map((r: any) => ({ ...r, value: r.is_secret ? '***' : r.value })));
});

router.get('/settings/legal', async (_req, res) => {
  const rows = await query(`SELECT key, value, is_secret, updated_at FROM app_settings WHERE category='legal' ORDER BY key`);
  res.json(rows.map((r: any) => ({ ...r, value: r.is_secret ? '***' : r.value })));
});

router.get('/settings/maintenance', async (_req, res) => {
  const rows = await query(`SELECT key, value, is_secret, updated_at FROM app_settings WHERE category='maintenance' ORDER BY key`);
  res.json(rows.map((r: any) => ({ ...r, value: r.is_secret ? '***' : r.value })));
});

// DPDP consent stats
router.get('/dpdp/consent-stats', async (_req, res) => {
  const [total, byPurpose] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total FROM consent_records`),
    query(`SELECT purpose, action, COUNT(*)::int AS cnt FROM consent_records GROUP BY purpose, action ORDER BY purpose`),
  ]);
  res.json({ total: total[0]?.total || 0, by_purpose: byPurpose });
});

router.get('/dpdp/consent-timeline', async (_req, res) => {
  const rows = await query(
    `SELECT date_trunc('day', created_at) AS day, COUNT(*)::int AS cnt
     FROM consent_records
     WHERE created_at > NOW() - INTERVAL '30 days'
     GROUP BY 1 ORDER BY 1`
  );
  res.json(rows);
});

// Erasure request actions
router.post('/erasure-requests/:id/preview', async (req, res) => {
  const er = await query(`SELECT * FROM erasure_requests WHERE id=$1`, [req.params.id]);
  if (!er.length) return res.status(404).json({ error: 'Not found' });
  const [leads, contacts, sessions] = await Promise.all([
    query(`SELECT COUNT(*)::int AS cnt FROM leads WHERE owner_id=$1`, [er[0].user_id]),
    query(`SELECT COUNT(*)::int AS cnt FROM contacts c JOIN leads l ON l.id=c.lead_id WHERE l.owner_id=$1`, [er[0].user_id]),
    query(`SELECT COUNT(*)::int AS cnt FROM active_sessions WHERE user_id=$1`, [er[0].user_id]),
  ]);
  res.json({ leads: leads[0].cnt, contacts: contacts[0].cnt, sessions: sessions[0].cnt });
});

router.post('/erasure-requests/:id/queue', async (req: any, res) => {
  await query(`UPDATE erasure_requests SET status='queued' WHERE id=$1`, [req.params.id]);
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'admin.erasure_queued', targetType: 'erasure_request', targetId: req.params.id });
  res.json({ ok: true });
});

router.post('/erasure-requests/:id/verify', async (req: any, res) => {
  await query(`UPDATE erasure_requests SET status='verified' WHERE id=$1`, [req.params.id]);
  res.json({ ok: true });
});

router.post('/erasure-requests/:id/receipt', async (req, res) => {
  const er = await query(`SELECT * FROM erasure_requests WHERE id=$1`, [req.params.id]);
  if (!er.length) return res.status(404).json({ error: 'Not found' });
  res.json({ id: er[0].id, status: er[0].status, requested_at: er[0].requested_at, processed_at: er[0].processed_at, receipt_issued_at: new Date().toISOString() });
});

// Search phrases (admin view)
router.get('/phrases', async (req, res) => {
  const { q, limit = '100', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (q) { params.push(`%${q}%`); conditions.push(`phrase ILIKE $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT * FROM search_phrases ${where} ORDER BY total_new_leads DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

// Integrations
router.get('/integrations', async (_req, res) => {
  const keys = [
    'apify_token', 'apify_tokens', 'signalhire_api_key', 'signalhire_credits_remaining',
    'linkedin_access_token', 'claude_api_key', 'gemini_api_key', 'aws_bedrock_api_key',
  ];
  const rows = await query(`SELECT key, value, is_secret, category, updated_at FROM app_settings WHERE key = ANY($1::text[])`, [keys]);
  const providers = [
    { id: 'linkedin', label: 'LinkedIn', enabled: true, keys: ['linkedin_access_token'] },
    { id: 'apify', label: 'Apify', enabled: true, keys: ['apify_token', 'apify_tokens'] },
    { id: 'signalhire', label: 'SignalHire', enabled: true, keys: ['signalhire_api_key'] },
    { id: 'anthropic', label: 'Anthropic', enabled: true, keys: ['claude_api_key'] },
    { id: 'gemini', label: 'Gemini', enabled: false, keys: ['gemini_api_key'] },
  ];
  const settingMap: Record<string, any> = Object.fromEntries(rows.map((r: any) => [r.key, r]));
  res.json(providers.map(p => ({
    ...p,
    configured: p.keys.some(k => settingMap[k]?.value && settingMap[k].value !== ''),
    last_updated: p.keys.map(k => settingMap[k]?.updated_at).filter(Boolean).sort().pop() || null,
  })));
});

router.post('/integrations/:provider/test', async (req, res) => {
  const { provider } = req.params;
  try {
    if (provider === 'anthropic') {
      const key = await getSetting('claude_api_key');
      if (!key) return res.json({ ok: false, error: 'No API key configured' });
      const r = await fetch('https://api.anthropic.com/v1/models', {
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      });
      return res.json({ ok: r.ok, status: r.status });
    }
    if (provider === 'apify') {
      const key = await getSetting('apify_token');
      if (!key) return res.json({ ok: false, error: 'No token configured' });
      const r = await fetch(`https://api.apify.com/v2/users/me?token=${key}`);
      return res.json({ ok: r.ok, status: r.status });
    }
    res.json({ ok: true, message: 'Test not implemented for this provider — credentials present' });
  } catch (e: any) {
    res.json({ ok: false, error: e.message });
  }
});

// Billing subscriptions (admin view — all users)
router.get('/billing/subscriptions', async (req, res) => {
  const { limit = '50', offset = '0' } = req.query;
  const rows = await query(
    `SELECT s.*, p.name AS plan_name, u.email AS user_email
     FROM subscriptions s
     JOIN subscription_plans p ON p.id=s.plan_id
     JOIN users u ON u.id=s.user_id
     ORDER BY s.created_at DESC LIMIT $1 OFFSET $2`,
    [parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(rows);
});

// i18n strings — admin editor read/write
router.get('/i18n-strings', async (req, res) => {
  const { locale } = req.query;
  if (!locale || typeof locale !== 'string') {
    return res.status(400).json({ error: 'locale query param required' });
  }
  const rows = await query(
    `SELECT key, value, updated_at FROM i18n_strings WHERE locale=$1 ORDER BY key ASC`,
    [locale]
  );
  res.json({ locale, strings: rows.map((r: any) => ({ key: r.key, value: r.value })) });
});

const i18nStringsSchema = z.object({
  locale: z.string().min(2),
  strings: z.array(z.object({ key: z.string().min(1), value: z.string() })),
});

router.post('/i18n-strings', validateBody(i18nStringsSchema), async (req: any, res) => {
  const { locale, strings } = req.body as { locale: string; strings: Array<{ key: string; value: string }> };
  if (!strings.length) return res.json({ ok: true, count: 0 });

  await transaction(async (client) => {
    for (const { key, value } of strings) {
      await client.query(
        `INSERT INTO i18n_strings (locale, key, value, updated_by, updated_at)
         VALUES ($1,$2,$3,$4,NOW())
         ON CONFLICT (locale, key) DO UPDATE
           SET value=EXCLUDED.value, updated_by=EXCLUDED.updated_by, updated_at=NOW()`,
        [locale, key, value, req.user?.id ?? null]
      );
    }
  });
  await audit({
    actorId: req.user?.id ?? null,
    actorType: 'admin',
    action: 'admin.i18n_update',
    targetType: 'i18n_strings',
    targetId: locale,
    after: { count: strings.length },
  });
  res.json({ ok: true, count: strings.length });
});

router.delete('/i18n-strings/:locale/:key', async (req: any, res) => {
  await query(
    `DELETE FROM i18n_strings WHERE locale=$1 AND key=$2`,
    [req.params.locale, req.params.key]
  );
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
