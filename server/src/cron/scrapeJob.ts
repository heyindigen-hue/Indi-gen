import cron from 'node-cron';
import axios from 'axios';
import { query } from '../db/client';
import { config } from '../config';
import { logger } from '../logger';
import { refundTokens } from '../services/tokens';
import { scrapeAllLeads } from '../scraper';
import { autoRetireDudPhrases } from '../scraper/phrases';

async function pollRunningJobs(): Promise<void> {
  const runs = await query(
    `SELECT * FROM scraper_runs WHERE status='running' AND started_at > NOW()-INTERVAL '2 hours'`
  );

  for (const run of runs) {
    const runLog = run.run_log
      ? typeof run.run_log === 'string'
        ? JSON.parse(run.run_log)
        : run.run_log
      : {};
    const externalJobId: string | undefined = runLog.job_id;
    const tokenReserve: number = runLog.token_reserve || 0;

    if (!externalJobId) continue; // not a SignalHire-backed job

    try {
      const resp = await axios.get(`${config.scraperServiceUrl}/scrape/jobs/${externalJobId}`, {
        timeout: 5000,
      });
      const scraperData = resp.data;

      if (scraperData.status === 'completed') {
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
            idempotencyKey: `scrape:refund:cron:${run.id}`,
          });
        }

        await query(
          `UPDATE scraper_runs SET status='completed', leads_kept=$1, finished_at=NOW() WHERE id=$2`,
          [leadsKept, run.id]
        );
        logger.info({ runId: run.id, externalJobId, leadsInserted: leadsKept }, 'Scrape job completed via cron poll');
      } else if (scraperData.status === 'failed') {
        if (tokenReserve > 0) {
          await refundTokens({
            userId: run.user_id,
            amount: tokenReserve,
            reason: 'scrape_job_failed',
            idempotencyKey: `scrape:refund:cron:${run.id}`,
          });
        }
        await query(`UPDATE scraper_runs SET status='failed', finished_at=NOW() WHERE id=$1`, [run.id]);
        logger.warn({ runId: run.id, externalJobId }, 'Scrape job failed');
      }
    } catch (err: any) {
      logger.error({ err: err.message, runId: run.id, externalJobId }, 'Cron: error polling scrape job');
    }
  }
}

async function timeoutStaleJobs(): Promise<void> {
  const stale = await query(
    `SELECT id, user_id, run_log FROM scraper_runs
     WHERE status='running' AND started_at < NOW()-INTERVAL '2 hours'`
  );

  for (const run of stale) {
    const runLog = run.run_log
      ? typeof run.run_log === 'string'
        ? JSON.parse(run.run_log)
        : run.run_log
      : {};
    const tokenReserve: number = runLog.token_reserve || 0;

    if (tokenReserve > 0) {
      await refundTokens({
        userId: run.user_id,
        amount: tokenReserve,
        reason: 'scrape_timeout',
        idempotencyKey: `scrape:timeout:${run.id}`,
      });
    }
    await query(
      `UPDATE scraper_runs SET status='failed', error_msg='timed out', finished_at=NOW() WHERE id=$1`,
      [run.id]
    );
    logger.warn({ runId: run.id }, 'Scrape job timed out');
  }
}

async function runLinkedInRubricScrape(): Promise<void> {
  try {
    const result = await scrapeAllLeads({ triggerSource: 'cron' });
    logger.info(
      {
        runId: result.run_id,
        status: result.status,
        postsFound: result.posts_found,
        leadsAdded: result.leads_added,
        apifySpendUsd: result.apify_spend_usd,
        keyLabel: result.apify_key_label,
      },
      'LinkedIn rubric scrape: cron run finished'
    );
  } catch (err: any) {
    logger.error({ err: err.message }, 'LinkedIn rubric scrape: cron run errored');
  }
}

async function runPhraseAutoRetire(): Promise<void> {
  try {
    const retired = await autoRetireDudPhrases();
    if (retired) logger.info({ retired }, 'Phrase rotation: auto-retired dud phrases');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Phrase auto-retire errored');
  }
}

export function startScrapeJobCron(): void {
  // SignalHire-backed legacy: poll running jobs every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      await pollRunningJobs();
    } catch (e: any) {
      logger.error({ err: e.message }, 'Scrape poll cron error');
    }
  });

  // SignalHire-backed legacy: timeout stale jobs every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      await timeoutStaleJobs();
    } catch (e: any) {
      logger.error({ err: e.message }, 'Scrape timeout cron error');
    }
  });

  // Apify rubric scraper — fires every 12 hours (07:00 IST + 19:00 IST → 01:30 UTC + 13:30 UTC)
  // node-cron doesn't honor IST natively; using UTC approximation that lands inside IST scraping window
  if (process.env.SCRAPE_LINKEDIN_RUBRIC_DISABLED !== '1') {
    cron.schedule('30 1,13 * * *', runLinkedInRubricScrape);
    logger.info('LinkedIn rubric scrape scheduled at 01:30 UTC + 13:30 UTC (07:00 + 19:00 IST)');
  }

  // Phrase auto-retire — once a day at 04:00 UTC (09:30 IST)
  cron.schedule('0 4 * * *', runPhraseAutoRetire);

  logger.info('Scrape job cron started');
}
