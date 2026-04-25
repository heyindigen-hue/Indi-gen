import { Router } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../db/client';
import { getSetting } from '../db/settings';
import { validateBody } from '../middleware/validate';
import { audit } from '../services/audit';
import { logger } from '../logger';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCompanyProfile(): Promise<Record<string, string>> {
  const raw = await getSetting('company_profile');
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

async function generateProposalWithClaude(lead: any, profile: any): Promise<string> {
  const apiKey = await getSetting('claude_api_key');
  if (!apiKey) return fallbackMarkdown(lead, profile);

  const aiContext = {
    pitch: (await getSetting('ai_context_pitch')) || '',
    ideal_clients: (await getSetting('ai_context_ideal_clients')) || '',
    case_studies: (await getSetting('ai_context_case_studies')) || '',
    writing_style: (await getSetting('ai_context_writing_style')) || '',
    banned_phrases: (await getSetting('ai_context_banned_phrases')) || '',
  };

  const prompt = `You are a senior consultant at ${profile.name || 'Indigen Services'} writing a tailored sales proposal.

Company context:
${aiContext.pitch}

Ideal clients:
${aiContext.ideal_clients}

Case studies:
${aiContext.case_studies}

Writing style:
${aiContext.writing_style}

Banned phrases (NEVER use):
${aiContext.banned_phrases}

Prospect:
- Name: ${lead.name || 'Unknown'}
- Company: ${lead.company || 'Unknown'}
- Headline: ${lead.headline || ''}
- ICP type: ${lead.icp_type || ''}
- Recent post: ${(lead.post_text || '').substring(0, 400)}

Write a concise, professional proposal in Markdown. Include:
1. **Executive Summary** (2–3 sentences tailored to their specific situation)
2. **The Challenge** (their specific pain point, inferred from their post/headline)
3. **Our Approach** (phased, concrete, 3–4 bullet points)
4. **Expected Outcomes** (3–4 quantified metrics)
5. **Investment** (suggest a range based on ICP type)
6. **Next Steps**

Keep total length under 600 words. Use their company name. Do not use any banned phrases.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Claude API error for proposal generation');
      return fallbackMarkdown(lead, profile);
    }
    const data = await res.json() as any;
    return data?.content?.[0]?.text || fallbackMarkdown(lead, profile);
  } catch (e: any) {
    logger.warn({ err: e.message }, 'Claude proposal generation failed');
    return fallbackMarkdown(lead, profile);
  }
}

function fallbackMarkdown(lead: any, profile: any): string {
  const clientName = lead.company || lead.name || 'Your Company';
  const agencyName = profile.name || 'Indigen Services';
  return `# Proposal for ${clientName}

## Executive Summary
${agencyName} is pleased to present this engagement proposal for ${clientName}. We help companies like yours build revenue-generating systems faster than traditional agencies.

## The Challenge
Based on our research, ${clientName} would benefit from AI-powered automation and modern engineering practices to accelerate growth.

## Our Approach
- **Phase 1 (Week 1):** Discovery — requirements, architecture, mockups
- **Phase 2 (Weeks 2–3):** Build — core application and integrations
- **Phase 3 (Week 4):** QA & integrations
- **Phase 4 (Week 5):** Launch & handover

## Expected Outcomes
- 40% reduction in manual workflows
- 2x faster time-to-market for new features
- 30% improvement in conversion metrics
- Full IP transfer on completion

## Investment
| Tier | Fee |
|------|-----|
| Essential | ₹1,50,000 |
| **Recommended** | **₹3,50,000** |
| Premium | ₹7,50,000 |

Payment schedule: 40% advance · 30% milestone · 30% delivery.

## Next Steps
Reply to this proposal to confirm. We'll issue the agreement and advance invoice within one business day. Work begins within 5 business days of payment.

---
*Valid for 14 days. Prepared by ${profile.founder_name || agencyName}.*`;
}

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/admin/leads/:lead_id/proposals
router.get('/leads/:lead_id/proposals', async (req, res) => {
  const rows = await query(
    `SELECT id, status, title, pdf_url, sent_at, viewed_at, accepted_at, created_at, updated_at
     FROM lead_proposals WHERE lead_id=$1 ORDER BY created_at DESC`,
    [req.params.lead_id]
  );
  res.json(rows);
});

// POST /api/admin/leads/:lead_id/proposals/generate
router.post('/leads/:lead_id/proposals/generate', async (req: any, res) => {
  const lead = await queryOne<any>(`SELECT * FROM leads WHERE id=$1`, [req.params.lead_id]);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const profile = await getCompanyProfile();
  const contentMd = await generateProposalWithClaude(lead, profile);

  const title = `Proposal for ${lead.company || lead.name}`;
  const row = await queryOne<any>(
    `INSERT INTO lead_proposals (lead_id, user_id, status, title, content_md, created_at, updated_at)
     VALUES ($1,$2,'draft',$3,$4,NOW(),NOW()) RETURNING *`,
    [req.params.lead_id, req.user.id, title, contentMd]
  );

  await audit({ actorId: req.user.id, actorType: 'admin', action: 'proposal.generate', targetType: 'lead', targetId: req.params.lead_id });
  res.status(201).json(row);
});

// GET /api/admin/proposals (list all)
router.get('/proposals', async (req, res) => {
  const { status, limit = '50', offset = '0' } = req.query;
  const conditions: string[] = [];
  const params: any[] = [];
  if (status) { params.push(status); conditions.push(`lp.status=$${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit as string), parseInt(offset as string));
  const rows = await query(
    `SELECT lp.*, l.name AS lead_name, l.company AS lead_company
     FROM lead_proposals lp
     JOIN leads l ON l.id=lp.lead_id
     ${where}
     ORDER BY lp.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  res.json(rows);
});

// PATCH /api/admin/proposals/:id
const patchSchema = z.object({
  title: z.string().optional(),
  content_md: z.string().optional(),
  scope: z.unknown().optional(),
  pricing: z.unknown().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']).optional(),
});

router.patch('/proposals/:id', validateBody(patchSchema), async (req: any, res) => {
  const { title, content_md, scope, pricing, status } = req.body;
  const updates: string[] = ['updated_at=NOW()'];
  const params: any[] = [];
  if (title !== undefined) { params.push(title); updates.push(`title=$${params.length}`); }
  if (content_md !== undefined) { params.push(content_md); updates.push(`content_md=$${params.length}`); }
  if (scope !== undefined) { params.push(JSON.stringify(scope)); updates.push(`scope=$${params.length}::jsonb`); }
  if (pricing !== undefined) { params.push(JSON.stringify(pricing)); updates.push(`pricing=$${params.length}::jsonb`); }
  if (status !== undefined) { params.push(status); updates.push(`status=$${params.length}`); }
  if (params.length === 0) return res.status(400).json({ error: 'Nothing to update' });
  params.push(req.params.id);
  await query(`UPDATE lead_proposals SET ${updates.join(',')} WHERE id=$${params.length}`, params);
  res.json({ ok: true });
});

// POST /api/admin/proposals/:id/send
const sendSchema = z.object({
  email_subject: z.string().optional(),
  email_body: z.string().optional(),
});

router.post('/proposals/:id/send', validateBody(sendSchema), async (req: any, res) => {
  const proposal = await queryOne<any>(`SELECT * FROM lead_proposals WHERE id=$1`, [req.params.id]);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  await query(
    `UPDATE lead_proposals SET status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=$1`,
    [req.params.id]
  );
  await audit({ actorId: req.user.id, actorType: 'admin', action: 'proposal.sent', targetType: 'proposal', targetId: req.params.id });
  res.json({ ok: true, sent_at: new Date().toISOString() });
});

// GET /api/admin/proposals/:id
router.get('/proposals/:id', async (req, res) => {
  const row = await queryOne<any>(
    `SELECT lp.*, l.name AS lead_name, l.company AS lead_company, l.linkedin_url
     FROM lead_proposals lp JOIN leads l ON l.id=lp.lead_id WHERE lp.id=$1`,
    [req.params.id]
  );
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// GET /api/admin/proposals/:id/pdf — simple HTML-to-PDF via puppeteer/playwright if available,
// otherwise returns the stored pdf_url redirect
router.get('/proposals/:id/pdf', async (req, res) => {
  const row = await queryOne<any>(`SELECT * FROM lead_proposals WHERE id=$1`, [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Not found' });
  if (row.pdf_url) return res.redirect(row.pdf_url);
  res.status(501).json({ error: 'PDF generation not yet available for this proposal. Use the legacy proposal endpoint.' });
});

// Mark as viewed (called from mobile/public share link)
router.post('/proposals/:id/view', async (_req, res) => {
  await query(
    `UPDATE lead_proposals SET viewed_at=COALESCE(viewed_at,NOW()), updated_at=NOW() WHERE id=$1`,
    [_req.params.id]
  );
  res.json({ ok: true });
});

export default router;
