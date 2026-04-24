CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============ CORE (from original spec) ============

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  phone TEXT,
  country_code TEXT DEFAULT 'IN',
  locale TEXT DEFAULT 'en-IN',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  visible_categories TEXT[],
  avatar_url TEXT,
  company_name TEXT,
  company_gstin TEXT,
  company_address JSONB,
  onboarding_step INT DEFAULT 0,
  onboarding_completed_at TIMESTAMPTZ,
  email_verified_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON users (role) WHERE deleted_at IS NULL;
CREATE INDEX ON users (created_at DESC);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  category TEXT DEFAULT 'general',
  is_secret BOOLEAN DEFAULT FALSE,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE search_phrases (
  id SERIAL PRIMARY KEY,
  phrase TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  last_used_at TIMESTAMPTZ,
  total_runs INT DEFAULT 0,
  total_posts INT DEFAULT 0,
  total_new_leads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON search_phrases (user_id, enabled);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT,
  headline TEXT,
  linkedin_url TEXT UNIQUE,
  linkedin_urn TEXT,
  company TEXT,
  post_text TEXT,
  post_url TEXT,
  post_date TIMESTAMPTZ,
  score INT DEFAULT 0,
  icp_type TEXT,
  status TEXT DEFAULT 'New',
  notes TEXT,
  phrase_id INT REFERENCES search_phrases(id) ON DELETE SET NULL,
  profile_data JSONB,
  drafts_cache JSONB,
  drafts_cached_at TIMESTAMPTZ,
  enrichment_status TEXT DEFAULT 'pending',
  enriched_at TIMESTAMPTZ,
  intent_label TEXT,
  intent_confidence NUMERIC(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON leads (owner_id, status, created_at DESC);
CREATE INDEX ON leads (score DESC);
CREATE INDEX ON leads (icp_type);
CREATE INDEX ON leads (linkedin_url);

CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  value TEXT NOT NULL,
  sub_type TEXT,
  rating TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lead_id, value)
);

CREATE TABLE outreach_log (
  id SERIAL PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  external_id TEXT,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON outreach_log (lead_id, sent_at DESC);
CREATE INDEX ON outreach_log (user_id, channel, sent_at DESC);

CREATE TABLE scraper_runs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  trigger TEXT DEFAULT 'cron',
  source TEXT DEFAULT 'linkedin',
  status TEXT DEFAULT 'running',
  posts_found INT DEFAULT 0,
  leads_kept INT DEFAULT 0,
  tokens_spent INT DEFAULT 0,
  duration_ms INT,
  cost_usd NUMERIC(10,4),
  run_log TEXT,
  error_msg TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX ON scraper_runs (user_id, started_at DESC);

CREATE TABLE filter_feedback (
  id SERIAL PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verdict TEXT NOT NULL,
  headline TEXT,
  post_text TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON filter_feedback (verdict, created_at DESC);

-- ============ SAAS — BILLING ============

CREATE TABLE subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_inr NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  interval TEXT DEFAULT 'MONTH',
  tokens_included INT DEFAULT 0,
  features JSONB DEFAULT '[]',
  max_saved_queries INT DEFAULT 3,
  max_leads_per_day INT DEFAULT 10,
  enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  cashfree_plan_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT REFERENCES subscription_plans(id),
  cashfree_subscription_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  authorised_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON subscriptions (user_id, status);

CREATE TABLE token_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  source TEXT NOT NULL,
  source_ref TEXT,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE
);
CREATE INDEX ON token_grants (user_id, expires_at NULLS LAST);

CREATE TABLE token_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  delta BIGINT NOT NULL,
  kind TEXT NOT NULL,
  grant_id UUID REFERENCES token_grants(id),
  job_id UUID,
  reason TEXT,
  metadata JSONB,
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON token_transactions (user_id, created_at DESC);
CREATE INDEX ON token_transactions (kind, created_at DESC);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  cashfree_order_id TEXT,
  subscription_id UUID REFERENCES subscriptions(id),
  status TEXT DEFAULT 'draft',
  subtotal NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  place_of_supply TEXT,
  hsn_sac TEXT DEFAULT '998314',
  customer_gstin TEXT,
  customer_name TEXT,
  customer_address JSONB,
  line_items JSONB NOT NULL,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  tds_amount NUMERIC(12,2) DEFAULT 0,
  tds_certificate_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON invoices (user_id, status, created_at DESC);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id),
  cashfree_payment_id TEXT UNIQUE,
  cashfree_order_id TEXT,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT,
  status TEXT DEFAULT 'pending',
  refund_amount NUMERIC(12,2) DEFAULT 0,
  bank_reference TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON payments (user_id, created_at DESC);

CREATE TABLE coupons (
  code TEXT PRIMARY KEY,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  max_redemptions INT,
  redemptions INT DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ WEBHOOKS + AUDIT ============

CREATE TABLE webhooks_log (
  id BIGSERIAL PRIMARY KEY,
  direction TEXT NOT NULL,
  provider TEXT NOT NULL,
  event_type TEXT,
  endpoint TEXT,
  status_code INT,
  payload JSONB,
  response JSONB,
  signature_valid BOOLEAN,
  error_msg TEXT,
  duration_ms INT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON webhooks_log (provider, received_at DESC);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_type TEXT DEFAULT 'user',
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON audit_log (actor_id, created_at DESC);
CREATE INDEX ON audit_log (action, created_at DESC);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read:leads']::TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ AUTH/SECURITY ============

CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  jti TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON active_sessions (user_id, revoked_at) WHERE revoked_at IS NULL;

CREATE TABLE login_attempts (
  id BIGSERIAL PRIMARY KEY,
  email CITEXT,
  ip_address INET,
  success BOOLEAN NOT NULL,
  reason TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON login_attempts (email, created_at DESC);
CREATE INDEX ON login_attempts (ip_address, created_at DESC);

-- ============ DPDP COMPLIANCE ============

CREATE TABLE consent_records (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  action TEXT NOT NULL,
  policy_version TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON consent_records (user_id, purpose, created_at DESC);

CREATE TABLE erasure_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  notes TEXT
);

CREATE TABLE breach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_at TIMESTAMPTZ NOT NULL,
  reported_to_dpb_at TIMESTAMPTZ,
  reported_to_users_at TIMESTAMPTZ,
  severity TEXT,
  data_categories TEXT[],
  affected_users_count INT,
  description TEXT NOT NULL,
  mitigation TEXT,
  status TEXT DEFAULT 'open',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ADMIN / TEAM / FEATURES ============

CREATE TABLE admin_roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  role_id TEXT REFERENCES admin_roles(id),
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feature_flags (
  id TEXT PRIMARY KEY,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percent INT DEFAULT 0,
  user_allowlist UUID[] DEFAULT ARRAY[]::UUID[],
  plan_allowlist TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON alerts (acknowledged_at, severity) WHERE acknowledged_at IS NULL;

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'queued',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  error_msg TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON notifications (user_id, created_at DESC);
CREATE INDEX ON notifications (status, scheduled_for) WHERE status = 'queued';

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assignee_id UUID REFERENCES users(id),
  tags TEXT[],
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_messages (
  id BIGSERIAL PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  sender_type TEXT,
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  cta_label TEXT,
  cta_url TEXT,
  audience JSONB,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  enabled BOOLEAN DEFAULT FALSE,
  dismissible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES users(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  reward_tokens INT DEFAULT 0,
  reward_granted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phrases TEXT[] NOT NULL,
  filters JSONB,
  schedule TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ SERVER-DRIVEN UI ============

CREATE TABLE ui_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  name TEXT NOT NULL,
  version INT NOT NULL,
  manifest JSONB NOT NULL,
  audience JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON ui_manifests (platform, enabled, version DESC);
CREATE UNIQUE INDEX ON ui_manifests (platform, name, version);

CREATE TABLE ui_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  variants JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  kpi TEXT,
  results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ui_assignments (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  experiment_id UUID REFERENCES ui_experiments(id) ON DELETE CASCADE,
  variant_index INT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, experiment_id)
);

CREATE TABLE i18n_strings (
  locale TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (locale, key)
);

CREATE TABLE email_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT,
  text_body TEXT,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  image_url TEXT,
  action_url TEXT,
  sound TEXT DEFAULT 'default',
  enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ VIEWS ============

CREATE VIEW user_token_balance AS
SELECT user_id, SUM(delta)::BIGINT AS balance
FROM token_transactions
GROUP BY user_id;
