-- ============================================================
-- Migration 003: Proposal Builder
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft',           -- draft | sent | accepted | rejected
  title TEXT,
  scope JSONB,                           -- {deliverables: [], timeline: '', team: ''}
  pricing JSONB,                         -- {currency, total, milestones: []}
  content_md TEXT,                       -- markdown body (editable)
  ai_content JSONB,                      -- raw AI output (for reference/regen)
  overrides JSONB,                       -- user-applied overrides before last render
  pdf_url TEXT,
  filename TEXT,
  bytes INT,
  sent_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_proposals_lead_status ON lead_proposals (lead_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_proposals_created ON lead_proposals (created_at DESC);

-- Ensure proposal_draft column on leads (idempotent)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS proposal_draft JSONB;
