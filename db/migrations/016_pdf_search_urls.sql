-- ============================================================
-- Migration 016: Seed canonical PDF LinkedIn search phrases
-- ============================================================
-- The founder's reference PDF describes 16 LinkedIn-only search phrases
-- (5 India + 11 international) that the scraper should rotate through.
-- These map to LinkedIn `search/results/content/?keywords=…` URLs via
-- phraseToSearchUrl(). Owned by the admin user so they show up for the
-- platform-wide rotation, not pinned to a single tenant.
--
-- Idempotent: ON CONFLICT (phrase) re-enables and reassigns to admin so
-- this migration can run multiple times without duplicate inserts.

DO $$
DECLARE
  admin_uuid UUID;
BEGIN
  -- Prefer the canonical admin user, fall back to any user with role admin/super_admin
  SELECT id INTO admin_uuid FROM users WHERE id = '32f83f94-8959-4193-8431-9f4e580e68c3'::uuid;
  IF admin_uuid IS NULL THEN
    SELECT id INTO admin_uuid FROM users
     WHERE role IN ('admin', 'super_admin')
     ORDER BY created_at ASC
     LIMIT 1;
  END IF;

  -- 5 India phrases
  INSERT INTO search_phrases (phrase, platform, icp_tag, user_id, enabled)
  VALUES
    ('Looking for a freelance developer to build a Shopify integration', 'linkedin', 'D2C',  admin_uuid, TRUE),
    ('hiring Shopify Plus developer India D2C brand',                   'linkedin', 'D2C',  admin_uuid, TRUE),
    ('need React Native developer for startup MVP India',               'linkedin', 'SaaS', admin_uuid, TRUE),
    ('hiring full stack developer SaaS India founder',                  'linkedin', 'SaaS', admin_uuid, TRUE),
    ('AI chatbot developer needed India founder',                       'linkedin', 'AI',   admin_uuid, TRUE)
  ON CONFLICT (phrase) DO UPDATE
    SET enabled = TRUE,
        platform = 'linkedin',
        user_id = COALESCE(admin_uuid, search_phrases.user_id),
        icp_tag = COALESCE(search_phrases.icp_tag, EXCLUDED.icp_tag);

  -- 11 international phrases
  INSERT INTO search_phrases (phrase, platform, icp_tag, user_id, enabled)
  VALUES
    ('"looking for developer" Dubai OR UAE Shopify',                          'linkedin', 'D2C',    admin_uuid, TRUE),
    ('"Shopify developer" UK OR Europe freelance project',                    'linkedin', 'D2C',    admin_uuid, TRUE),
    ('"need to build a SaaS MVP" Australia OR Sydney founder',                'linkedin', 'SaaS',   admin_uuid, TRUE),
    ('Toronto OR Vancouver D2C founder hire developer',                       'linkedin', 'D2C',    admin_uuid, TRUE),
    ('"need a developer" Singapore SaaS startup',                             'linkedin', 'SaaS',   admin_uuid, TRUE),
    ('"AI chatbot for my business" OR "GPT integration" founder',             'linkedin', 'AI',     admin_uuid, TRUE),
    ('EU OR Germany Shopify Plus headless commerce hire',                     'linkedin', 'D2C',    admin_uuid, TRUE),
    ('"iOS developer freelance" OR "need a mobile app" US',                   'linkedin', 'Mobile', admin_uuid, TRUE),
    ('India SaaS founder need MVP developer',                                 'linkedin', 'SaaS',   admin_uuid, TRUE),
    ('global founder "tech help needed" build product',                       'linkedin', 'SaaS',   admin_uuid, TRUE),
    ('NYC OR "San Francisco" D2C founder hire Shopify',                       'linkedin', 'D2C',    admin_uuid, TRUE)
  ON CONFLICT (phrase) DO UPDATE
    SET enabled = TRUE,
        platform = 'linkedin',
        user_id = COALESCE(admin_uuid, search_phrases.user_id),
        icp_tag = COALESCE(search_phrases.icp_tag, EXCLUDED.icp_tag);
END $$;
