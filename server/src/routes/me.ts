import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query, queryOne } from '../db/client';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';
import { sendPushNotification } from '../services/push';

const router = Router();

// ── Profile ──────────────────────────────────────────────────────────────────

const patchMeSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

router.patch('/profile', validateBody(patchMeSchema), async (req: any, res) => {
  const { name, phone, avatar_url } = req.body;
  const updates: string[] = [];
  const params: any[] = [];

  if (name !== undefined) { params.push(name); updates.push(`name=$${params.length}`); }
  if (phone !== undefined) { params.push(phone); updates.push(`phone=$${params.length}`); }
  if (avatar_url !== undefined) { params.push(avatar_url); updates.push(`avatar_url=$${params.length}`); }

  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

  params.push(req.user.id);
  const user = await queryOne<any>(
    `UPDATE users SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${params.length} RETURNING id, email, name, phone, avatar_url`,
    params
  );
  res.json(user);
});

// ── Password ──────────────────────────────────────────────────────────────────

const changePasswordSchema = z.object({
  current: z.string().min(1),
  next: z.string().min(8),
});

router.post('/change-password', validateBody(changePasswordSchema), async (req: any, res) => {
  const user = await queryOne<any>(`SELECT password_hash FROM users WHERE id=$1`, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = await bcrypt.compare(req.body.current, user.password_hash);
  if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(req.body.next, 10);
  await query(`UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2`, [hash, req.user.id]);
  await query(`UPDATE active_sessions SET revoked_at=NOW() WHERE user_id=$1 AND jti!=$2`, [req.user.id, req.user.jti ?? '']);
  await audit({ actorId: req.user.id, action: 'user.password_change', targetType: 'user', targetId: req.user.id });
  res.json({ ok: true });
});

// ── Company profile ───────────────────────────────────────────────────────────

router.get('/company-profile', async (req: any, res) => {
  const user = await queryOne<any>(
    `SELECT company_name, company_data FROM users WHERE id=$1`,
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  const data = user.company_data ?? {};
  res.json({ ...data, name: data.name ?? user.company_name ?? '' });
});

// ── Customer onboarding (PATCH alias used by customer/src/pages/Onboarding.tsx) ─

const onboardingPatchSchema = z.object({
  company_name: z.string().min(1),
  tagline: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
  ideal_clients: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  geography: z.array(z.string()).optional(),
  search_phrases: z.array(z.string()).optional(),
  budget_signals: z.array(z.string()).optional(),
  plan: z.string().optional(),
});

router.patch('/onboarding', validateBody(onboardingPatchSchema), async (req: any, res) => {
  const { company_name, search_phrases = [], plan, ...rest } = req.body;
  const company_data = JSON.stringify({ ...rest, plan, search_phrases });
  await query(
    `UPDATE users SET company_name=$1, company_data=$2,
       onboarding_completed_at=COALESCE(onboarding_completed_at, NOW()),
       updated_at=NOW()
     WHERE id=$3`,
    [company_name, company_data, req.user.id]
  );
  for (const phrase of search_phrases) {
    if (typeof phrase === 'string' && phrase.trim()) {
      await query(
        `INSERT INTO search_phrases (phrase, user_id, enabled)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (phrase) DO UPDATE SET user_id=$2, enabled=TRUE`,
        [phrase.trim(), req.user.id]
      );
    }
  }
  const updated = await queryOne<any>(
    `SELECT id, email, name, phone, role, avatar_url, company_name, onboarding_completed_at FROM users WHERE id=$1`,
    [req.user.id]
  );
  res.json({ ...updated, needs_onboarding: !updated.onboarding_completed_at });
});

// ── Customer dashboard stats (token balance, leads this week, outreach, replies, plan) ──

router.get('/stats', async (req: any, res) => {
  try {
    const userId = req.user.id;
    const [tokRow, leadsWeekRow, outreachRow, repliesRow, subRow] = await Promise.all([
      queryOne<any>(`SELECT balance FROM user_token_balance WHERE user_id=$1`, [userId]).catch(() => null),
      queryOne<any>(`SELECT COUNT(*)::int AS n FROM leads WHERE owner_id=$1 AND created_at > NOW() - INTERVAL '7 days'`, [userId]),
      queryOne<any>(`SELECT COUNT(*)::int AS n FROM outreach_log WHERE user_id=$1 AND sent_at > NOW() - INTERVAL '7 days'`, [userId]).catch(() => ({ n: 0 })),
      queryOne<any>(`SELECT COUNT(*)::int AS n FROM outreach_log WHERE user_id=$1 AND sent_at > NOW() - INTERVAL '7 days' AND replied_at IS NOT NULL`, [userId]).catch(() => ({ n: 0 })),
      queryOne<any>(
        `SELECT s.status, p.name AS plan_name, s.next_renewal_at
           FROM subscriptions s LEFT JOIN subscription_plans p ON p.id=s.plan_id
          WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 1`,
        [userId]
      ).catch(() => null),
    ]);

    const outreachSent = outreachRow?.n || 0;
    const replies = repliesRow?.n || 0;
    const replyRate = outreachSent > 0 ? Math.round((replies / outreachSent) * 100) : 0;

    res.json({
      token_balance: tokRow?.balance ?? 0,
      leads_this_week: leadsWeekRow?.n ?? 0,
      outreach_sent: outreachSent,
      reply_rate: replyRate,
      subscription_status: subRow?.status ?? 'free',
      subscription_plan: subRow?.plan_name ?? 'Free',
      next_renewal: subRow?.next_renewal_at ?? null,
    });
  } catch (err: any) {
    res.json({
      token_balance: 0, leads_this_week: 0, outreach_sent: 0, reply_rate: 0,
      subscription_status: 'free', subscription_plan: 'Free', next_renewal: null,
    });
  }
});

// ── Analytics (Stats tab) ─────────────────────────────────────────────────────
// Vertical-list analytics: leads added (with delta), intent breakdown, ICP
// breakdown, funnel (scraped → kept → enriched → outreach → replied), outreach
// channel mix, score distribution, top-yielding phrases. Range: 7d|30d|90d.

router.get('/analytics', async (req: any, res) => {
  const userId = req.user.id;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const rangeKey = (req.query.range as string) || '7d';
  const days = rangeKey === '90d' ? 90 : rangeKey === '30d' ? 30 : 7;

  // Always pass days as $1 and (when non-admin) the user id as $2. The owner
  // clause references $2 — admin path drops it entirely. This keeps the param
  // indices uniform across all queries.
  const ownerLeads = isAdmin ? '' : ' AND owner_id = $2';
  const ownerOL    = isAdmin ? '' : ' AND user_id = $2';
  const ownerRuns  = isAdmin ? '' : ' AND user_id = $2';
  const baseArgs: any[] = isAdmin ? [days] : [days, userId];

  try {
    const [
      curLeads,
      prevLeads,
      intentRows,
      icpRows,
      scrapedRow,
      keptRow,
      enrichedRow,
      outreachSentRow,
      repliedRow,
      meetingsRow,
      channelRows,
      scoreRows,
      phraseRows,
    ] = await Promise.all([
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM leads
          WHERE created_at > NOW() - ($1 || ' days')::INTERVAL ${ownerLeads}`,
        baseArgs
      ),
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM leads
          WHERE created_at > NOW() - (($1::int * 2) || ' days')::INTERVAL
            AND created_at <= NOW() - ($1 || ' days')::INTERVAL ${ownerLeads}`,
        baseArgs
      ),
      query<any>(
        `SELECT COALESCE(intent_label,'UNCLEAR') AS label, COUNT(*)::int AS n
           FROM leads
          WHERE created_at > NOW() - ($1 || ' days')::INTERVAL ${ownerLeads}
          GROUP BY 1`,
        baseArgs
      ),
      query<any>(
        `SELECT icp_type, COUNT(*)::int AS n
           FROM leads
          WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
            AND icp_type IS NOT NULL ${ownerLeads}
          GROUP BY icp_type
          ORDER BY n DESC
          LIMIT 8`,
        baseArgs
      ),
      // Funnel: scraped = posts_found across runs in the window.
      queryOne<any>(
        `SELECT COALESCE(SUM(posts_found),0)::int AS n FROM scraper_runs
          WHERE started_at > NOW() - ($1 || ' days')::INTERVAL ${ownerRuns}`,
        baseArgs
      ).catch(() => ({ n: 0 })),
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM leads
          WHERE created_at > NOW() - ($1 || ' days')::INTERVAL
            AND status NOT IN ('archived') ${ownerLeads}`,
        baseArgs
      ),
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM leads
          WHERE enriched_at > NOW() - ($1 || ' days')::INTERVAL
            AND enrichment_status='enriched' ${ownerLeads}`,
        baseArgs
      ),
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM outreach_log
          WHERE sent_at > NOW() - ($1 || ' days')::INTERVAL ${ownerOL}`,
        baseArgs
      ).catch(() => ({ n: 0 })),
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM outreach_log
          WHERE sent_at > NOW() - ($1 || ' days')::INTERVAL
            AND replied_at IS NOT NULL ${ownerOL}`,
        baseArgs
      ).catch(() => ({ n: 0 })),
      // Meetings: leads moved to Won/Qualified/Proposal Sent in the window
      // (mobile pipeline doesn't yet log meeting events as a first-class type).
      queryOne<any>(
        `SELECT COUNT(*)::int AS n FROM leads
          WHERE updated_at > NOW() - ($1 || ' days')::INTERVAL
            AND status IN ('Qualified','Proposal Sent','Won') ${ownerLeads}`,
        baseArgs
      ),
      query<any>(
        `SELECT channel, COUNT(*)::int AS n FROM outreach_log
          WHERE sent_at > NOW() - ($1 || ' days')::INTERVAL ${ownerOL}
          GROUP BY channel`,
        baseArgs
      ).catch(() => []),
      query<any>(
        `SELECT
            CASE WHEN score >= 9 THEN '9-10'
                 WHEN score >= 7 THEN '7-8'
                 WHEN score >= 5 THEN '5-6'
                 ELSE '<5' END AS bucket,
            COUNT(*)::int AS n
           FROM leads
          WHERE created_at > NOW() - ($1 || ' days')::INTERVAL ${ownerLeads}
          GROUP BY bucket`,
        baseArgs
      ),
      // Top phrases by lead yield (always platform-wide — phrases are shared)
      query<any>(
        `SELECT sp.phrase,
                sp.total_runs::int AS runs,
                COUNT(l.id)::int AS leads_kept,
                CASE WHEN sp.total_posts > 0
                     THEN ROUND(100.0 * COUNT(l.id)::numeric / sp.total_posts::numeric, 1)
                     ELSE 0 END AS yield_pct
           FROM search_phrases sp
           LEFT JOIN leads l
             ON l.phrase_id = sp.id
            AND l.created_at > NOW() - ($1 || ' days')::INTERVAL
          WHERE sp.enabled = TRUE
          GROUP BY sp.id, sp.phrase, sp.total_runs, sp.total_posts
          ORDER BY yield_pct DESC, leads_kept DESC
          LIMIT 5`,
        [days]
      ).catch(() => []),
    ]);

    const cur = curLeads?.n ?? 0;
    const prev = prevLeads?.n ?? 0;
    const delta = prev > 0 ? Math.round(((cur - prev) / prev) * 100) : 0;

    const intentBreakdown: Record<string, number> = {
      BUYER_PROJECT: 0,
      INFORMATIONAL: 0,
      JOB_POSTING_FULLTIME: 0,
      SELF_PROMO: 0,
      JOB_SEEKER: 0,
      UNCLEAR: 0,
    };
    for (const row of intentRows ?? []) {
      const label = row.label ?? 'UNCLEAR';
      if (label in intentBreakdown) intentBreakdown[label] += Number(row.n) || 0;
      else intentBreakdown.UNCLEAR += Number(row.n) || 0;
    }

    const channelMix: Record<string, number> = { whatsapp: 0, email: 0, linkedin_dm: 0 };
    for (const row of channelRows ?? []) {
      const c = (row.channel ?? '').toLowerCase();
      if (c === 'whatsapp' || c === 'wa') channelMix.whatsapp += Number(row.n) || 0;
      else if (c === 'email') channelMix.email += Number(row.n) || 0;
      else if (c === 'linkedin' || c === 'linkedin_dm') channelMix.linkedin_dm += Number(row.n) || 0;
    }

    const scoreOrder = ['9-10', '7-8', '5-6', '<5'];
    const scoreMap = new Map<string, number>();
    for (const r of scoreRows ?? []) scoreMap.set(r.bucket, Number(r.n) || 0);
    const scoreDistribution = scoreOrder.map((bucket) => ({
      bucket,
      count: scoreMap.get(bucket) ?? 0,
    }));

    res.json({
      range: rangeKey,
      leads_added: cur,
      leads_added_delta_pct: delta,
      intent_breakdown: intentBreakdown,
      icp_breakdown: (icpRows ?? []).map((r: any) => ({ icp_type: r.icp_type, count: Number(r.n) })),
      funnel: {
        scraped: scrapedRow?.n ?? 0,
        kept_after_filter: keptRow?.n ?? 0,
        enriched: enrichedRow?.n ?? 0,
        outreach_sent: outreachSentRow?.n ?? 0,
        replied: repliedRow?.n ?? 0,
        meeting_booked: meetingsRow?.n ?? 0,
      },
      outreach_by_channel: channelMix,
      score_distribution: scoreDistribution,
      phrase_performance: (phraseRows ?? []).map((r: any) => ({
        phrase: r.phrase,
        runs: Number(r.runs) || 0,
        leads_kept: Number(r.leads_kept) || 0,
        yield_pct: Number(r.yield_pct) || 0,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Analytics failed', detail: err.message });
  }
});

// ── Notification preferences ──────────────────────────────────────────────────

router.get('/notification-prefs', async (req: any, res) => {
  const user = await queryOne<any>(
    `SELECT notification_prefs FROM users WHERE id=$1`,
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user.notification_prefs ?? {
    push: true, email: true,
    events: { lead: true, reply: true, scrape: true, low_tokens: true, trial: true },
  });
});

const notifPrefsSchema = z.object({
  push: z.boolean().optional(),
  email: z.boolean().optional(),
  whatsapp: z.boolean().optional(),
  events: z.object({
    lead: z.boolean().optional(),
    reply: z.boolean().optional(),
    scrape: z.boolean().optional(),
    low_tokens: z.boolean().optional(),
    trial: z.boolean().optional(),
  }).optional(),
});

router.post('/notification-prefs', validateBody(notifPrefsSchema), async (req: any, res) => {
  const user = await queryOne<any>(`SELECT notification_prefs FROM users WHERE id=$1`, [req.user.id]);
  const current = user?.notification_prefs ?? {};
  const merged = { ...current, ...req.body, events: { ...(current.events ?? {}), ...(req.body.events ?? {}) } };
  await query(`UPDATE users SET notification_prefs=$1, updated_at=NOW() WHERE id=$2`, [JSON.stringify(merged), req.user.id]);
  res.json(merged);
});

// ── Test push ─────────────────────────────────────────────────────────────────

router.post('/test-push', async (req: any, res) => {
  const user = await queryOne<any>(`SELECT push_token, push_platform FROM users WHERE id=$1`, [req.user.id]);
  if (!user?.push_token) return res.status(400).json({ error: 'No push token registered for this device' });

  await sendPushNotification(user.push_token, {
    title: 'Test Notification',
    body: 'Your push notifications are working!',
    data: { type: 'test' },
  });
  res.json({ ok: true });
});

// ── Sessions ──────────────────────────────────────────────────────────────────

router.get('/sessions', async (req: any, res) => {
  const rows = await query(
    `SELECT jti, ip_address, user_agent, created_at, last_seen_at, expires_at
     FROM active_sessions
     WHERE user_id=$1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(rows.map((s: any) => ({ ...s, is_current: s.jti === req.user.jti })));
});

router.delete('/sessions/:jti', async (req: any, res) => {
  const { jti } = req.params;
  if (jti === req.user.jti) return res.status(400).json({ error: 'Cannot revoke current session — use logout instead' });
  await query(
    `UPDATE active_sessions SET revoked_at=NOW() WHERE jti=$1 AND user_id=$2`,
    [jti, req.user.id]
  );
  await audit({ actorId: req.user.id, action: 'user.session_revoke', targetType: 'session', targetId: jti });
  res.json({ ok: true });
});

router.delete('/sessions', async (req: any, res) => {
  await query(
    `UPDATE active_sessions SET revoked_at=NOW() WHERE user_id=$1 AND jti!=$2 AND revoked_at IS NULL`,
    [req.user.id, req.user.jti ?? '']
  );
  res.json({ ok: true });
});

// ── 2FA ───────────────────────────────────────────────────────────────────────

router.post('/2fa/setup', async (req: any, res) => {
  const user = await queryOne<any>(`SELECT email, totp_enabled_at FROM users WHERE id=$1`, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.totp_enabled_at) return res.status(400).json({ error: '2FA already enabled — disable first' });

  const secretObj = speakeasy.generateSecret({ name: `Indi-gen (${user.email})`, length: 20 });
  await query(`UPDATE users SET totp_secret=$1 WHERE id=$2`, [secretObj.base32, req.user.id]);

  const qrDataUrl = await QRCode.toDataURL(secretObj.otpauth_url ?? '');
  res.json({ secret: secretObj.base32, qrDataUrl, otpAuthUrl: secretObj.otpauth_url });
});

const totpCodeSchema = z.object({ code: z.string().length(6) });

router.post('/2fa/verify', validateBody(totpCodeSchema), async (req: any, res) => {
  const user = await queryOne<any>(`SELECT totp_secret, totp_enabled_at FROM users WHERE id=$1`, [req.user.id]);
  if (!user?.totp_secret) return res.status(400).json({ error: '2FA setup not started — call /2fa/setup first' });
  if (user.totp_enabled_at) return res.status(400).json({ error: '2FA is already enabled' });

  const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: req.body.code, window: 1 });
  if (!valid) return res.status(400).json({ error: 'Invalid code' });

  const recoveryCodes = Array.from({ length: 8 }, () =>
    Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
  );
  await query(
    `UPDATE users SET totp_enabled_at=NOW(), totp_recovery_codes=$1 WHERE id=$2`,
    [recoveryCodes, req.user.id]
  );
  await audit({ actorId: req.user.id, action: 'user.2fa_enable', targetType: 'user', targetId: req.user.id });
  res.json({ ok: true, recoveryCodes });
});

router.post('/2fa/disable', validateBody(totpCodeSchema), async (req: any, res) => {
  const user = await queryOne<any>(`SELECT totp_secret, totp_enabled_at FROM users WHERE id=$1`, [req.user.id]);
  if (!user?.totp_enabled_at) return res.status(400).json({ error: '2FA is not enabled' });

  const valid = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: req.body.code, window: 1 });
  if (!valid) return res.status(400).json({ error: 'Invalid code' });

  await query(
    `UPDATE users SET totp_secret=NULL, totp_enabled_at=NULL, totp_recovery_codes=NULL WHERE id=$1`,
    [req.user.id]
  );
  await audit({ actorId: req.user.id, action: 'user.2fa_disable', targetType: 'user', targetId: req.user.id });
  res.json({ ok: true });
});

router.get('/2fa/status', async (req: any, res) => {
  const user = await queryOne<any>(`SELECT totp_enabled_at FROM users WHERE id=$1`, [req.user.id]);
  res.json({ enabled: !!user?.totp_enabled_at, enabledAt: user?.totp_enabled_at ?? null });
});

// ── Branding (Pro/Enterprise only) ────────────────────────────────────────────

router.get('/branding', async (req: any, res) => {
  const user = await queryOne<any>(`SELECT branding_data, role FROM users WHERE id=$1`, [req.user.id]);
  res.json(user?.branding_data ?? null);
});

const brandingSchema = z.object({
  logo_url: z.string().url().optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  app_name: z.string().min(1).max(40).optional(),
  tagline: z.string().max(80).optional(),
});

router.post('/branding', validateBody(brandingSchema), async (req: any, res) => {
  const user = await queryOne<any>(`SELECT plan FROM users WHERE id=$1`, [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!['pro', 'enterprise'].includes(user.plan ?? '')) {
    return res.status(403).json({ error: 'Branding customisation requires a Pro or Enterprise plan' });
  }
  await query(`UPDATE users SET branding_data=$1, updated_at=NOW() WHERE id=$2`, [JSON.stringify(req.body), req.user.id]);
  res.json({ ok: true });
});

// ── Feedback ──────────────────────────────────────────────────────────────────

const feedbackSchema = z.object({
  body: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  subject: z.string().max(120).optional(),
});

router.post('/feedback', validateBody(feedbackSchema), async (req: any, res) => {
  const { body, rating, subject } = req.body;
  const ticket = await queryOne<any>(
    `INSERT INTO support_tickets (user_id, subject, body, rating) VALUES ($1,$2,$3,$4) RETURNING id`,
    [req.user.id, subject ?? 'Feedback', body, rating ?? null]
  );
  res.status(201).json({ ok: true, ticketId: ticket.id });
});

// ── Public legal docs ─────────────────────────────────────────────────────────

const LEGAL_DOCS: Record<string, { title: string; content: string }> = {
  terms: {
    title: 'Terms of Service',
    content: 'Full terms available at https://leadgen.indigenservices.com/legal/terms',
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'Full privacy policy available at https://leadgen.indigenservices.com/legal/privacy',
  },
  dpdp: {
    title: 'DPDP Notice',
    content: 'Digital Personal Data Protection Act 2023 notice available at https://leadgen.indigenservices.com/legal/dpdp',
  },
  refund: {
    title: 'Refund Policy',
    content: 'Full refund policy available at https://leadgen.indigenservices.com/legal/refund',
  },
};

router.get('/legal/:slug', (_req, res) => {
  const { slug } = _req.params;
  const doc = LEGAL_DOCS[slug];
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

// ── Integrations ──────────────────────────────────────────────────────────────

const linkedInSchema = z.object({ cookie: z.string().min(10) });

router.post('/integrations/linkedin', validateBody(linkedInSchema), async (req: any, res) => {
  await query(
    `UPDATE users SET linkedin_cookie=$1, updated_at=NOW() WHERE id=$2`,
    [req.body.cookie, req.user.id]
  );
  res.json({ ok: true });
});

export default router;
