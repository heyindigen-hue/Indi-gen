-- User preferences, branding, and 2FA columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{"push":true,"email":true,"events":{"lead":true,"reply":true,"scrape":true,"low_tokens":true,"trial":true}}',
  ADD COLUMN IF NOT EXISTS branding_data JSONB,
  ADD COLUMN IF NOT EXISTS totp_secret TEXT,
  ADD COLUMN IF NOT EXISTS totp_recovery_codes TEXT[],
  ADD COLUMN IF NOT EXISTS totp_enabled_at TIMESTAMPTZ;

-- Support tickets for feedback
CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject     TEXT NOT NULL DEFAULT 'Feedback',
  body        TEXT NOT NULL,
  rating      INT CHECK (rating BETWEEN 1 AND 5),
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
