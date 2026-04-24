import { Router } from 'express';
import { z } from 'zod';
import axios from 'axios';
import { query, queryOne } from '../db/client';
import { config } from '../config';
import { validateBody } from '../middleware/validate';
import { consumeTokens, refundTokens } from '../services/tokens';

const router = Router();

const scrapeSchema = z.object({
  query: z.string().min(1),
  filters: z.object({
    location: z.string().optional(),
    industry: z.string().optional(),
    title: z.string().optional(),
    company_size: z.string().optional(),
  }).optional(),
  limit: z.number().int().min(1).max(100).default(10),
});

router.post('/', validateBody(scrapeSchema), async (req: any, res) => {
  const { query: searchQuery, filters, limit } = req.body;

  const reserved = await consumeTokens({
    userId: req.user.id,
    amount: limit,
    reason: 'scrape_reserve',
    idempotencyKey: `scrape:reserve:${req.user.id}:${Date.now()}`,
  });

  if (!reserved) return res.status(402).json({ error: 'Insufficient tokens' });

  // Create a scraper_runs row immediately so we have an id to reference
  const run = await queryOne<any>(
    `INSERT INTO scraper_runs (user_id, trigger, source, status, started_at)
     VALUES ($1,'manual','linkedin','running',NOW()) RETURNING id`,
    [req.user.id]
  );

  let externalJobId: string;
  try {
    const resp = await axios.post(`${config.scraperServiceUrl}/scrape/search`, {
      query: searchQuery, filters, limit,
      webhook_url: `${process.env.PUBLIC_URL || ''}/webhook/signalhire`,
    }, { timeout: 10000 });
    externalJobId = resp.data.job_id;
  } catch (err: any) {
    await refundTokens({ userId: req.user.id, amount: limit, reason: 'scrape_failed_start', idempotencyKey: `scrape:refund:${req.user.id}:${Date.now()}` });
    await query(`UPDATE scraper_runs SET status='failed', error_msg=$1, finished_at=NOW() WHERE id=$2`, [err.message, run.id]);
    return res.status(502).json({ error: 'Scraper service unavailable', detail: err.message });
  }

  // Store external job_id and token reserve in run_log for later polling
  await query(
    `UPDATE scraper_runs SET run_log=$1 WHERE id=$2`,
    [JSON.stringify({ job_id: externalJobId, token_reserve: limit }), run.id]
  );

  res.status(202).json({ jobId: run.id, status: 'running', requestedCount: limit });
});

router.get('/jobs/:id', async (req: any, res) => {
  const run = await queryOne<any>(
    `SELECT * FROM scraper_runs WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!run) return res.status(404).json({ error: 'Job not found' });

  const runLog = run.run_log ? (typeof run.run_log === 'string' ? JSON.parse(run.run_log) : run.run_log) : {};
  const externalJobId = runLog.job_id;
  const tokenReserve: number = runLog.token_reserve || 0;

  let scraperData: any = null;
  if (externalJobId) {
    try {
      const resp = await axios.get(`${config.scraperServiceUrl}/scrape/jobs/${externalJobId}`, { timeout: 5000 });
      scraperData = resp.data;
    } catch {}
  }

  if (scraperData && scraperData.status === 'completed' && run.status !== 'completed') {
    const leads = scraperData.results || [];
    for (const lead of leads) {
      await query(
        `INSERT INTO leads (name, company, headline, linkedin_url, owner_id, status)
         VALUES ($1,$2,$3,$4,$5,'new')
         ON CONFLICT (linkedin_url) DO NOTHING`,
        [
          lead.full_name || lead.name || null,
          lead.company || null,
          lead.title || lead.headline || null,
          lead.linkedin_url || null,
          run.user_id,
        ]
      );
    }

    const leadsKept = leads.length;
    const refundCount = Math.max(0, tokenReserve - leadsKept);
    if (refundCount > 0) {
      await refundTokens({
        userId: run.user_id,
        amount: refundCount,
        reason: 'scrape_under_delivery',
        idempotencyKey: `scrape:refund:${run.id}`,
      });
    }

    await query(
      `UPDATE scraper_runs SET status='completed', leads_kept=$1, finished_at=NOW() WHERE id=$2`,
      [leadsKept, run.id]
    );
    run.status = 'completed';
    run.leads_kept = leadsKept;
  } else if (scraperData?.status === 'failed' && run.status !== 'failed') {
    if (tokenReserve > 0) {
      await refundTokens({
        userId: run.user_id,
        amount: tokenReserve,
        reason: 'scrape_job_failed',
        idempotencyKey: `scrape:refund:${run.id}`,
      });
    }
    await query(`UPDATE scraper_runs SET status='failed', finished_at=NOW() WHERE id=$1`, [run.id]);
    run.status = 'failed';
  }

  res.json({ ...run, scraperStatus: scraperData?.status || null });
});

router.get('/jobs', async (req: any, res) => {
  const { limit = '20', offset = '0' } = req.query;
  const jobs = await query(
    `SELECT id, user_id, trigger, source, status, posts_found, leads_kept, tokens_spent, error_msg, started_at, finished_at
     FROM scraper_runs WHERE user_id=$1 ORDER BY started_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(jobs);
});

export default router;
