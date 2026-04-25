-- Migration 011: add the new "Leads" tab to the active mobile manifest.
--
-- The manifest is read in two shapes:
--   * mobile bottom-tab bar reads top-level  manifest.tabs[]            (flat)
--   * admin SDUI editor    reads          manifest.screens.tabs.tabs[]   (nested)
-- Migration 007 only seeded the nested form, so the mobile was silently falling
-- back to its bundled defaultManifest. We now write BOTH forms in lockstep with
-- ids that match the actual route filenames in mobile/app/(tabs)/.
--
-- Also pins manifest.theme.mode = "light" so the mobile ThemeProvider's
-- "manifest default" rung of the resolve order has a value to read.

UPDATE ui_manifests
SET manifest = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(manifest, '{}'::jsonb),
      '{tabs}',
      '[
        { "id": "index",    "label": "Home",     "icon": "home",       "enabled": true, "order": 0 },
        { "id": "explore",  "label": "Saved",    "icon": "bookmark",   "enabled": true, "order": 1 },
        { "id": "leads",    "label": "Leads",    "icon": "lead",       "enabled": true, "order": 2 },
        { "id": "outreach", "label": "Outreach", "icon": "send",       "enabled": true, "order": 3 },
        { "id": "insights", "label": "Insights", "icon": "chart-line", "enabled": true, "order": 4 },
        { "id": "settings", "label": "Settings", "icon": "settings",   "enabled": true, "order": 5 }
      ]'::jsonb,
      true
    ),
    '{screens,tabs,tabs}',
    '[
      { "id": "index",    "icon": "home",       "label": "Home",     "route": "/(tabs)",           "enabled": true, "order": 0 },
      { "id": "explore",  "icon": "bookmark",   "label": "Saved",    "route": "/(tabs)/explore",   "enabled": true, "order": 1 },
      { "id": "leads",    "icon": "lead",       "label": "Leads",    "route": "/(tabs)/leads",     "enabled": true, "order": 2 },
      { "id": "outreach", "icon": "send",       "label": "Outreach", "route": "/(tabs)/outreach",  "enabled": true, "order": 3 },
      { "id": "insights", "icon": "chart-line", "label": "Insights", "route": "/(tabs)/insights",  "enabled": true, "order": 4 },
      { "id": "settings", "icon": "settings",   "label": "Settings", "route": "/(tabs)/settings",  "enabled": true, "order": 5 }
    ]'::jsonb,
    true
  ),
  '{theme,mode}',
  COALESCE(manifest->'theme'->'mode', '"light"'::jsonb),
  true
)
WHERE platform = 'mobile' AND enabled = TRUE;
