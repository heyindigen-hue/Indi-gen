-- ============================================================
-- Migration 014: 6-intent Claude classifier columns
-- ============================================================
-- intent_label/intent_confidence already exist (from 001_initial_schema).
-- Add intent_reason + indices for the LinkedIn-only convergence task.
-- Also add notified_at (hot-lead push de-dupe) and last_outreach_at
-- (Outreach Hub follow-up bucket).

ALTER TABLE leads ADD COLUMN IF NOT EXISTS intent_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS unqualified_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_intent_label ON leads(intent_label) WHERE intent_label IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_intent_confidence ON leads(intent_confidence DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_leads_notified_at ON leads(notified_at) WHERE notified_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_last_outreach_at ON leads(last_outreach_at DESC NULLS LAST);

-- backfill last_outreach_at from outreach_log so existing leads can show in follow-up bucket
UPDATE leads l
SET last_outreach_at = (
  SELECT MAX(ol.sent_at) FROM outreach_log ol WHERE ol.lead_id = l.id
)
WHERE last_outreach_at IS NULL
  AND EXISTS (SELECT 1 FROM outreach_log ol WHERE ol.lead_id = l.id);
