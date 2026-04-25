-- ============================================================
-- Migration 013: Schema additions for lifted VPS scraper
-- - search_phrases.platform + icp_tag (for phrase rotation per platform)
-- - scraper_runs columns (phrase_id, apify_key_id, apify_spend_usd, platform)
-- - filter_rubric_history (Claude rubric weights)
-- ============================================================

-- search_phrases: add platform & icp_tag columns used by old VPS code
ALTER TABLE search_phrases ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'linkedin';
ALTER TABLE search_phrases ADD COLUMN IF NOT EXISTS icp_tag TEXT;
CREATE INDEX IF NOT EXISTS idx_search_phrases_platform_enabled ON search_phrases(platform, enabled, last_used_at NULLS FIRST);

-- scraper_runs: extra columns needed by lifted scraper
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS phrase_id INT REFERENCES search_phrases(id) ON DELETE SET NULL;
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS apify_key_id TEXT;
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS apify_key_label TEXT;
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS apify_spend_usd NUMERIC(10,4) DEFAULT 0;
ALTER TABLE scraper_runs ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'linkedin';
CREATE INDEX IF NOT EXISTS idx_scraper_runs_platform_started ON scraper_runs(platform, started_at DESC);

-- leads: ensure profile_data exists (already does in 001) — add filter_breakdown column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS filter_breakdown JSONB;

-- filter_rubric_history: tracks evolving rubric weights over time
CREATE TABLE IF NOT EXISTS filter_rubric_history (
  id SERIAL PRIMARY KEY,
  weights JSONB NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_filter_rubric_history_created ON filter_rubric_history(created_at DESC);
