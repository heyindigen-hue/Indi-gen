-- Richer default mobile UI manifest v3 with new widget types
-- Disables all existing mobile manifests and inserts a richer v3

UPDATE ui_manifests SET enabled = FALSE WHERE platform = 'mobile';

INSERT INTO ui_manifests (platform, name, version, manifest, is_default, enabled, published_at)
SELECT 'mobile', 'default-v3', 3, '{
  "brand": {
    "name": "LeadHangover",
    "tagline": "Wake up to better leads",
    "primary": "#FF4716",
    "logo_url": "/brand/logo.png"
  },
  "theme": {
    "palette": "warm-light",
    "mode": "light",
    "font": "Fraunces",
    "body_font": "Inter",
    "radius": 16,
    "density": "comfortable"
  },
  "screens": {
    "home": {
      "widgets": [
        {
          "id": "w-hero",
          "type": "HeroBanner",
          "props": {
            "title": "Wake up to better leads",
            "subtitle": "3 new buyers found overnight",
            "illustration_id": "hero-onboarding",
            "cta_label": "View leads",
            "cta_route": "/(tabs)/explore"
          }
        },
        {
          "id": "w-profile",
          "type": "ProfileCard",
          "props": { "showAvatar": true, "showPlan": true, "showTokens": true }
        },
        {
          "id": "w-stats",
          "type": "StatGrid",
          "props": {
            "cells": [
              { "label": "Saved", "value_key": "leads_saved_30d", "color": "primary" },
              { "label": "Sent", "value_key": "sent_30d", "color": "warning" },
              { "label": "Reply rate", "value_key": "reply_rate", "color": "success" },
              { "label": "Tokens", "value_key": "token_balance", "color": "accent" }
            ]
          }
        },
        {
          "id": "w-announce",
          "type": "AnnouncementBanner",
          "props": { "dismissable": true }
        },
        {
          "id": "w-search",
          "type": "SearchBar",
          "props": { "placeholder": "Search leads..." }
        },
        {
          "id": "w-filters",
          "type": "QuickFilters",
          "props": { "filters": ["BUYER_PROJECT", "D2C", "SaaS", "Recent"] }
        },
        {
          "id": "w-swipe",
          "type": "LeadSwipeStack",
          "props": { "maxCards": 10, "showScore": true }
        },
        {
          "id": "w-suggested",
          "type": "SuggestedLeads",
          "props": { "score_min": 7, "limit": 5 }
        },
        {
          "id": "w-followup",
          "type": "FollowupReminder",
          "props": { "days_threshold": 7 }
        },
        {
          "id": "w-trending",
          "type": "TrendingPhrases",
          "props": { "limit": 5 }
        },
        {
          "id": "w-chart",
          "type": "ChartCard",
          "props": { "metric_key": "leads_per_day", "range": "30d", "color": "primary" }
        },
        {
          "id": "w-channel",
          "type": "ChannelMix",
          "props": { "period": "30d" }
        },
        {
          "id": "w-token-forecast",
          "type": "TokenForecast",
          "props": {}
        },
        {
          "id": "w-referral",
          "type": "ReferralBanner",
          "props": { "reward": 50 }
        },
        {
          "id": "w-streak",
          "type": "StreakCounter",
          "props": { "type": "login" }
        },
        {
          "id": "w-lesson",
          "type": "LessonCard",
          "props": { "lesson_set_id": "default" }
        },
        {
          "id": "w-actions",
          "type": "ActionButtons",
          "props": { "actions": ["scrape", "import_manual", "invite"] }
        }
      ]
    },
    "tabs": {
      "tabs": [
        { "id": "home",      "icon": "house",      "label": "Home",     "route": "/(tabs)",           "enabled": true, "order": 0 },
        { "id": "explore",   "icon": "bookmark",   "label": "Saved",    "route": "/(tabs)/explore",   "enabled": true, "order": 1 },
        { "id": "outreach",  "icon": "send",       "label": "Outreach", "route": "/(tabs)/outreach",  "enabled": true, "order": 2 },
        { "id": "insights",  "icon": "chart-line", "label": "Insights", "route": "/(tabs)/insights",  "enabled": true, "order": 3 },
        { "id": "settings",  "icon": "settings",   "label": "Settings", "route": "/(tabs)/settings",  "enabled": true, "order": 4 }
      ]
    }
  },
  "features": {
    "swipe_stack": true,
    "webview_browser": true,
    "voice_notes": false,
    "maintenance": false,
    "animations": true,
    "dark_mode_toggle": true
  }
}'::jsonb, TRUE, TRUE, NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM ui_manifests WHERE platform = 'mobile' AND version = 3
);
