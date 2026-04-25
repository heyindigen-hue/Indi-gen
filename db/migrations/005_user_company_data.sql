-- Add company_data JSONB column and onboarding_completed_at to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_data JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- user_id column on search_phrases already exists in initial schema
-- Just ensure the index exists for fast per-user lookup
CREATE INDEX IF NOT EXISTS idx_search_phrases_user_id ON search_phrases(user_id);
