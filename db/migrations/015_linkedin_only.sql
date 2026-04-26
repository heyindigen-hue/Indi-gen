-- ============================================================
-- Migration 015: LinkedIn-only convergence
-- ============================================================
-- The LeadHangover product is being narrowed to LinkedIn-only
-- (per founder direction 2026-04-25). All existing non-LinkedIn
-- leads (Reddit / Google Maps / Twitter / etc.) imported earlier
-- get archived. Their data is preserved — only `status` flips
-- to 'archived' so they fall out of the default lead feed.

UPDATE leads
SET status = 'archived', updated_at = NOW()
WHERE status NOT IN ('archived', 'closed')
  AND profile_data->>'old_platform' IS NOT NULL
  AND profile_data->>'old_platform' NOT IN ('linkedin');
