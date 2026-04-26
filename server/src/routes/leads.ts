import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';
import { enrichLead, batchEnrich } from '../enrichment/signalHire';
import { generateDrafts, translateToEnglish, type LeadForDraft } from '../services/draftService';
import { generateProposal } from '../services/proposalService';

const router = Router();

const statusUpdateSchema = z.object({ status: z.string().min(1) });
const notesUpdateSchema = z.object({ notes: z.string() });
const outreachSchema = z.object({
  channel: z.enum(['email', 'linkedin', 'whatsapp', 'call', 'other']),
  message: z.string().optional(),
  subject: z.string().optional(),
});
const manualLeadSchema = z.object({
  name: z.string().min(1),
  company: z.string().optional(),
  headline: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
const feedbackSchema = z.object({
  rejected: z.boolean(),
  reason: z.string().optional(),
});
const draftsBodySchema = z.object({ force: z.boolean().optional() });
const proposalBodySchema = z.object({ force: z.boolean().optional() });
const translateSchema = z.object({ text: z.string().min(1).max(8000) });
const userUnqualifiedSchema = z.object({ reason: z.string().optional() });

// Map mobile-side categories to server-side filters.
const CATEGORY_HEADLINE_PATTERNS: Record<string, RegExp> = {
  Shopify: /shopify|d2c|ecommerce|e-commerce|storefront/i,
  SaaS: /saas|b2b software|b2b platform|product manager/i,
  AI: /\b(ai|claude|llm|gpt|openai|anthropic|machine learning|ml engineer)\b/i,
  Mobile: /\b(react native|ios|android|flutter|mobile dev)\b/i,
  Web: /\b(web dev|frontend|backend|full stack|fullstack|next\.?js)\b/i,
  Design: /\b(ui|ux|product designer|brand|visual design)\b/i,
  'Social Media': /\b(social media|content creator|growth marketing|smm|community)\b/i,
};

// ============================================================
// LIST endpoints (root + buckets) — register before /:id.
// ============================================================
router.get('/', async (req: any, res) => {
  const { status, icp, icp_type, score_min, q, sort, platform, limit = '50', offset = '0', category } = req.query;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (!isAdmin) {
    params.push(req.user.id);
    conditions.push(`l.owner_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  } else {
    // Default: hide archived/closed unless user explicitly asks.
    // LinkedIn-only convergence (2026-04-25): non-LinkedIn leads were archived.
    conditions.push(`l.status NOT IN ('archived','closed')`);
  }
  if (icp === 'true') conditions.push('l.icp_type IS NOT NULL');
  if (icp_type) {
    params.push(icp_type);
    conditions.push(`l.icp_type = $${params.length}`);
  }
  if (score_min) {
    params.push(parseInt(score_min as string));
    conditions.push(`l.score >= $${params.length}`);
  }
  if (platform === 'linkedin') {
    conditions.push(
      `((l.profile_data->>'old_platform' = 'linkedin') OR ` +
      `(l.profile_data->>'old_platform' IS NULL AND l.linkedin_url ILIKE '%linkedin.com/in/%'))`
    );
  } else if (platform) {
    params.push(platform);
    conditions.push(`l.profile_data->>'old_platform' = $${params.length}`);
  }
  if (category && typeof category === 'string' && category !== 'All') {
    const pattern = CATEGORY_HEADLINE_PATTERNS[category];
    if (pattern) {
      params.push(pattern.source);
      const idx = params.length;
      conditions.push(
        `(COALESCE(l.headline,'') ~* $${idx} OR COALESCE(l.post_text,'') ~* $${idx} OR COALESCE(l.icp_type,'') ~* $${idx})`
      );
    }
  }
  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(l.name ILIKE $${idx} OR l.company ILIKE $${idx} OR l.linkedin_url ILIKE $${idx})`);
  }

  const orderBy =
    sort === 'score'
      ? 'l.score DESC NULLS LAST, l.created_at DESC'
      : 'l.created_at DESC';

  const where = conditions.join(' AND ');
  params.push(parseInt(limit as string), parseInt(offset as string));
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const leads = await query(
    `SELECT l.*, COUNT(*) OVER() AS total_count
     FROM leads l
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  const total = leads[0]?.total_count || 0;
  res.json({
    leads: leads.map(({ total_count, ...l }) => l),
    total: parseInt(total),
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });
});

// ============================================================
// Outreach hub buckets (Outreach tab on mobile).
// ============================================================
router.get('/outreach-buckets', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const ownerClause = isAdmin ? '' : ' AND l.owner_id=$1';
  const params: any[] = isAdmin ? [] : [req.user.id];

  const baseSelect = `
    SELECT l.id, l.name, l.headline, l.company, l.score, l.status,
           l.intent_label, l.intent_confidence, l.last_outreach_at,
           l.profile_data->>'profile_photo_url' AS profile_photo_url,
           (SELECT COUNT(*) FROM contacts c WHERE c.lead_id = l.id AND c.type IN ('email','phone')) AS contact_count
    FROM leads l`;

  const [actToday, hot, followUp] = await Promise.all([
    query(
      `${baseSelect}
       WHERE l.status = 'New'
         AND l.score >= 8
         AND l.status NOT IN ('archived','closed')
         AND EXISTS (SELECT 1 FROM contacts c WHERE c.lead_id = l.id AND c.type IN ('email','phone'))
         ${ownerClause}
       ORDER BY l.score DESC NULLS LAST, l.created_at DESC
       LIMIT 30`,
      params
    ),
    query(
      `${baseSelect}
       WHERE l.score >= 7
         AND l.status NOT IN ('archived','closed')
         AND (l.status = 'New'
              OR (l.status = 'Contacted' AND l.last_outreach_at > NOW() - INTERVAL '24 hours'))
         ${ownerClause}
       ORDER BY l.score DESC NULLS LAST, l.created_at DESC
       LIMIT 30`,
      params
    ),
    query(
      `${baseSelect}
       WHERE l.status = 'Contacted'
         AND l.last_outreach_at IS NOT NULL
         AND l.last_outreach_at < NOW() - INTERVAL '3 days'
         AND NOT EXISTS (
           SELECT 1 FROM outreach_log r
           WHERE r.lead_id = l.id AND r.status = 'replied'
         )
         ${ownerClause}
       ORDER BY l.last_outreach_at ASC NULLS LAST
       LIMIT 30`,
      params
    ),
  ]);

  res.json({ act_today: actToday, hot, follow_up: followUp });
});

// Aggregated outreach view across leads (used by older Outreach screen variant).
router.get('/outreach', async (req: any, res) => {
  const { status } = req.query;
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);

  const statusFilter: Record<string, string[]> = {
    pending: ['draft'],
    sent: ['sent', 'delivered', 'opened'],
    replied: ['replied'],
  };

  const allowedStatuses = status && statusFilter[status as string]
    ? statusFilter[status as string]
    : ['draft', 'sent', 'delivered', 'opened', 'replied'];

  const ownerClause = isAdmin ? '' : 'AND ol.user_id=$2';
  const params: any[] = [allowedStatuses];
  if (!isAdmin) params.push(req.user.id);

  const rows = await query(
    `SELECT ol.id, l.id AS "leadId", COALESCE(l.name, l.linkedin_url) AS "leadName",
            (l.profile_data->>'profile_photo_url') AS "leadAvatar",
            ol.channel, ol.status, ol.sent_at AS "sentAt", LEFT(ol.message, 120) AS preview
     FROM outreach_log ol
     JOIN leads l ON l.id = ol.lead_id
     WHERE ol.status = ANY($1) ${ownerClause}
     ORDER BY ol.sent_at DESC NULLS LAST
     LIMIT 100`,
    params
  );
  res.json(rows);
});

router.get('/outreach/follow-up', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const ownerClause = isAdmin ? '' : 'AND ol.user_id=$1';
  const params: any[] = isAdmin ? [] : [req.user.id];

  const rows = await query(
    `SELECT DISTINCT ON (ol.lead_id)
            ol.id, l.id AS "leadId", COALESCE(l.name, l.linkedin_url) AS "leadName",
            (l.profile_data->>'profile_photo_url') AS "leadAvatar",
            ol.channel, ol.status, ol.sent_at AS "sentAt", LEFT(ol.message, 120) AS preview
     FROM outreach_log ol
     JOIN leads l ON l.id = ol.lead_id
     WHERE ol.status IN ('sent', 'delivered', 'opened')
       AND ol.sent_at < NOW() - INTERVAL '7 days'
       ${ownerClause}
       AND NOT EXISTS (
         SELECT 1 FROM outreach_log r
         WHERE r.lead_id = ol.lead_id AND r.status = 'replied'
       )
     ORDER BY ol.lead_id, ol.sent_at DESC
     LIMIT 100`,
    params
  );
  res.json(rows);
});

// ============================================================
// Static action endpoints — register before /:id parametric.
// ============================================================
router.post('/manual', validateBody(manualLeadSchema), async (req: any, res) => {
  const { name, company, headline, linkedinUrl, notes } = req.body;
  const lead = await queryOne<any>(
    `INSERT INTO leads (name, company, headline, linkedin_url, notes, owner_id, status)
     VALUES ($1,$2,$3,$4,$5,$6,'new')
     RETURNING *`,
    [name, company || null, headline || null, linkedinUrl || null, notes || null, req.user.id]
  );
  await audit({ actorId: req.user.id, action: 'lead.manual_add', targetType: 'lead', targetId: lead.id });
  res.status(201).json(lead);
});

router.post('/batch-enrich', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  if (!isAdmin) return res.status(403).json({ error: 'Admin only' });
  const limit = Math.min(parseInt(req.body?.limit ?? '50'), 200);
  const minScore = parseInt(req.body?.min_score ?? '7');
  const rows = await query<any>(
    `SELECT id, linkedin_url FROM leads
     WHERE enrichment_status NOT IN ('enriched','processing')
       AND linkedin_url ILIKE '%linkedin.com/in/%'
       AND score >= $1
     ORDER BY score DESC, post_date DESC NULLS LAST
     LIMIT $2`,
    [minScore, limit]
  );
  const ids = rows.map((r: any) => r.id);
  await batchEnrich(ids).catch(() => {});
  res.json({ queued: ids.length, lead_ids: ids });
});

router.post('/translate', validateBody(translateSchema), async (req: any, res) => {
  const text = req.body.text as string;
  const translated = await translateToEnglish(text);
  res.json({ translated });
});

// ============================================================
// /:id parametric endpoints — registered LAST so static paths win.
// ============================================================
router.get('/:id', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT l.* FROM leads l WHERE l.id=$1 ${isAdmin ? '' : 'AND l.owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const contacts = await query(
    `SELECT * FROM contacts WHERE lead_id=$1 ORDER BY created_at ASC`,
    [req.params.id]
  );
  res.json({ ...lead, contacts });
});

router.patch('/:id/status', validateBody(statusUpdateSchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id, status FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  await query(`UPDATE leads SET status=$1, updated_at=NOW() WHERE id=$2`, [req.body.status, req.params.id]);
  await audit({
    actorId: req.user.id,
    action: 'lead.status_change',
    targetType: 'lead',
    targetId: req.params.id,
    before: { status: lead.status },
    after: { status: req.body.status },
  });
  res.json({ ok: true });
});

router.patch('/:id/notes', validateBody(notesUpdateSchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  await query(`UPDATE leads SET notes=$1, updated_at=NOW() WHERE id=$2`, [req.body.notes, req.params.id]);
  res.json({ ok: true });
});

router.post('/:id/enrich', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id, linkedin_url FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (!lead.linkedin_url) {
    return res.status(400).json({ error: 'Lead has no linkedin_url to enrich' });
  }

  await query(`UPDATE leads SET enrichment_status='queued', updated_at=NOW() WHERE id=$1`, [lead.id]);
  enrichLead(lead.id, lead.linkedin_url).catch(() => {
    /* already logged inside the module */
  });
  res.status(202).json({ queued: true });
});

router.post('/:id/outreach', validateBody(outreachSchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const { channel, message, subject } = req.body;
  await query(
    `INSERT INTO outreach_log (lead_id, user_id, channel, message, subject, sent_at)
     VALUES ($1,$2,$3,$4,$5,NOW())`,
    [lead.id, req.user.id, channel, message || null, subject || null]
  );
  await query(
    `UPDATE leads
       SET status='Contacted', last_outreach_at=NOW(), updated_at=NOW()
     WHERE id=$1 AND status NOT IN ('converted','closed')`,
    [lead.id]
  );
  res.status(201).json({ ok: true });
});

router.get('/:id/outreach', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const logs = await query(
    `SELECT * FROM outreach_log WHERE lead_id=$1 ORDER BY sent_at DESC`,
    [req.params.id]
  );
  res.json(logs);
});

router.post('/:id/drafts', validateBody(draftsBodySchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT l.* FROM leads l WHERE l.id=$1 ${isAdmin ? '' : 'AND l.owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const force = req.body?.force === true;
  const cachedAt = lead.drafts_cached_at ? new Date(lead.drafts_cached_at).getTime() : 0;
  const cacheFresh = cachedAt > 0 && Date.now() - cachedAt < 24 * 60 * 60 * 1000;
  if (!force && cacheFresh && lead.drafts_cache) {
    const cache = typeof lead.drafts_cache === 'string' ? JSON.parse(lead.drafts_cache) : lead.drafts_cache;
    if (cache && (cache.whatsapp || cache.email_body || cache.linkedin_dm)) {
      return res.json({ ...cache, cached: true, cached_at: lead.drafts_cached_at });
    }
  }

  const leadForDraft: LeadForDraft = {
    id: lead.id,
    name: lead.name,
    headline: lead.headline,
    company: lead.company,
    post_text: lead.post_text,
    profile_data: lead.profile_data,
    intent_label: lead.intent_label,
  };

  const drafts = await generateDrafts(leadForDraft);
  await query(
    `UPDATE leads SET drafts_cache=$1, drafts_cached_at=NOW(), updated_at=NOW() WHERE id=$2`,
    [JSON.stringify(drafts), req.params.id]
  );

  res.json({ ...drafts, cached: false });
});

router.post('/:id/proposal', validateBody(proposalBodySchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT l.* FROM leads l WHERE l.id=$1 ${isAdmin ? '' : 'AND l.owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const force = req.body?.force === true;
  if (!force) {
    const cached = await queryOne<any>(
      `SELECT ai_content, created_at FROM lead_proposals
        WHERE lead_id=$1
          AND ai_content IS NOT NULL
          AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );
    if (cached?.ai_content) {
      const payload = typeof cached.ai_content === 'string' ? JSON.parse(cached.ai_content) : cached.ai_content;
      if (payload?.tiers?.length) {
        return res.json({ ...payload, cached: true, cached_at: cached.created_at });
      }
    }
  }

  const payload = await generateProposal({
    id: lead.id,
    name: lead.name,
    headline: lead.headline,
    company: lead.company,
    post_text: lead.post_text,
    intent_label: lead.intent_label,
    intent_reason: lead.intent_reason,
    icp_type: lead.icp_type,
    profile_data: lead.profile_data,
  });

  const title = `Proposal for ${lead.company || lead.name || 'Lead'}`;
  await queryOne<any>(
    `INSERT INTO lead_proposals (lead_id, user_id, status, title, ai_content, created_at, updated_at)
     VALUES ($1,$2,'draft',$3,$4::jsonb,NOW(),NOW()) RETURNING id`,
    [req.params.id, req.user.id, title, JSON.stringify(payload)]
  );

  res.json({ ...payload, cached: false });
});

router.post('/:id/mark-unqualified', validateBody(userUnqualifiedSchema), async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT id, headline, post_text FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const reason = (req.body?.reason as string | undefined) || 'manual_unqualified';

  await query(
    `UPDATE leads
       SET status='archived', unqualified_reason=$1, updated_at=NOW()
     WHERE id=$2`,
    [reason, req.params.id]
  );
  await query(
    `INSERT INTO filter_feedback (lead_id, user_id, verdict, headline, post_text, reason)
     VALUES ($1,$2,'reject',$3,$4,$5)`,
    [req.params.id, req.user.id, lead.headline, lead.post_text, reason]
  );
  await audit({
    actorId: req.user.id,
    action: 'lead.mark_unqualified',
    targetType: 'lead',
    targetId: req.params.id,
    after: { reason },
  });
  res.json({ ok: true });
});

router.post('/:id/feedback', validateBody(feedbackSchema), async (req: any, res) => {
  const { rejected, reason } = req.body;
  const verdict = rejected ? 'rejected' : 'approved';
  await query(
    `INSERT INTO filter_feedback (lead_id, user_id, verdict, reason, created_at)
     VALUES ($1,$2,$3,$4,NOW())`,
    [req.params.id, req.user.id, verdict, reason || null]
  );
  if (rejected) {
    await query(`UPDATE leads SET status='rejected', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  }
  res.status(201).json({ ok: true });
});

export default router;
