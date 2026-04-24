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

  let jobId: string;
  try {
    const resp = await axios.post(`${config.scraperServiceUrl}/scrape/search`, {
      query: searchQuery, filters, limit,
      webhook_url: `${process.env.PUBLIC_URL || ''}/webhook/signalhire`,
    }, { timeout: 10000 });
    jobId = resp.data.job_id;
  } catch (err: any) {
    await refundTokens({ userId: req.user.id, amount: limit, reason: 'scrape_failed_start', idempotencyKey: `scrape:refund:${req.user.id}:${Date.now()}` });
    return res.status(502).json({ error: 'Scraper service unavailable', detail: err.message });
  }

  const job = await queryOne<any>(
    `INSERT INTO scrape_jobs (job_id, user_id, search_query, filters, requested_count, status, token_reserve)
     VALUES ($1,$2,$3,$4,$5,'running',$6) RETURNING *`,
    [jobId, req.user.id, searchQuery, JSON.stringify(filters || {}), limit, limit]
  );

  res.status(202).json({ jobId, status: 'running', requestedCount: limit });
});

router.get('/jobs/:id', async (req: any, res) => {
  const job = await queryOne<any>(
    `SELECT * FROM scrape_jobs WHERE job_id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  if (!job) return res.status(404).json({ error: 'Job not found' });

  let scraperData: any = null;
  try {
    const resp = await axios.get(`${config.scraperServiceUrl}/scrape/jobs/${req.params.id}`, { timeout: 5000 });
    scraperData = resp.data;
  } catch {}

  if (scraperData && scraperData.status === 'completed' && job.status !== 'completed') {
    const leads = scraperData.results || [];
    for (const lead of leads) {
      await query(
        `INSERT INTO leads (full_name, email, phone, company, title, linkedin_url, owner_id, source, scrape_job_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'scrape',$8,'new')
         ON CONFLICT (linkedin_url, owner_id) DO NOTHING`,
        [
          lead.full_name || lead.name || null,
          lead.email || null,
          lead.phone || null,
          lead.company || null,
          lead.title || null,
          lead.linkedin_url || null,
          job.user_id,
          job.id,
        ]
      );
    }

    const actualCount = leads.length;
    const refundCount = Math.max(0, job.token_reserve - actualCount);
    if (refundCount > 0) {
      await refundTokens({
        userId: job.user_id,
        amount: refundCount,
        reason: 'scrape_under_delivery',
        idempotencyKey: `scrape:refund:${job.job_id}`,
      });
    }

    await query(
      `UPDATE scrape_jobs SET status='completed', actual_count=$1, completed_at=NOW() WHERE job_id=$2`,
      [actualCount, req.params.id]
    );
    job.status = 'completed';
    job.actual_count = actualCount;
  } else if (scraperData?.status === 'failed' && job.status !== 'failed') {
    await refundTokens({
      userId: job.user_id,
      amount: job.token_reserve,
      reason: 'scrape_job_failed',
      idempotencyKey: `scrape:refund:${job.job_id}`,
    });
    await query(`UPDATE scrape_jobs SET status='failed', completed_at=NOW() WHERE job_id=$1`, [req.params.id]);
    job.status = 'failed';
  }

  res.json({ ...job, scraperStatus: scraperData?.status || null });
});

router.get('/jobs', async (req: any, res) => {
  const { limit = '20', offset = '0' } = req.query;
  const jobs = await query(
    `SELECT * FROM scrape_jobs WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [req.user.id, parseInt(limit as string), parseInt(offset as string)]
  );
  res.json(jobs);
});

export default router;
