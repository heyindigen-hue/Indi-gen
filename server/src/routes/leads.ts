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
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
const feedbackSchema = z.object({
  rejected: z.boolean(),
  reason: z.string().optional(),
});

router.get('/', async (req: any, res) => {
  const { status, icp, score_min, q, limit = '50', offset = '0' } = req.query;
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
  if (score_min) {
    params.push(parseInt(score_min as string));
    conditions.push(`l.score >= $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(`(l.name ILIKE $${idx} OR l.company ILIKE $${idx} OR l.linkedin_url ILIKE $${idx})`);
  }

  const where = conditions.join(' AND ');
  params.push(parseInt(limit as string), parseInt(offset as string));
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const leads = await query(
    `SELECT l.*, COUNT(*) OVER() AS total_count
     FROM leads l
     WHERE ${where}
     ORDER BY l.created_at DESC
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
    `SELECT * FROM lead_contacts WHERE lead_id=$1 ORDER BY created_at ASC`,
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
    `SELECT id, email, linkedin_url FROM leads WHERE id=$1 ${isAdmin ? '' : 'AND owner_id=$2'}`,
    isAdmin ? [req.params.id] : [req.params.id, req.user.id]
  );
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const jobId = `enrich:${lead.id}:${Date.now()}`;
  await query(
    `INSERT INTO enrichment_requests (lead_id, provider, status, job_id) VALUES ($1,'signalhire','queued',$2)
     ON CONFLICT DO NOTHING`,
    [lead.id, jobId]
  );
  res.status(202).json({ queued: true, jobId });
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
    `INSERT INTO outreach_logs (lead_id, user_id, channel, message, subject, sent_at)
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
    `SELECT * FROM outreach_logs WHERE lead_id=$1 ORDER BY sent_at DESC`,
    [req.params.id]
  );
  res.json(logs);
});

router.post('/manual', validateBody(manualLeadSchema), async (req: any, res) => {
  const { fullName, email, phone, company, title, linkedinUrl, notes } = req.body;
  const lead = await queryOne<any>(
    `INSERT INTO leads (full_name, email, phone, company, title, linkedin_url, notes, owner_id, source, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'manual','new')
     RETURNING *`,
    [fullName, email || null, phone || null, company || null, title || null, linkedinUrl || null, notes || null, req.user.id]
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

  const cacheKey = `draft:${lead.id}:${req.user.id}`;
  const cached = await query(`SELECT drafts, created_at FROM ai_drafts_cache WHERE cache_key=$1 AND created_at > NOW() - INTERVAL '24 hours'`, [cacheKey]);
  if (cached.length) return res.json({ drafts: cached[0].drafts, cached: true });

  const prompts = [
    `Write a concise, professional cold email to ${lead.full_name || 'the prospect'}${lead.company ? ` at ${lead.company}` : ''}${lead.title ? ` (${lead.title})` : ''}. Focus on value, keep it under 150 words.`,
    `Write a LinkedIn connection request message for ${lead.full_name || 'a prospect'}${lead.company ? ` at ${lead.company}` : ''}. Max 300 characters, no fluff.`,
    `Write a WhatsApp outreach message to ${lead.full_name || 'a prospect'}${lead.title ? ` who is a ${lead.title}` : ''}. Friendly, brief, under 100 words.`,
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

  await query(
    `INSERT INTO ai_drafts_cache (cache_key, lead_id, user_id, drafts, created_at)
     VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (cache_key) DO UPDATE SET drafts=$4, created_at=NOW()`,
    [cacheKey, lead.id, req.user.id, JSON.stringify(drafts)]
  );

  res.json({ drafts, cached: false });
});

router.post('/:id/feedback', validateBody(feedbackSchema), async (req: any, res) => {
  const { rejected, reason } = req.body;
  await query(
    `INSERT INTO lead_feedback (lead_id, user_id, rejected, reason, created_at)
     VALUES ($1,$2,$3,$4,NOW())`,
    [req.params.id, req.user.id, rejected, reason || null]
  );
  if (rejected) {
    await query(`UPDATE leads SET status='rejected', updated_at=NOW() WHERE id=$1`, [req.params.id]);
  }
  res.status(201).json({ ok: true });
});

export default router;
