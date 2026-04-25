import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { query } from '../db/client';

/**
 * Admin endpoints that were stubbed/missing in POLISH2 — restored here
 * with sensible JSON shapes so the frontend stops hitting 404s.
 */

const router = Router();

// ── 1. /api/admin/leads — admin-wide leads list ─────────────────────────────

router.get('/leads', async (req, res) => {
  const {
    status,
    icp,
    icp_type,
    score_min,
    q,
    sort,
    platform,
    owner_id,
    limit = '50',
    offset = '0',
  } = req.query;

  const conditions: string[] = ['1=1'];
  const params: any[] = [];

  if (status) {
    params.push(status);
    conditions.push(`l.status = $${params.length}`);
  }
  if (icp === 'true') conditions.push('l.icp_type IS NOT NULL');
  if (icp_type) {
    params.push(icp_type);
    conditions.push(`l.icp_type = $${params.length}`);
  }
  if (score_min) {
    params.push(parseInt(score_min as string));
    conditions.push(`l.score >= $${params.length}`);
  }
  if (platform === 'linkedin') {
    conditions.push(
      `((l.profile_data->>'old_platform' = 'linkedin') OR ` +
        `(l.profile_data->>'old_platform' IS NULL AND l.linkedin_url ILIKE '%linkedin.com/in/%'))`
    );
  } else if (platform) {
    params.push(platform);
    conditions.push(`l.profile_data->>'old_platform' = $${params.length}`);
  }
  if (owner_id) {
    params.push(owner_id);
    conditions.push(`l.owner_id = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const idx = params.length;
    conditions.push(
      `(l.name ILIKE $${idx} OR l.company ILIKE $${idx} OR l.linkedin_url ILIKE $${idx})`
    );
  }

  const orderBy =
    sort === 'score' ? 'l.score DESC NULLS LAST, l.created_at DESC' : 'l.created_at DESC';

  const where = conditions.join(' AND ');
  params.push(parseInt(limit as string), parseInt(offset as string));
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const leads = await query(
    `SELECT l.id, l.owner_id, u.email AS owner_email,
            l.name, l.headline, l.company, l.linkedin_url,
            l.score, l.icp_type, l.status, l.enrichment_status,
            l.phrase_id, l.profile_data->>'old_platform' AS platform,
            l.created_at, l.updated_at,
            COUNT(*) OVER() AS total_count
     FROM leads l
     LEFT JOIN users u ON u.id = l.owner_id
     WHERE ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  const total = leads[0]?.total_count || 0;
  res.json({
    leads: leads.map(({ total_count, ...l }) => l),
    total: parseInt(total),
    limit: parseInt(limit as string),
    offset: parseInt(offset as string),
  });
});

// ── 2. /api/admin/scrapers — scraper_runs grouped by phrase + activity ──────

router.get('/scrapers', async (req, res) => {
  const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);

  const [recentRuns, byPhrase, summary, byKey] = await Promise.all([
    query(
      `SELECT r.id, r.user_id, u.email AS user_email,
              r.trigger, r.source, r.platform, r.status,
              r.posts_found, r.leads_kept, r.tokens_spent,
              r.apify_spend_usd, r.cost_usd, r.duration_ms,
              r.error_msg, r.started_at, r.finished_at,
              r.phrase_id, sp.phrase AS phrase_text,
              r.apify_key_id, r.apify_key_label
       FROM scraper_runs r
       LEFT JOIN users u ON u.id = r.user_id
       LEFT JOIN search_phrases sp ON sp.id = r.phrase_id
       ORDER BY r.started_at DESC
       LIMIT $1`,
      [limit]
    ),
    query(
      `SELECT sp.id AS phrase_id, sp.phrase, sp.platform, sp.icp_tag,
              sp.enabled, sp.last_used_at, sp.total_runs, sp.total_posts,
              sp.total_new_leads,
              COUNT(r.id)::int AS recent_runs_count,
              COALESCE(SUM(r.posts_found),0)::int AS recent_posts_found,
              COALESCE(SUM(r.leads_kept),0)::int AS recent_leads_kept
       FROM search_phrases sp
       LEFT JOIN scraper_runs r ON r.phrase_id = sp.id AND r.started_at > NOW() - INTERVAL '7 days'
       GROUP BY sp.id
       ORDER BY sp.total_new_leads DESC, sp.last_used_at DESC NULLS LAST
       LIMIT 100`
    ),
    query(
      `SELECT
         COUNT(*) FILTER (WHERE status='completed' AND started_at > NOW()-INTERVAL '24h')::int AS runs_24h_completed,
         COUNT(*) FILTER (WHERE status='failed' AND started_at > NOW()-INTERVAL '24h')::int AS runs_24h_failed,
         COALESCE(SUM(posts_found) FILTER (WHERE started_at > NOW()-INTERVAL '24h'),0)::int AS posts_24h,
         COALESCE(SUM(leads_kept) FILTER (WHERE started_at > NOW()-INTERVAL '24h'),0)::int AS leads_24h,
         COALESCE(SUM(apify_spend_usd) FILTER (WHERE started_at > NOW()-INTERVAL '30 days'),0) AS apify_spend_30d
       FROM scraper_runs`
    ),
    query(
      `SELECT apify_key_label,
              COUNT(*)::int AS runs,
              COALESCE(SUM(posts_found),0)::int AS posts,
              COALESCE(SUM(leads_kept),0)::int AS leads,
              COALESCE(SUM(apify_spend_usd),0) AS spend
       FROM scraper_runs
       WHERE started_at > NOW() - INTERVAL '30 days' AND apify_key_label IS NOT NULL
       GROUP BY apify_key_label
       ORDER BY spend DESC`
    ),
  ]);

  res.json({
    summary: summary[0] || {},
    recent_runs: recentRuns,
    by_phrase: byPhrase,
    by_key: byKey,
  });
});

// ── 3. /api/admin/billing — subscriptions + invoices + token grants ─────────

router.get('/billing', async (_req, res) => {
  const [planSummary, subscriptions, invoicesRecent, tokenGrants, tokenBurn, mrrRow] = await Promise.all([
    query(
      `SELECT p.id AS plan_id, p.name, p.price_inr, p.tokens_included,
              COUNT(s.id) FILTER (WHERE s.status='active')::int AS active_count,
              COUNT(s.id) FILTER (WHERE s.status='cancelled')::int AS cancelled_count,
              COUNT(s.id)::int AS total_count
       FROM subscription_plans p
       LEFT JOIN subscriptions s ON s.plan_id = p.id
       WHERE p.enabled IS NOT FALSE
       GROUP BY p.id
       ORDER BY p.sort_order, p.price_inr`
    ),
    query(
      `SELECT s.id, s.user_id, u.email AS user_email, p.name AS plan_name,
              s.status, s.current_period_start, s.current_period_end,
              s.cancel_at_period_end, s.created_at
       FROM subscriptions s
       JOIN subscription_plans p ON p.id = s.plan_id
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC LIMIT 50`
    ),
    query(
      `SELECT i.id, i.user_id, u.email AS user_email, i.invoice_number,
              i.status, i.subtotal, i.total, i.currency, i.issued_at, i.paid_at, i.created_at
       FROM invoices i
       LEFT JOIN users u ON u.id = i.user_id
       ORDER BY i.created_at DESC LIMIT 50`
    ),
    query(
      `SELECT g.id, g.user_id, u.email AS user_email,
              g.amount, g.source, g.granted_at, g.expires_at
       FROM token_grants g
       LEFT JOIN users u ON u.id = g.user_id
       ORDER BY g.granted_at DESC LIMIT 50`
    ),
    query(
      `SELECT
         COALESCE(SUM(delta) FILTER (WHERE delta < 0 AND created_at > NOW()-INTERVAL '24h'),0)::bigint AS burn_24h,
         COALESCE(SUM(delta) FILTER (WHERE delta < 0 AND created_at > NOW()-INTERVAL '30 days'),0)::bigint AS burn_30d,
         COALESCE(SUM(delta) FILTER (WHERE delta > 0 AND created_at > NOW()-INTERVAL '30 days'),0)::bigint AS grants_30d
       FROM token_transactions`
    ),
    query(
      `SELECT COALESCE(SUM(p.price_inr),0)::numeric AS mrr_inr
       FROM subscriptions s
       JOIN subscription_plans p ON p.id=s.plan_id
       WHERE s.status='active'`
    ),
  ]);

  const burnRow = tokenBurn[0] || { burn_24h: 0, burn_30d: 0, grants_30d: 0 };
  res.json({
    summary: {
      mrr_inr: parseFloat(mrrRow[0]?.mrr_inr || '0'),
      tokens_burned_24h: Math.abs(parseInt(burnRow.burn_24h || '0')),
      tokens_burned_30d: Math.abs(parseInt(burnRow.burn_30d || '0')),
      tokens_granted_30d: parseInt(burnRow.grants_30d || '0'),
    },
    plans: planSummary,
    subscriptions,
    invoices_recent: invoicesRecent,
    token_grants_recent: tokenGrants,
  });
});

// ── 4. /api/admin/widgets — list mobile widgets defined in code ─────────────

const STATIC_WIDGET_CATALOG: Array<{ id: string; name: string; category: string; description: string }> = [
  { id: 'TokenBalance', name: 'Token Balance', category: 'metric', description: 'Shows the current user token balance and forecast' },
  { id: 'AnnouncementBanner', name: 'Announcement Banner', category: 'banner', description: 'Top-of-feed announcement card with CTA' },
  { id: 'QuickFilters', name: 'Quick Filters', category: 'control', description: 'Inline filter chips (status, ICP, score)' },
  { id: 'LeadSwipeStack', name: 'Lead Swipe Stack', category: 'feed', description: 'Tinder-style swipe deck for triaging leads' },
  { id: 'RecentLeadsCarousel', name: 'Recent Leads Carousel', category: 'feed', description: 'Horizontal carousel of recent leads' },
  { id: 'ActionButtons', name: 'Action Buttons', category: 'control', description: 'Set of CTA buttons (scrape, search, settings)' },
  { id: 'MetricCard', name: 'Metric Card', category: 'metric', description: 'Single number with delta + sparkline' },
  { id: 'Divider', name: 'Divider', category: 'layout', description: 'Horizontal rule separator' },
  { id: 'Spacer', name: 'Spacer', category: 'layout', description: 'Vertical spacing element' },
  { id: 'HeroBanner', name: 'Hero Banner', category: 'banner', description: 'Full-width hero with image + CTA' },
  { id: 'ProfileCard', name: 'Profile Card', category: 'identity', description: 'User profile summary card' },
  { id: 'StatGrid', name: 'Stat Grid', category: 'metric', description: '2x2 or 3x2 grid of metrics' },
  { id: 'ProposalCard', name: 'Proposal Card', category: 'feed', description: 'Proposal summary with status pill' },
  { id: 'ReferralBanner', name: 'Referral Banner', category: 'growth', description: 'Refer-a-friend prompt with reward' },
  { id: 'ChartCard', name: 'Chart Card', category: 'metric', description: 'Generic chart container (line/bar/area)' },
  { id: 'SearchBar', name: 'Search Bar', category: 'control', description: 'Top-bar search input' },
  { id: 'ActivityFeed', name: 'Activity Feed', category: 'feed', description: 'Timeline of recent events' },
  { id: 'LessonCard', name: 'Lesson Card', category: 'learn', description: 'Onboarding/learning lesson card' },
  { id: 'StreakCounter', name: 'Streak Counter', category: 'gamification', description: 'Daily/weekly streak indicator' },
  { id: 'TrendingPhrases', name: 'Trending Phrases', category: 'metric', description: 'Top-performing search phrases' },
  { id: 'SuggestedLeads', name: 'Suggested Leads', category: 'feed', description: 'AI-suggested leads block' },
  { id: 'ChannelMix', name: 'Channel Mix', category: 'metric', description: 'Outreach channel mix donut' },
  { id: 'TokenForecast', name: 'Token Forecast', category: 'metric', description: 'Projected token burn for the period' },
  { id: 'VideoCard', name: 'Video Card', category: 'media', description: 'Video thumbnail + title' },
  { id: 'TestimonialQuote', name: 'Testimonial Quote', category: 'social', description: 'Customer testimonial pull-quote' },
  { id: 'FollowupReminder', name: 'Followup Reminder', category: 'feed', description: 'Reminder to follow up with a lead' },
  { id: 'WhatsNewCard', name: "What's New", category: 'banner', description: 'Release notes / new feature highlight' },
];

router.get('/widgets', (_req, res) => {
  // Enrich the static catalog by sniffing the live mobile/components/widgets dir
  const widgetsDir = path.resolve(__dirname, '../../../mobile/components/widgets');
  let liveSet = new Set<string>();
  try {
    const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith('.tsx') && f !== 'index.tsx');
    liveSet = new Set(files.map(f => f.replace(/\.tsx$/, '')));
  } catch {
    /* directory missing in some build artefacts — fall back to static catalog */
  }

  const widgets = STATIC_WIDGET_CATALOG.map(w => ({
    ...w,
    live_in_codebase: liveSet.has(w.id),
  }));

  // Add anything new that isn't in the catalog yet
  for (const live of liveSet) {
    if (!STATIC_WIDGET_CATALOG.find(w => w.id === live)) {
      widgets.push({
        id: live,
        name: live,
        category: 'unknown',
        description: 'Detected in mobile/components/widgets/ but not in catalog',
        live_in_codebase: true,
      });
    }
  }

  res.json({ count: widgets.length, widgets });
});

// ── 5. /api/admin/themes — list theme palettes ──────────────────────────────

const THEME_PALETTES: Array<{
  id: string;
  name: string;
  scheme: 'light' | 'dark';
  is_default: boolean;
  colors: Record<string, string>;
}> = [
  {
    id: 'warm-light',
    name: 'Warm Light',
    scheme: 'light',
    is_default: true,
    colors: {
      bg: '#F7F1E5',
      card: '#FBF7EE',
      border: 'rgba(14,14,12,0.10)',
      text: '#0E0E0C',
      muted: '#2A2823',
      dim: 'rgba(14,14,12,0.55)',
      primary: '#FF5A1F',
      primaryFg: '#FFFFFF',
      success: '#3E7C4B',
      warning: '#C88A10',
      destructive: '#C8301A',
    },
  },
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    scheme: 'dark',
    is_default: false,
    colors: {
      bg: '#0E0E0C',
      card: '#1A1815',
      border: 'rgba(247,241,229,0.10)',
      text: '#F7F1E5',
      muted: 'rgba(247,241,229,0.55)',
      dim: 'rgba(247,241,229,0.40)',
      primary: '#FF5A1F',
      primaryFg: '#FFFFFF',
      success: '#4CB782',
      warning: '#F2C94C',
      destructive: '#E5484D',
    },
  },
  {
    id: 'graphite',
    name: 'Graphite',
    scheme: 'dark',
    is_default: false,
    colors: {
      bg: '#08090B',
      card: '#111113',
      border: '#1F1F23',
      text: '#F7F8F8',
      muted: '#8A8F98',
      dim: 'rgba(247,248,248,0.40)',
      primary: '#FF5A1F',
      primaryFg: '#FFFFFF',
      success: '#4CB782',
      warning: '#F2C94C',
      destructive: '#E5484D',
    },
  },
  {
    id: 'vercel',
    name: 'Vercel',
    scheme: 'dark',
    is_default: false,
    colors: {
      bg: '#000000',
      card: '#0A0A0A',
      border: '#1F1F1F',
      text: '#EDEDED',
      muted: '#A1A1A1',
      dim: 'rgba(237,237,237,0.40)',
      primary: '#A3E635',
      primaryFg: '#000000',
      success: '#00C48C',
      warning: '#F5A524',
      destructive: '#FF4D4F',
    },
  },
  {
    id: 'cron',
    name: 'Cron',
    scheme: 'dark',
    is_default: false,
    colors: {
      bg: '#0B1020',
      card: '#141B30',
      border: '#1F2740',
      text: '#F4F6FB',
      muted: '#7D87A6',
      dim: 'rgba(244,246,251,0.40)',
      primary: '#4F8BFF',
      primaryFg: '#FFFFFF',
      success: '#2ED47A',
      warning: '#FFB020',
      destructive: '#F45B69',
    },
  },
];

router.get('/themes', (_req, res) => {
  res.json({
    count: THEME_PALETTES.length,
    palettes: THEME_PALETTES,
  });
});

// ── 6. /api/admin/assets — brand assets (icons + illustrations + logos) ─────

router.get('/assets', (_req, res) => {
  const brandRoot = path.resolve(__dirname, '../../../shared/brand');
  const brandUrl = '/brand'; // mounted in server/src/index.ts as static

  const collect = (subdir: string): Array<{ name: string; path: string; url: string; size_bytes: number; ext: string }> => {
    const dir = path.join(brandRoot, subdir);
    let files: string[] = [];
    try {
      files = fs.readdirSync(dir);
    } catch {
      return [];
    }
    return files
      .filter(f => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(f))
      .map(f => {
        const full = path.join(dir, f);
        const stat = (() => {
          try {
            return fs.statSync(full);
          } catch {
            return null;
          }
        })();
        const ext = path.extname(f).slice(1).toLowerCase();
        return {
          name: f,
          path: subdir ? `${subdir}/${f}` : f,
          url: subdir ? `${brandUrl}/${subdir}/${f}` : `${brandUrl}/${f}`,
          size_bytes: stat?.size ?? 0,
          ext,
        };
      });
  };

  const root = collect('');
  const icons = collect('icons');
  const illustrations = collect('illustrations');

  res.json({
    counts: {
      total: root.length + icons.length + illustrations.length,
      logos: root.length,
      icons: icons.length,
      illustrations: illustrations.length,
    },
    logos: root,
    icons,
    illustrations,
  });
});

export default router;
