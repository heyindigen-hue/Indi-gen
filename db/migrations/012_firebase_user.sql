-- Migration 012: Firebase phone-OTP support on the users table.
--
-- Adds:
--   * phone         — internationally-formatted phone (E.164)
--   * firebase_uid  — Firebase Auth UID for users who signed in via Firebase
--   * provider      — which auth provider seeded the row ('email' | 'phone' | 'firebase')
--
-- The existing 001_initial_schema.sql already declares `phone TEXT` (no UNIQUE),
-- so we keep the column type and just add a UNIQUE constraint. firebase_uid +
-- provider are new columns. All adds use IF NOT EXISTS so this is idempotent if
-- the schema was hand-patched on a particular environment.

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email';

-- Backfill provider for existing rows (NULL is possible if column was added
-- without a default in a previous environment).
UPDATE users SET provider = 'email' WHERE provider IS NULL;

-- Unique constraints (drop-then-add to be safe across re-runs).
DO $$
BEGIN
  -- firebase_uid UNIQUE
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_firebase_uid_key'
  ) THEN
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_firebase_uid_key UNIQUE (firebase_uid);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      -- ignore: already exists under a different name
      NULL;
    END;
  END IF;

  -- phone UNIQUE
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_phone_key'
  ) THEN
    BEGIN
      ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
    EXCEPTION WHEN duplicate_table OR duplicate_object THEN
      NULL;
    END;
  END IF;
END $$;

-- Indexes — UNIQUE constraint already creates a B-tree index, but we keep
-- partial-NULL-friendly lookup indexes here for the firebase-verify hot path.
CREATE INDEX IF NOT EXISTS users_firebase_uid_idx ON users (firebase_uid)
  WHERE firebase_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_phone_idx ON users (phone)
  WHERE phone IS NOT NULL;
