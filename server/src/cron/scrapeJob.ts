import cron from 'node-cron';
import axios from 'axios';
import { query } from '../db/client';
import { config } from '../config';
import { logger } from '../logger';
import { refundTokens } from '../services/tokens';

async function pollRunningJobs(): Promise<void> {
  const jobs = await query(
    `SELECT * FROM scrape_jobs WHERE status='running' AND created_at > NOW()-INTERVAL '2 hours'`
  );

  for (const job of jobs) {
    try {
      const resp = await axios.get(`${config.scraperServiceUrl}/scrape/jobs/${job.job_id}`, { timeout: 5000 });
      const scraperData = resp.data;

      if (scraperData.status === 'completed') {
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
            idempotencyKey: `scrape:refund:cron:${job.job_id}`,
          });
        }

        await query(
          `UPDATE scrape_jobs SET status='completed', actual_count=$1, completed_at=NOW() WHERE id=$2`,
          [actualCount, job.id]
        );
        logger.info({ jobId: job.job_id, leadsInserted: actualCount }, 'Scrape job completed via cron poll');
      } else if (scraperData.status === 'failed') {
        await refundTokens({
          userId: job.user_id,
          amount: job.token_reserve,
          reason: 'scrape_job_failed',
          idempotencyKey: `scrape:refund:cron:${job.job_id}`,
        });
        await query(`UPDATE scrape_jobs SET status='failed', completed_at=NOW() WHERE id=$1`, [job.id]);
        logger.warn({ jobId: job.job_id }, 'Scrape job failed');
      }
    } catch (err: any) {
      logger.error({ err: err.message, jobId: job.job_id }, 'Cron: error polling scrape job');
    }
  }
}

async function timeoutStaleJobs(): Promise<void> {
  const stale = await query(
    `SELECT id, user_id, token_reserve, job_id FROM scrape_jobs
     WHERE status='running' AND created_at < NOW()-INTERVAL '2 hours'`
  );

  for (const job of stale) {
    await refundTokens({
      userId: job.user_id,
      amount: job.token_reserve,
      reason: 'scrape_timeout',
      idempotencyKey: `scrape:timeout:${job.job_id}`,
    });
    await query(`UPDATE scrape_jobs SET status='failed', completed_at=NOW() WHERE id=$1`, [job.id]);
    logger.warn({ jobId: job.job_id }, 'Scrape job timed out');
  }
}

export function startScrapeJobCron(): void {
  cron.schedule('*/2 * * * *', async () => {
    try { await pollRunningJobs(); } catch (e: any) { logger.error({ err: e.message }, 'Scrape poll cron error'); }
  });

  cron.schedule('*/30 * * * *', async () => {
    try { await timeoutStaleJobs(); } catch (e: any) { logger.error({ err: e.message }, 'Scrape timeout cron error'); }
  });

  logger.info('Scrape job cron started');
}
