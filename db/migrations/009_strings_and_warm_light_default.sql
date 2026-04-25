-- Ensure full en-IN i18n seed (adds onboarding.next, onboarding.continue + idempotently re-asserts the rest)
-- and pin theme.palette = "warm-light" on the active default mobile manifest.

-- Full en-IN seed (idempotent)
INSERT INTO i18n_strings (locale, key, value, updated_at) VALUES
  ('en-IN','login.cta','Sign in', NOW()),
  ('en-IN','login.apple','Continue with Apple', NOW()),
  ('en-IN','login.google','Continue with Google', NOW()),
  ('en-IN','tabs.home','Home', NOW()),
  ('en-IN','tabs.explore','Saved', NOW()),
  ('en-IN','tabs.outreach','Outreach', NOW()),
  ('en-IN','tabs.insights','Insights', NOW()),
  ('en-IN','tabs.settings','Settings', NOW()),
  ('en-IN','home.no_leads','No leads yet', NOW()),
  ('en-IN','home.pull_to_refresh','Pull to refresh', NOW()),
  ('en-IN','lead.save','Save', NOW()),
  ('en-IN','lead.skip','Skip', NOW()),
  ('en-IN','lead.contact','Contact', NOW()),
  ('en-IN','paywall.headline','Get more leads', NOW()),
  ('en-IN','common.loading','Loading...', NOW()),
  ('en-IN','common.error','Something went wrong', NOW()),
  ('en-IN','common.retry','Retry', NOW()),
  ('en-IN','onboarding.skip','Skip', NOW()),
  ('en-IN','onboarding.next','Next', NOW()),
  ('en-IN','onboarding.continue','Continue', NOW())
ON CONFLICT (locale, key) DO NOTHING;

-- Pin warm-light palette on active default mobile manifest(s)
UPDATE ui_manifests
SET manifest = jsonb_set(
  COALESCE(manifest, '{}'::jsonb),
  '{theme,palette}',
  '"warm-light"'::jsonb,
  true
)
WHERE platform = 'mobile' AND is_default = TRUE AND enabled = TRUE;
