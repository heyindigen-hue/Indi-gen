import { query, queryOne } from '../db/client';
import { logger } from '../logger';
import { isWithinScrapingHours } from './antiBlock';
import { pickActiveKey, recordRun, type ApifyKey } from './apifyKeys';
import {
  pickPhrases,
  recordPhraseRun,
  recordPhraseYield,
  phraseToSearchUrl,
  type SearchPhrase,
} from './phrases';
import { runApifyScrape } from './linkedinScraper';
import { normalizePost, dedupeByUrl } from './normalizer';
import { filterLeadsWithClaude, type ScoredLead } from './claudeFilter';
import { keepIfIN } from './geoFilter';

const PHRASES_PER_RUN = 5;
const LIMIT_PER_SOURCE = 25;
// $0.30/1k actor units; ~50 posts ≈ 1 unit. Conservative est. for tracking.
const APIFY_COST_PER_POST = 0.006;

export interface ScrapeRunResult {
  run_id: number;
  posts_found: number;
  leads_qualified: number;
  leads_filtered_out: number;
  leads_added: number;
  leads_geo_blocked: number;
  apify_key_id: string | null;
  apify_key_label: string | null;
  apify_spend_usd: number;
  phrases_used: Array<{ id: number; phrase: string }>;
  status: 'completed' | 'failed' | 'skipped';
  reason?: string;
  sample_leads?: Array<{ name: string; headline: string; score: number; quality: string | null }>;
}

interface ScrapeOptions {
  ownerId?: string | null;
  phraseIds?: number[];
  ignoreScrapingHours?: boolean;
  triggerSource?: 'manual' | 'cron' | 'api';
}

/**
 * Public entrypoint — pick best Apify key, rotate phrases, scrape, filter, insert.
 * Lifted from old VPS scrapeAllLeads() but adapted to new schema:
 *   - leads INSERT uses the existing `leads` table with profile_data JSONB
 *   - scraper_runs row tracks phrase + apify_key + spend
 *   - audit-style logging via pino
 */
export async function scrapeAllLeads(opts: ScrapeOptions = {}): Promise<ScrapeRunResult> {
  const startedAt = new Date();

  if (!opts.ignoreScrapingHours && !isWithinScrapingHours()) {
    logger.info('Scraper: outside IST scraping hours (07:00-23:00), skipping');
    return blankResult('skipped', 'outside_scraping_hours');
  }

  const apifyKey = await pickActiveKey();
  if (!apifyKey) {
    logger.warn('Scraper: no active Apify keys available');
    return blankResult('skipped', 'no_active_apify_key');
  }

  const phrases = await pickPhrases('linkedin', PHRASES_PER_RUN, opts.phraseIds);
  if (!phrases.length) {
    logger.warn('Scraper: no LinkedIn phrases configured');
    return blankResult('skipped', 'no_phrases');
  }

  // Pre-create scraper_runs row so we have a stable id to reference
  const runRow = await queryOne<any>(
    `INSERT INTO scraper_runs (user_id, trigger, source, status, platform, apify_key_id, apify_key_label, started_at)
     VALUES ($1, $2, 'linkedin', 'running', 'linkedin', $3, $4, NOW())
     RETURNING id`,
    [opts.ownerId || null, opts.triggerSource || 'cron', apifyKey.id, apifyKey.label]
  );
  const runId: number = runRow.id;

  try {
    const searchUrls = phrases.map(p => phraseToSearchUrl('linkedin', p.phrase));
    logger.info(
      { runId, key: apifyKey.label, phrases: phrases.map(p => p.phrase) },
      'Scraper: launching Apify run'
    );

    const apifyResult = await runApifyScrape(searchUrls, LIMIT_PER_SOURCE, apifyKey, 180);

    const rawPosts = apifyResult.posts;
    const postsFound = rawPosts.length;
    const apifySpendUsd = Number((postsFound * APIFY_COST_PER_POST).toFixed(4));

    await recordRun(apifyKey.id, postsFound, apifySpendUsd).catch(() => {});

    if (apifyResult.error) {
      await query(
        `UPDATE scraper_runs SET status='failed', error_msg=$1, finished_at=NOW(), apify_spend_usd=$2 WHERE id=$3`,
        [apifyResult.error.substring(0, 500), apifySpendUsd, runId]
      );
      return {
        ...blankResult('failed', apifyResult.error),
        run_id: runId,
        apify_key_id: apifyKey.id,
        apify_key_label: apifyKey.label,
        apify_spend_usd: apifySpendUsd,
      };
    }

    // Distribute postsFound evenly across the phrases used this run
    const perPhrasePosts = phrases.length ? Math.floor(postsFound / phrases.length) : 0;
    await Promise.all(phrases.map(p => recordPhraseRun(p.id, perPhrasePosts).catch(() => {})));

    // Best-effort phrase attribution by keyword overlap
    const phraseByKeyword = new Map<string, SearchPhrase>();
    for (const p of phrases) {
      const words = p.phrase.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      for (const w of words) phraseByKeyword.set(w, p);
    }

    const normalizedRaw = rawPosts
      .map(p => {
        const lead = normalizePost(p);
        if (!lead) return null;
        // Attribute to phrase
        let matched: SearchPhrase | null = null;
        const search = (lead.post_text + ' ' + lead.headline).toLowerCase();
        for (const [kw, ph] of phraseByKeyword) {
          if (search.includes(kw)) {
            matched = ph;
            break;
          }
        }
        lead.phrase_id = matched?.id ?? phrases[0]?.id ?? null;
        return lead;
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    const dedupeQualified = dedupeByUrl(normalizedRaw);

    // Geo filter (Pakistan-block per old VPS rule)
    const geoFiltered: typeof dedupeQualified = [];
    let geoBlocked = 0;
    for (const l of dedupeQualified) {
      if (keepIfIN(l)) {
        geoFiltered.push(l);
      } else {
        geoBlocked++;
      }
    }

    // Claude rubric filter — drops spam, scores rest
    const scored = await filterLeadsWithClaude(geoFiltered);

    // Persist into leads table
    const inserted: ScoredLead[] = [];
    for (const lead of scored) {
      const breakdown = lead.filter_breakdown;
      // Map breakdown.classification → intent_label + confidence (0..1) + reason
      const intentLabel = breakdown?.classification ?? null;
      const intentConfidence = breakdown
        ? Math.min(1, Math.max(0, breakdown.total_score / 10))
        : null;
      const intentReason =
        breakdown?.reasons?.classification ||
        breakdown?.reasons?.overall ||
        breakdown?.reasons?.intent ||
        null;

      const inserted_row = await queryOne<{ id: string } | null>(
        `INSERT INTO leads
           (name, headline, linkedin_url, company, post_text, post_url, post_date,
            score, icp_type, status, owner_id, phrase_id, profile_data, filter_breakdown,
            enrichment_status, intent_label, intent_confidence, intent_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'New',$10,$11,$12,$13,'pending',$14,$15,$16)
         ON CONFLICT (linkedin_url) DO NOTHING
         RETURNING id`,
        [
          lead.name,
          lead.headline,
          lead.linkedin_url,
          lead.company,
          lead.post_text,
          lead.post_url,
          lead.post_date,
          lead.score,
          lead.icp_type,
          opts.ownerId || null,
          lead.phrase_id,
          JSON.stringify({
            old_platform: 'linkedin',
            scraped_via: 'apify_supreme_coder',
            scraper_run_id: runId,
            phrase_id: lead.phrase_id,
            apify_key_id: apifyKey.id,
          }),
          breakdown ? JSON.stringify(breakdown) : null,
          intentLabel,
          intentConfidence,
          intentReason,
        ]
      );
      if (inserted_row) inserted.push(lead);
    }

    // Per-phrase yield
    const yieldByPhrase = new Map<number, number>();
    for (const lead of inserted) {
      if (lead.phrase_id) {
        yieldByPhrase.set(lead.phrase_id, (yieldByPhrase.get(lead.phrase_id) || 0) + 1);
      }
    }
    await Promise.all(
      Array.from(yieldByPhrase.entries()).map(([pid, n]) => recordPhraseYield(pid, n).catch(() => {}))
    );

    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();

    await query(
      `UPDATE scraper_runs
         SET status='completed',
             posts_found=$1,
             leads_kept=$2,
             apify_spend_usd=$3,
             cost_usd=$3,
             duration_ms=$4,
             finished_at=NOW(),
             phrase_id=$5,
             run_log=$6
       WHERE id=$7`,
      [
        postsFound,
        inserted.length,
        apifySpendUsd,
        durationMs,
        phrases[0]?.id ?? null,
        JSON.stringify({
          phrases_used: phrases.map(p => ({ id: p.id, phrase: p.phrase })),
          leads_qualified: scored.length,
          leads_filtered_out: scored.length - inserted.length,
          geo_blocked: geoBlocked,
        }),
        runId,
      ]
    );

    const sample = inserted.slice(0, 3).map(l => ({
      name: l.name,
      headline: l.headline.substring(0, 80),
      score: l.score,
      quality: l.filter_breakdown?.quality || null,
    }));

    logger.info(
      {
        runId,
        postsFound,
        leadsAdded: inserted.length,
        geoBlocked,
        apifySpendUsd,
        keyLabel: apifyKey.label,
      },
      'Scraper: run complete'
    );

    return {
      run_id: runId,
      posts_found: postsFound,
      leads_qualified: scored.length,
      leads_filtered_out: scored.length - inserted.length,
      leads_added: inserted.length,
      leads_geo_blocked: geoBlocked,
      apify_key_id: apifyKey.id,
      apify_key_label: apifyKey.label,
      apify_spend_usd: apifySpendUsd,
      phrases_used: phrases.map(p => ({ id: p.id, phrase: p.phrase })),
      status: 'completed',
      sample_leads: sample,
    };
  } catch (err: any) {
    logger.error({ err: err.message, runId }, 'Scraper: run threw');
    await query(
      `UPDATE scraper_runs SET status='failed', error_msg=$1, finished_at=NOW() WHERE id=$2`,
      [String(err?.message || 'unknown').substring(0, 500), runId]
    ).catch(() => {});
    return {
      ...blankResult('failed', err?.message || 'unknown'),
      run_id: runId,
      apify_key_id: apifyKey.id,
      apify_key_label: apifyKey.label,
    };
  }
}

/** Run a single phrase manually (used by per-phrase debug endpoints). */
export async function scrapeOnePhrase(phraseId: number, ownerId: string | null = null): Promise<ScrapeRunResult> {
  return scrapeAllLeads({ phraseIds: [phraseId], ownerId, triggerSource: 'manual', ignoreScrapingHours: true });
}

function blankResult(status: 'failed' | 'skipped' | 'completed', reason?: string): ScrapeRunResult {
  return {
    run_id: 0,
    posts_found: 0,
    leads_qualified: 0,
    leads_filtered_out: 0,
    leads_added: 0,
    leads_geo_blocked: 0,
    apify_key_id: null,
    apify_key_label: null,
    apify_spend_usd: 0,
    phrases_used: [],
    status,
    reason,
  };
}

export { keyStats, addKey, deleteKey, updateKey, loadKeys, maskKey } from './apifyKeys';
export { pickPhrases, autoRetireDudPhrases } from './phrases';
