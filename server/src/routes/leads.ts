import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne, transaction } from '../db/client';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';
import { grantTokens } from '../services/tokens';
import axios from 'axios';
import { config } from '../config';

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

router.get('/', async (req: any, res) => {
  const { status, icp, icp_type, score_min, q, sort, platform, limit = '50', offset = '0' } = req.query;
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
  // platform filter — the dataset only carries LinkedIn URLs; "linkedin" maps to
  // rows with a linkedin_url, so the mobile feed never surfaces archived non-LI rows.
  if (platform === 'linkedin') {
    conditions.push(`l.linkedin_url IS NOT NULL`);
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
  res.json({ leads: leads.map(({ total_count, ...l }) => l), total: parseInt(total), limit: parseInt(limit as string), offset: parseInt(offset as string) });
});

router.get('/:id', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT l.* FROM leads l WHERE l.id=$1  ${isAdmin ? '' : 'AND l.owner_id=$2'}`,
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
  await audit({ actorId: req.user.id, action: 'lead.status_change', targetType: 'lead', targetId: req.params.id, before: { status: lead.status }, after: { status: req.body.status } });
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

  await query(`UPDATE leads SET enrichment_status='queued', updated_at=NOW() WHERE id=$1`, [lead.id]);
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
  await query(`UPDATE leads SET status='contacted', updated_at=NOW() WHERE id=$1 AND status NOT IN ('converted','closed')`, [lead.id]);
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

router.post('/:id/drafts', async (req: any, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
  const lead = await queryOne<any>(
    `SELECT l.* FROM leads l WHERE l.id=$1  ${isAdmin ? '' : 'AND l.owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const prompts = [
    `Write a concise, professional cold email to ${lead.name || 'the prospect'}${lead.company ? ` at ${lead.company}` : ''}${lead.headline ? ` (${lead.headline})` : ''}. Focus on value, keep it under 150 words.`,
    `Write a LinkedIn connection request message for ${lead.name || 'a prospect'}${lead.company ? ` at ${lead.company}` : ''}. Max 300 characters, no fluff.`,
    `Write a WhatsApp outreach message to ${lead.name || 'a prospect'}${lead.headline ? ` who is a ${lead.headline}` : ''}. Friendly, brief, under 100 words.`,
  ];

  let drafts: string[] = [];
  try {
    const responses = await Promise.all(prompts.map(p =>
      axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: p }],
      }, {
        headers: { 'x-api-key': config.anthropic.apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      }).then(r => r.data.content[0].text)
    ));
    drafts = responses;
  } catch {
    drafts = prompts.map(() => '');
  }

  res.json({ drafts, cached: false });
});

// List outreach items for the mobile Outreach tab (aggregated view across all leads)
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

// Follow-up queue: leads sent to > 7 days ago with no reply
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
