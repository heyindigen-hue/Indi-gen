-- ============================================================
-- Migration 002: Import old VPS settings into app_settings
-- RUN ONLY ON EC2 (production DB). Do NOT run locally.
-- Actual secret values must be loaded from environment / AWS Secrets Manager
-- before running this migration (replace all CHANGE_ME placeholders).
-- ============================================================

INSERT INTO app_settings (key, value, category, is_secret) VALUES
  ('claude_api_key',               'CHANGE_ME',   'api_keys',   TRUE),
  ('gemini_api_key',               'CHANGE_ME',   'api_keys',   TRUE),
  ('aws_bedrock_api_key',          'CHANGE_ME',   'api_keys',   TRUE),
  ('aws_bedrock_region',           'ap-south-1',  'api_keys',   FALSE),
  ('apify_token',                  'CHANGE_ME',   'api_keys',   TRUE),
  ('apify_tokens',                 'CHANGE_ME',   'api_keys',   TRUE),
  ('signalhire_api_key',           'CHANGE_ME',   'api_keys',   TRUE),
  ('signalhire_credits_remaining', '4763',         'api_keys',  FALSE),
  ('signalhire_credits_updated_at','2026-04-20T19:01:35.690Z', 'api_keys', FALSE),
  ('linkedin_access_token',        'CHANGE_ME',   'linkedin',   TRUE),
  ('linkedin_refresh_token',       'CHANGE_ME',   'linkedin',   TRUE),
  ('platform_linkedin_enabled',    'true',         'platform',  FALSE),
  ('company_profile',
   '{"name":"Indigen Services","tagline":"Full-stack AI + SaaS engineering , Shopify Plus Partner","website":"indigenservices.com","email":"hello@indigenservices.com","city":"Nashik","state":"Maharashtra","country":"India","brand_color":"#552f83","secondary_color":"#0F0F1A","founder_name":"YashRaj Bhadane","founder_designation":"Founder & CEO","phone":"+91 9075933595","portfolio_url":"https://indigenservices.com/work","logo_url":"/uploads/company/logo.png?v=1776709932719","whatsapp":"+91 7499168918","address_line1":"ABH Samruddhi, Ganesh Nagar,","address_line2":"Janata Raja Colony,","postal_code":"422004","gst_number":"27EEFPB1124D2Z7"}',
   'company', FALSE),
  ('ai_context_pitch',
   'Indigen Services — full-stack AI + SaaS engineering team of 8 in Nashik, India, founded 2019. We ship 2-4x faster than traditional agencies because we focus on revenue-generating systems, not just code.',
   'ai_context', FALSE),
  ('ai_context_ideal_clients',
   E'• D2C founders (Shopify + chatbot use-case)\n• SaaS founders needing fast MVP\n• SMEs with manual/repetitive workflows\n• Healthcare + Logistics going digital\n• International SMBs priced out of US agencies',
   'ai_context', FALSE),
  ('ai_context_banned_phrases',
   E'Hope this email finds you well\nI wanted to reach out\nleverage\nsynergy\nexcited to share',
   'ai_context', FALSE),
  ('ai_context_case_studies',
   E'• Built Shopify Plus Stores for various brands\n• SaaS MVP from kickoff to first paying user in 5 weeks.\n• Sales-ops automation saving a founder 15 hours/week.',
   'ai_context', FALSE),
  ('ai_context_signature',      'Yashraj Bhadane', 'ai_context', FALSE),
  ('ai_context_writing_style',
   E'Write like a smart human who respects the reader''s time. Be specific — numbers beat adjectives, examples beat claims. Sound confident, not desperate. No fluff.',
   'ai_context', FALSE),
  ('schedule_cron',             '0 */12 * * *',  'scheduler',   FALSE)
ON CONFLICT (key) DO UPDATE
  SET value      = EXCLUDED.value,
      category   = EXCLUDED.category,
      is_secret  = EXCLUDED.is_secret,
      updated_at = NOW();
