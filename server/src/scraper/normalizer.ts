import type { RawApifyPost } from './linkedinScraper';
import type { ScrapedLead } from './claudeFilter';
import { scoreLead, detectICP } from './scoreLead';

/**
 * Map raw Apify LinkedIn-post → ScrapedLead. Only keeps posts:
 *  - with author + profile id (so we get a stable URL)
 *  - within `maxAgeDays` (default 14)
 *  - with score >= 4 (cheap pre-filter before LLM)
 *
 * Adapted from the old VPS linkedinScraper.ts but split out so the
 * scoring layer is reusable per-phrase.
 */

interface NormalizeOpts {
  maxAgeDays?: number;
  minScore?: number;
  phraseId?: number | null;
  sourceUrlId?: number | null;
}

export function normalizePost(post: RawApifyPost, opts: NormalizeOpts = {}): ScrapedLead | null {
  const maxAgeDays = opts.maxAgeDays ?? 14;
  const minScore = opts.minScore ?? 4;

  if (!post.authorName || !post.authorProfileId) return null;
  const linkedinUrl = `https://www.linkedin.com/in/${post.authorProfileId}`;

  const postDate = post.postedAtISO || new Date().toISOString();
  const ageCutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  if (new Date(postDate).getTime() < ageCutoff) return null;

  const name: string = post.authorName || '';
  const headline: string = post.authorHeadline || (post.author && post.author.occupation) || '';
  const postText: string = (post.text || '').substring(0, 1000);
  const postUrl: string = post.url || linkedinUrl;
  const companyMatch = headline.match(/(?:at|@)\s*([^|,\n]+)/i);
  const company = companyMatch ? companyMatch[1].trim() : null;
  const score = scoreLead(name, headline, postText, company || '');
  if (score < minScore) return null;

  return {
    name,
    linkedin_url: linkedinUrl,
    headline,
    company,
    post_text: postText,
    post_url: postUrl,
    post_date: postDate,
    score,
    icp_type: detectICP(`${headline} ${postText}`) || 'D2C',
    source_url_id: opts.sourceUrlId ?? null,
    phrase_id: opts.phraseId ?? null,
    platform: 'linkedin',
  };
}

export function dedupeByUrl(leads: ScrapedLead[]): ScrapedLead[] {
  const seen = new Set<string>();
  const out: ScrapedLead[] = [];
  for (const l of leads) {
    if (seen.has(l.linkedin_url)) continue;
    seen.add(l.linkedin_url);
    out.push(l);
  }
  return out;
}
