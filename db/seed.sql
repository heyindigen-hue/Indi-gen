-- App settings
INSERT INTO app_settings (key, value, category) VALUES
  ('claude_api_key', '', 'integration'),
  ('signalhire_api_key', '', 'integration'),
  ('cashfree_app_id', '', 'integration'),
  ('cashfree_secret_key', '', 'integration'),
  ('cashfree_webhook_secret', '', 'integration'),
  ('cashfree_env', 'TEST', 'integration'),
  ('linkedin_email', '', 'integration'),
  ('linkedin_password', '', 'integration'),
  ('proxy_url', '', 'integration'),
  ('callback_base_url', 'http://localhost:3001', 'integration'),
  ('filter_enabled', 'true', 'filter'),
  ('jwt_secret', 'indigen-lead-hunter-secret-2026', 'security'),
  ('filter_stats_in', '0', 'filter'),
  ('filter_stats_kept', '0', 'filter'),
  ('filter_stats_discarded', '0', 'filter'),
  ('brand_name', 'LeadHangover', 'branding'),
  ('brand_tagline', 'Wake up to better leads', 'branding'),
  ('brand_primary_color', '#FF4716', 'branding'),
  ('brand_logo_light_url', '', 'branding'),
  ('brand_logo_dark_url', '', 'branding'),
  ('brand_favicon_url', '', 'branding'),
  ('brand_og_image_url', '', 'branding'),
  ('brand_support_email', 'support@indigen.app', 'branding'),
  ('brand_legal_tos_url', '', 'branding'),
  ('brand_legal_privacy_url', '', 'branding'),
  ('company_legal_name', 'Indigen Services', 'company'),
  ('company_gstin', '', 'company'),
  ('company_pan', '', 'company'),
  ('company_address', '', 'company'),
  ('company_state_code', '27', 'company'),
  ('ai_context_pitch', 'LeadHangover — full-stack AI + SaaS dev agency.', 'ai'),
  ('ai_context_ideal_clients', 'D2C, SaaS, SMEs needing automation.', 'ai'),
  ('ai_model_filter', 'claude-haiku-4-5', 'ai'),
  ('ai_model_drafts', 'claude-haiku-4-5', 'ai'),
  ('maintenance_mode', 'false', 'ops'),
  ('maintenance_message', '', 'ops'),
  ('scraper_max_posts_per_run', '100', 'scraper'),
  ('scraper_phrase_count_per_run', '3', 'scraper'),
  ('scraper_post_age_days', '30', 'scraper'),
  ('scraper_score_threshold', '4', 'scraper'),
  ('scraper_rate_limit_per_hour', '600', 'scraper')
ON CONFLICT (key) DO NOTHING;

UPDATE app_settings SET is_secret = TRUE
WHERE key IN ('claude_api_key','signalhire_api_key','cashfree_secret_key',
              'cashfree_webhook_secret','linkedin_password','jwt_secret');

-- System search phrases
INSERT INTO search_phrases (phrase) VALUES
  ('looking for developer'),('need to build app'),('building SaaS'),
  ('custom Shopify'),('AI chatbot'),('automate workflow'),
  ('hire developer India'),('MVP development'),('web app India'),
  ('react native app'),('mobile app developer')
ON CONFLICT (phrase) DO NOTHING;

-- Subscription plans
INSERT INTO subscription_plans (id, name, description, price_inr, tokens_included, max_saved_queries, max_leads_per_day, features, sort_order) VALUES
  ('free', 'Free', 'Try before you buy', 0, 0, 1, 10, '["basic_filter"]', 0),
  ('starter_monthly', 'Starter', 'For solo founders', 1499, 500, 3, 100, '["ai_drafts","email_support"]', 1),
  ('pro_monthly', 'Pro', 'For growing teams', 4999, 2500, 10, 500, '["ai_drafts","whatsapp_drafts","priority_ai","api_access"]', 2),
  ('enterprise', 'Enterprise', 'Custom scale', 0, 0, 999, 99999, '["white_label","dedicated_ip","sso","sla"]', 3)
ON CONFLICT (id) DO NOTHING;

-- Admin roles
INSERT INTO admin_roles (id, name, permissions) VALUES
  ('super_admin', 'Super Admin', ARRAY['*']::TEXT[]),
  ('admin', 'Admin', ARRAY['users:*','leads:*','scrapers:*','settings:read','settings:update_non_secret']::TEXT[]),
  ('support', 'Support', ARRAY['users:read','users:impersonate','leads:read','tickets:*']::TEXT[]),
  ('viewer', 'Viewer', ARRAY['*:read']::TEXT[])
ON CONFLICT (id) DO NOTHING;

-- Coupons
INSERT INTO coupons (code, description, discount_type, discount_value, max_redemptions, expires_at, enabled) VALUES
  ('WELCOME50', '50% off first month', 'percent', 50, 500, NOW() + INTERVAL '90 days', TRUE),
  ('EARLYBIRD', '₹500 off Pro plan', 'flat', 500, 100, NOW() + INTERVAL '60 days', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Feature flags
INSERT INTO feature_flags (id, description, enabled) VALUES
  ('new_dashboard_v2', 'New v2 dashboard layout', FALSE),
  ('ai_drafts_v2', 'Improved draft generation', FALSE),
  ('mobile_swipe_stack', 'Tinder-style lead swipe stack', TRUE),
  ('white_label_mode', 'Enable white-label branding', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Default mobile UI manifest
INSERT INTO ui_manifests (platform, name, version, manifest, is_default, enabled, published_at) VALUES
('mobile', 'default', 1, '{
  "brand": {"name":"LeadHangover","tagline":"Wake up to better leads","primary":"#FF4716","logo_light":"","logo_dark":""},
  "theme": {"palette":"graphite","font":"Inter","radius":14,"density":"comfortable"},
  "tabs": [
    {"id":"home","icon":"house","label":"Home","route":"/(tabs)","enabled":true},
    {"id":"explore","icon":"bookmark","label":"Saved","route":"/(tabs)/explore","enabled":true},
    {"id":"outreach","icon":"send","label":"Outreach","route":"/(tabs)/outreach","enabled":true},
    {"id":"insights","icon":"chart-line","label":"Insights","route":"/(tabs)/insights","enabled":true},
    {"id":"settings","icon":"settings","label":"Settings","route":"/(tabs)/settings","enabled":true}
  ],
  "home_widgets": [
    {"type":"TokenBalance","props":{"showTopUp":true}},
    {"type":"AnnouncementBanner","props":{"dismissible":true}},
    {"type":"QuickFilters","props":{"filters":["BUYER_PROJECT","D2C","SaaS","Recent"]}},
    {"type":"LeadSwipeStack","props":{"maxCards":10}},
    {"type":"RecentLeadsCarousel","props":{"limit":5}},
    {"type":"ActionButtons","props":{"actions":["scrape","import_manual","invite"]}}
  ],
  "onboarding_steps": [
    {"id":"welcome","title":"Welcome to LeadHangover","body":"Find real buyers on LinkedIn","cta":"Get started"},
    {"id":"icp","title":"Who do you sell to?","body":"Pick your ideal customer profile","input":"multi_chip","options":["D2C","SaaS","SME","Healthcare","Logistics","Fintech","Ecommerce"]},
    {"id":"phrases","title":"What are you looking for?","body":"Add search phrases","input":"chip_editor","suggestions":["looking for developer","building SaaS","AI chatbot","custom Shopify"]},
    {"id":"done","title":"Finding your first leads...","body":"We are scanning LinkedIn now","animated":true}
  ],
  "paywall": {
    "headline":"Get more leads",
    "subheadline":"Pay for what you use",
    "bundles": [
      {"id":"credits_100","tokens":100,"price":499,"badge":null},
      {"id":"credits_500","tokens":500,"price":1999,"badge":"POPULAR","savings":"20% off"},
      {"id":"credits_2000","tokens":2000,"price":5999,"badge":null,"savings":"40% off"}
    ],
    "footer":"Credits never expire. Cancel anytime."
  },
  "features": {"swipe_stack":true,"webview_browser":true,"voice_notes":false,"maintenance":false},
  "legal": {"tos_url":"","privacy_url":"","support_email":"support@leadhangover.com"}
}', TRUE, TRUE, NOW())
ON CONFLICT DO NOTHING;

-- i18n strings
INSERT INTO i18n_strings (locale, key, value) VALUES
('en-IN','login.cta','Sign in'),('en-IN','login.apple','Continue with Apple'),
('en-IN','login.google','Continue with Google'),('en-IN','tabs.home','Home'),
('en-IN','tabs.explore','Saved'),('en-IN','tabs.outreach','Outreach'),
('en-IN','tabs.insights','Insights'),('en-IN','tabs.settings','Settings'),
('en-IN','home.no_leads','No leads yet'),('en-IN','home.pull_to_refresh','Pull to refresh'),
('en-IN','lead.save','Save'),('en-IN','lead.skip','Skip'),('en-IN','lead.contact','Contact'),
('en-IN','paywall.headline','Get more leads'),('en-IN','common.loading','Loading...'),
('en-IN','common.error','Something went wrong'),('en-IN','common.retry','Retry')
ON CONFLICT DO NOTHING;

-- Email templates
INSERT INTO email_templates (id, name, subject, html_body, variables) VALUES
('welcome','Welcome','Welcome to {{brand_name}}, {{first_name}}!','<p>Hi {{first_name}},</p><p>Welcome to {{brand_name}}.</p>',ARRAY['first_name','brand_name']),
('payment_success','Payment Success','Payment received — {{amount}}','<p>We received your payment of {{amount}}.</p>',ARRAY['amount']),
('trial_ending','Trial Ending','Your trial ends in {{days}} days','<p>Your trial ends in {{days}} days.</p>',ARRAY['days']),
('tokens_low','Tokens Low','You have {{balance}} credits left','<p>You have {{balance}} credits left.</p>',ARRAY['balance'])
ON CONFLICT (id) DO NOTHING;

-- Push templates
INSERT INTO push_templates (id, name, title, body) VALUES
('new_leads','New Leads Available','{{count}} new leads','Check them out in the app'),
('outreach_replied','Reply Received','{{lead_name}} replied!','Tap to view their message'),
('payment_success','Payment Success','Payment received','Your tokens are ready'),
('trial_ending','Trial Ending','Your trial ends soon','Upgrade to keep your leads flowing')
ON CONFLICT (id) DO NOTHING;

-- LeadHangover rebrand
UPDATE app_settings SET value='LeadHangover' WHERE key='brand_name';
UPDATE app_settings SET value='Wake up to better leads' WHERE key='brand_tagline';
UPDATE app_settings SET value='#FF4716' WHERE key='brand_primary_color';
UPDATE app_settings SET value='/brand/logo-light-256.png' WHERE key='brand_logo_light_url';
UPDATE app_settings SET value='/brand/logo-dark-256.png' WHERE key='brand_logo_dark_url';
UPDATE app_settings SET value='/brand/favicon.png' WHERE key='brand_favicon_url';
UPDATE app_settings SET value='/brand/icon-1024.png' WHERE key='brand_og_image_url';
UPDATE app_settings SET value='support@leadhangover.com' WHERE key='brand_support_email';
