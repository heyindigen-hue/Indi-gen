import { query } from '../db/client';

/**
 * Search-phrase rotation. Each scrape run picks N oldest-used phrases.
 * Lifted from old VPS scraper, adapted to new schema (search_phrases.platform
 * column added in migration 013).
 */

export interface SearchPhrase {
  id: number;
  platform: string;
  phrase: string;
  icp_tag: string | null;
  enabled: boolean;
  last_used_at: string | null;
  total_runs: number;
  total_posts: number;
  total_new_leads: number;
  created_at: string;
  user_id?: string | null;
}

export async function pickPhrases(platform: string, n: number, phraseIds?: number[]): Promise<SearchPhrase[]> {
  if (phraseIds?.length) {
    return query(
      `SELECT * FROM search_phrases
       WHERE id = ANY($1::int[]) AND enabled = true AND platform = $2`,
      [phraseIds, platform]
    );
  }
  return query(
    `SELECT * FROM search_phrases
     WHERE platform = $1 AND enabled = true
     ORDER BY last_used_at NULLS FIRST, id
     LIMIT $2`,
    [platform, n]
  );
}

export async function recordPhraseRun(phraseId: number, postsFound: number): Promise<void> {
  await query(
    `UPDATE search_phrases
     SET last_used_at = NOW(),
         total_runs = total_runs + 1,
         total_posts = total_posts + $2
     WHERE id = $1`,
    [phraseId, postsFound]
  );
}

export async function recordPhraseYield(phraseId: number, newLeadsCount: number): Promise<void> {
  if (newLeadsCount === 0) return;
  await query(
    `UPDATE search_phrases
     SET total_new_leads = total_new_leads + $2
     WHERE id = $1`,
    [phraseId, newLeadsCount]
  );
}

export async function autoRetireDudPhrases(): Promise<number> {
  const rows = await query(
    `UPDATE search_phrases
     SET enabled = false
     WHERE enabled = true
       AND total_runs >= 5
       AND total_new_leads = 0
     RETURNING id`
  );
  return rows.length;
}

export function phraseToSearchUrl(platform: string, phrase: string): string {
  const clean = phrase.trim();
  const enc = encodeURIComponent(clean);
  switch (platform) {
    case 'linkedin':
      if (/^https?:\/\/www\.linkedin\.com\//i.test(clean)) return clean;
      return `https://www.linkedin.com/search/results/content/?keywords=${enc}&sortBy=date`;
    case 'reddit':
      if (/^https?:\/\/(www\.)?reddit\.com\//i.test(clean)) return clean;
      return `https://www.reddit.com/r/Entrepreneur+startups+SaaS+shopify/search/?q=${enc}&sort=new&restrict_sr=1`;
    default:
      return clean;
  }
}
