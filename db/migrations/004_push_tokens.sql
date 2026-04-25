ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_platform TEXT CHECK (push_platform IN ('android', 'ios', 'web'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_push_token ON users (push_token) WHERE push_token IS NOT NULL;
