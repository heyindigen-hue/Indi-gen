import { getSetting, getSettings, incrSetting } from '../db/settings';
import { query } from '../db/client';
import { logger } from '../logger';

/**
 * Claude Filter v2 — RUBRIC scoring (Option H from 2026-04-20 workflow redesign).
 * Lifted from old VPS scraper.
 *
 * SCORES leads on 4 dimensions (intent, fit, urgency, budget) with total 0-10,
 * and only drops SPAM. The app sorts by score. Founder feedback (qualified/dead)
 * retrains the prompt monthly.
 *
 * Output per lead (attached via `lead.filter_breakdown`):
 *   { intent: 0-3, fit: 0-3, urgency: 0-2, budget: 0-2, total_score: 0-10,
 *     quality: 'strong'|'medium'|'weak'|'spam', reasons: {...} }
 */

const MODEL = 'claude-haiku-4-5';

export type LeadClassification =
  | 'BUYER_PROJECT'
  | 'BUYER_BRAND'
  | 'INFORMATIONAL'
  | 'JOB_POSTING_FULLTIME'
  | 'SELF_PROMO'
  | 'JOB_SEEKER'
  | 'UNCLEAR';

export interface FilterBreakdown {
  classification: LeadClassification;
  intent: number;
  fit: number;
  urgency: number;
  budget: number;
  total_score: number;
  quality: 'strong' | 'medium' | 'weak' | 'spam';
  reasons: {
    intent?: string;
    fit?: string;
    urgency?: string;
    budget?: string;
    classification?: string;
    overall?: string;
  };
}

export interface ScrapedLead {
  name: string;
  linkedin_url: string;
  headline: string;
  company: string | null;
  post_text: string;
  post_url: string;
  post_date: string;
  score: number;
  icp_type: string | null;
  source_url_id: number | null;
  phrase_id?: number | null;
  platform?: string;
}

export interface ScoredLead extends ScrapedLead {
  filter_breakdown?: FilterBreakdown;
}

async function loadAIContext(): Promise<Record<string, string>> {
  return getSettings([
    'ai_context_pitch',
    'ai_context_case_studies',
    'ai_context_writing_style',
    'ai_context_banned_phrases',
    'ai_context_ideal_clients',
    'ai_context_signature',
  ]).catch(() => ({}));
}

async function loadRubricWeights(): Promise<{ intent: number; fit: number; urgency: number; budget: number }> {
  try {
    const rows = await query(
      `SELECT weights FROM filter_rubric_history ORDER BY created_at DESC LIMIT 1`
    );
    if (rows.length && rows[0].weights) {
      const w = rows[0].weights;
      return {
        intent: Number(w.intent) || 3,
        fit: Number(w.fit) || 3,
        urgency: Number(w.urgency) || 2,
        budget: Number(w.budget) || 2,
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return { intent: 3, fit: 3, urgency: 2, budget: 2 };
}

async function loadRejectionExamples(
  limit: number = 5
): Promise<Array<{ headline: string; post_text: string; reason: string | null }>> {
  try {
    return await query(
      `SELECT headline, post_text, reason
       FROM filter_feedback
       WHERE verdict='reject'
       ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
  } catch {
    return [];
  }
}

interface RubricResult {
  index: number;
  classification: LeadClassification;
  intent: number;
  fit: number;
  urgency: number;
  budget: number;
  quality: 'strong' | 'medium' | 'weak' | 'spam';
  reasons?: Record<string, string>;
}

async function scoreBatch(
  leads: ScrapedLead[],
  apiKey: string,
  examples: Awaited<ReturnType<typeof loadRejectionExamples>>,
  aiCtx: Record<string, string>,
  weights: Awaited<ReturnType<typeof loadRubricWeights>>
): Promise<Map<number, RubricResult>> {
  const postSummaries = leads.map((l, i) => ({
    index: i,
    platform: l.platform || 'linkedin',
    name: l.name,
    headline: l.headline?.substring(0, 120),
    post: l.post_text?.substring(0, 500),
  }));

  const rejectionBlock = examples.length
    ? `\n\nPREVIOUS TEAM REJECTIONS (examples to downweight — SPAM or WEAK quality):\n` +
      examples
        .slice(0, 5)
        .map(
          (ex, i) =>
            `${i + 1}. "${(ex.headline || '').substring(0, 80)}" · "${(ex.post_text || '').substring(0, 160)}"${ex.reason ? ` [${ex.reason}]` : ''}`
        )
        .join('\n')
    : '';

  const companyPitch = aiCtx.ai_context_pitch || 'Indigen Services — full-stack AI + SaaS dev agency.';
  const idealClients =
    aiCtx.ai_context_ideal_clients ||
    'D2C founders, SaaS startups needing MVP, SMEs with manual work, healthcare/logistics going digital, fintech, international SMBs.';

  const prompt = `You are the lead-qualification SCORING ANALYST for Indigen Services.
${companyPitch}

Our 8 Ideal Client Profiles (ICPs):
${idealClients}

=== STEP 1: CLASSIFY ===
90%+ of LinkedIn posts are spam (opinion, self-promo, job postings). Only
a small fraction are real buyers. Be AGGRESSIVE — when in doubt, pick the
spam label. UNCLEAR is only for truly unreadable posts.

Pick ONE label. Apply rules in this order, first match wins:

1. JOB_POSTING_FULLTIME — post contains ANY of: "CTC", "LPA", "apply now",
   "send CV", "send resume", "3+ years experience", "permanent role",
   "joining date", "hybrid role", "in-office", "we are hiring", "#hiring"
   → spam, dropped

2. JOB_SEEKER — headline or post says: "Open to Work", "#OpenToWork",
   "available for hire", "looking for opportunities", "seeking role"
   → spam, dropped

3. SELF_PROMO — the POSTER is selling, not buying. Triggers:
   a) Headline contains: "Founder @ <agency>", "CEO of <studio>", "Full Stack Developer"
   b) Post uses: "I help", "I build", "we build", "we help", "our agency", "DM me"
   c) Post is a CASE STUDY of their own work, or a product launch they did
   → spam, dropped

4. INFORMATIONAL — thought leadership / opinion / tutorials / news commentary
   No explicit hiring ask. Post is about industry, trends, analysis.
   → spam, dropped

5. BUYER_PROJECT — GENUINE buyer with EXPLICIT ask to hire external dev.
   Must contain ask phrase: "looking for", "need a", "anyone know a good",
   "recommend a", "hiring freelancer for", "need to hire an agency".
   Must be a PROJECT/CONTRACT (not full-time hire — that's #1).
   Poster is a FOUNDER/CEO/CTO/owner at a non-agency company.
   → strong, kept

6. BUYER_BRAND — India D2C brand account. ALMOST NEVER fires on platform='linkedin'.
   → strong, kept

7. UNCLEAR — post is <15 words or non-English/unreadable.
   → weak, kept

=== STEP 2: RATE on rubric ===
Only if classification is BUYER_PROJECT or BUYER_BRAND. For all other classifications,
set all dims to 0 and quality='spam'.

INTENT (0-${weights.intent}) — explicit buyer language
FIT (0-${weights.fit}) — match to 8 ICPs
URGENCY (0-${weights.urgency}) — timeline signals
BUDGET (0-${weights.budget}) — budget/scale signals

QUALITY tag:
  strong = BUYER_PROJECT or BUYER_BRAND + total >= 7
  medium = BUYER_PROJECT or BUYER_BRAND + total 4-6
  weak   = BUYER_PROJECT or BUYER_BRAND + total 1-3, OR UNCLEAR
  spam   = INFORMATIONAL | JOB_POSTING_FULLTIME | SELF_PROMO | JOB_SEEKER

ONLY quality='spam' gets dropped. Everything else passes through, ranked by total_score.${rejectionBlock}

Posts to score:
${JSON.stringify(postSummaries, null, 2)}

Return ONLY a JSON array. Each element:
{
  "index": <number>,
  "classification": "BUYER_PROJECT"|"BUYER_BRAND"|"INFORMATIONAL"|"JOB_POSTING_FULLTIME"|"SELF_PROMO"|"JOB_SEEKER"|"UNCLEAR",
  "intent": 0-${weights.intent},
  "fit": 0-${weights.fit},
  "urgency": 0-${weights.urgency},
  "budget": 0-${weights.budget},
  "quality": "strong"|"medium"|"weak"|"spam",
  "reasons": {"classification":"<10 words>","intent":"<10 words>","fit":"<10 words>"}
}`;

  const results = new Map<number, RubricResult>();

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      logger.error({ status: res.status, err: err.substring(0, 200) }, 'Filter: Claude API error');
      return results;
    }
    const data = (await res.json()) as any;
    const text: string = data?.content?.[0]?.text || '[]';
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) {
      logger.warn('Filter: could not parse rubric JSON');
      return results;
    }
    const arr: RubricResult[] = JSON.parse(m[0]);
    for (const r of arr) {
      if (typeof r.index === 'number') results.set(r.index, r);
    }
  } catch (e: any) {
    logger.error({ err: e.message }, 'Filter: scoreBatch error');
  }
  return results;
}

/**
 * Filter + score leads with Claude rubric.
 *
 * @param includeSpam if true, spam-classified leads are KEPT in the output
 *   with their breakdown attached (caller must drop them). If false (default),
 *   spam leads are silently dropped.
 */
export async function filterLeadsWithClaude(
  leads: ScrapedLead[],
  opts: { includeSpam?: boolean } = {}
): Promise<ScoredLead[]> {
  if (!leads.length) return [];

  const apiKey = (await getSetting('claude_api_key')) || process.env.CLAUDE_API_KEY || '';
  if (!apiKey) {
    logger.warn('Filter: claude_api_key not set, passing all leads with default score');
    return leads as ScoredLead[];
  }

  const [examples, aiCtx, weights] = await Promise.all([
    loadRejectionExamples(5),
    loadAIContext(),
    loadRubricWeights(),
  ]);
  logger.info({ weights }, 'Filter: loaded rubric weights');

  const BATCH_SIZE = 8;
  const scored: ScoredLead[] = [];
  let spamDropped = 0;
  const qualityBuckets = { strong: 0, medium: 0, weak: 0, spam: 0 };
  const classBuckets: Record<string, number> = {};

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    const results = await scoreBatch(batch, apiKey, examples, aiCtx, weights);

    batch.forEach((lead, idx) => {
      const r = results.get(idx);
      if (!r) {
        // Claude failed for this lead — skip persisting fake breakdown.
        scored.push(lead as ScoredLead);
        logger.warn(
          { name: lead.name?.substring(0, 30) },
          'Filter: Claude failed for lead, leaving filter_breakdown null'
        );
        return;
      }
      const classification = r.classification || 'UNCLEAR';
      const isSpamClass = ['INFORMATIONAL', 'JOB_POSTING_FULLTIME', 'SELF_PROMO', 'JOB_SEEKER'].includes(
        classification
      );
      const isBuyerClass = classification === 'BUYER_PROJECT' || classification === 'BUYER_BRAND';
      const total = (r.intent || 0) + (r.fit || 0) + (r.urgency || 0) + (r.budget || 0);
      let quality: 'strong' | 'medium' | 'weak' | 'spam';
      if (isSpamClass) {
        quality = 'spam';
      } else if (isBuyerClass) {
        quality = total >= 7 ? 'strong' : total >= 4 ? 'medium' : 'weak';
      } else {
        quality = 'weak';
      }
      const breakdown: FilterBreakdown = {
        classification,
        intent: r.intent || 0,
        fit: r.fit || 0,
        urgency: r.urgency || 0,
        budget: r.budget || 0,
        total_score: isSpamClass ? 0 : Math.min(10, total),
        quality,
        reasons: r.reasons || {},
      };
      qualityBuckets[breakdown.quality]++;
      classBuckets[breakdown.classification] = (classBuckets[breakdown.classification] || 0) + 1;
      if (breakdown.quality === 'spam') {
        spamDropped++;
        if (!opts.includeSpam) return;
      }
      const enriched = { ...lead, filter_breakdown: breakdown } as ScoredLead;
      if (breakdown.total_score > (lead.score ?? 0)) {
        enriched.score = breakdown.total_score;
      }
      scored.push(enriched);
    });
  }

  incrSetting('filter_stats_in', leads.length).catch(() => {});
  incrSetting('filter_stats_kept', scored.length).catch(() => {});
  incrSetting('filter_stats_discarded', spamDropped).catch(() => {});

  logger.info(
    { in: leads.length, kept: scored.length, spamDropped, qualityBuckets, classBuckets },
    'Filter: rubric run complete'
  );
  return scored;
}

// ---------- Backwards-compat shim: simpler interface used by older code ----------

export interface RawLead {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  location?: string;
  summary?: string;
  [key: string]: any;
}

export interface FilteredLead extends RawLead {
  icp_score: number;
  is_icp: boolean;
  rejection_reason?: string;
}

interface FilterContext {
  icpCriteria: string;
  rejectionPatterns?: string[];
}

/**
 * Legacy filterLeads() — adapter that converts to ScrapedLead, runs the rubric
 * filter, and converts back to FilteredLead. Used by older callers.
 */
export async function filterLeads(leads: RawLead[], context: FilterContext): Promise<FilteredLead[]> {
  const apiKey = (await getSetting('claude_api_key')) || process.env.CLAUDE_API_KEY || '';
  if (!apiKey) {
    logger.warn('Anthropic API key not configured — passing through all leads as ICP');
    return leads.map(l => ({ ...l, icp_score: 50, is_icp: true }));
  }

  const scrapedLeads: ScrapedLead[] = leads.map(l => ({
    name: l.full_name || l.name || '',
    linkedin_url: l.linkedin_url || '',
    headline: l.title || '',
    company: l.company || null,
    post_text: l.summary || '',
    post_url: l.linkedin_url || '',
    post_date: new Date().toISOString(),
    score: 0,
    icp_type: null,
    source_url_id: null,
    platform: 'linkedin',
  }));

  const scored = await filterLeadsWithClaude(scrapedLeads, { includeSpam: true });
  const byIdx = new Map(scored.map((s, i) => [i, s]));

  return leads.map((lead, i) => {
    const sc = byIdx.get(i);
    const breakdown = sc?.filter_breakdown;
    if (!breakdown) {
      return { ...lead, icp_score: 50, is_icp: true };
    }
    const isIcp = breakdown.quality !== 'spam';
    const score100 = Math.round((breakdown.total_score / 10) * 100);
    return {
      ...lead,
      icp_score: score100,
      is_icp: isIcp,
      rejection_reason: isIcp ? undefined : breakdown.classification,
    };
  });
}

export async function learnRejection(lead: RawLead, reason: string): Promise<void> {
  logger.info({ lead: lead.linkedin_url || lead.email, reason }, 'Rejection learning recorded');
}
