# Old VPS System vs New Indi-gen Platform

Feature-by-feature comparison of the legacy system (Python/Flask on VPS) against the new Indi-gen platform (Node/Express + React Native).

## Core Pipeline

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Scraper engine | Python Playwright + LinkedIn API | Apify actors with multi-key rotation (7 tokens) |
| Scrape trigger | Manual / cron (`0 */12 * * *`) | Cron + manual trigger via admin UI |
| Lead filtering | Regex + keyword rules | Claude Haiku AI scoring (score 1–10) + ICP match |
| Intent detection | Keyword pattern match | AI label: `BUYER_PROJECT / GENERAL_PAIN / NOT_RELEVANT` |
| Duplicate detection | `linkedin_url` dedup in Python | `UNIQUE(linkedin_url)` constraint in PostgreSQL |
| Contact enrichment | SignalHire (4763 credits on migration) | SignalHire API with credit tracking |

## Lead Management

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Lead storage | PostgreSQL (single table, monolithic) | PostgreSQL with normalized contacts, outreach_log, proposals |
| Lead scoring | Integer 1–10 stored as-is | `score INT` + `icp_type TEXT` + `intent_label` |
| Lead status | `new / contacted / replied / rejected` | Same + `saved / archived` |
| Search phrases | SERIAL ID, text, platform filter | Same schema, LinkedIn-only focus |
| Notes | Plain text field | JSONB `notes` field + admin text editor |
| Manual lead add | Not supported | POST `/api/leads/manual` |

## Outreach

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Outreach channels | Email only | Email, LinkedIn, WhatsApp, Call, Other |
| Message drafting | Python template engine | AI draft generation (3 channel-specific variants) |
| Outreach log | Single table with status | `outreach_log` with `status` enum tracking delivery state |
| Follow-up queue | No | Mobile "Follow-up" tab — leads sent >7 days ago with no reply |
| WhatsApp | Not supported | WhatsApp Business API integration (active) |

## Proposals

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Proposal builder | Playwright PDF renderer (1612-line route) | Claude Haiku markdown generation + `lead_proposals` table |
| AI content | Stored as full JSONB blob | `content_md TEXT` + `ai_content JSONB` for overrides |
| PDF export | Playwright/Chromium headless render | Stub (501) — to be implemented without Playwright |
| Proposal status | `draft / sent / viewed / accepted` | Same |
| Proposal sending | Email via Resend | Resend integration (same) |
| Scope / Pricing | Flat JSON | `scope JSONB` + `pricing JSONB` with override support |

## Admin Dashboard

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Dashboard | Basic Flask template | React 18 + Vite SPA with real-time SSE updates |
| Stats | `total_leads`, `new_leads` | Full stats: total/new/active/converted/pending_outreach + revenue |
| User management | Single admin user (env var) | Multi-user with roles: `admin / super_admin / viewer` |
| Feature flags | Hardcoded env vars | `feature_flags` table with per-flag rollout % |
| Audit log | File-based | `audit_log` table with actor, action, target, IP |
| API key management | `.env` only | `api_keys` table with expiry + scope |
| Session management | No visibility | `active_sessions` table, admin can revoke |

## Settings & Configuration

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Settings storage | `.env` file + flat Python config | `app_settings` table (key/value with category + is_secret) |
| API keys stored | In `.env` | Migrated to `app_settings` via `002_import_old_settings.sql` |
| Apify tokens | Single token | 7-token JSON array with round-robin rotation |
| Brand config | Hardcoded | `company_profile` JSON in `app_settings` |
| AI context | Hardcoded prompts | `ai_context_pitch / ideal_clients / case_studies / writing_style / banned_phrases` in settings |
| Schedule | Hardcoded cron | `schedule_cron` setting (migrated: `0 */12 * * *`) |

## Compliance (DPDP)

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Consent tracking | None | `consent_records` table (purpose, action, policy_version) |
| Erasure requests | None | `erasure_requests` with workflow: pending → approved → verified |
| Data export | None | GET `/api/me/data-export` returns full user data package |
| Breach log | None | `breach_log` table with severity, affected users, DPB report stub |

## Billing

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Payment gateway | None | Cashfree (INR: UPI, cards, net banking) |
| Plans | None | `subscription_plans` table with token grants |
| Subscriptions | None | `subscriptions` table with status tracking |
| Token system | None | `token_grants + token_transactions + user_token_balance` view |
| Invoices | None | `invoices` table with GST details (27EEFPB1124D2Z7) |
| Coupons | None | `coupons` table with usage tracking |

## Mobile App

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Mobile client | None | React Native + Expo 50 (Android APK via EAS) |
| Navigation | N/A | Expo Router file-based tabs: Home / Explore / Insights / Outreach / Settings |
| UI rendering | N/A | Server-Driven UI (SDUI) via `ui_manifests` — layouts served from backend |
| Lead detail | N/A | Full lead detail with outreach log, notes, proposals, contact info |
| Proposal view | N/A | Proposals section in lead detail with PDF link |
| Follow-up queue | N/A | "Follow-up" tab: leads sent >7 days ago, no reply |
| Push notifications | N/A | Expo Push Notifications (expo-notifications) with token stored per user |
| Offline storage | N/A | react-native-mmkv for fast local caching |
| Payments | N/A | Cashfree RN SDK + Paywall screen + token top-up |

## Infrastructure

| Feature | Old System | New Platform |
|---------|-----------|--------------|
| Hosting | Single VPS (Python process) | Docker + nginx reverse proxy |
| Landing page | None | `/landing/index.html` at `/` (static HTML/CSS/JS) |
| Admin SPA | Served at `/` | Served at `/app/` |
| API | Flask + Gunicorn | Express.js + TypeScript |
| Database | PostgreSQL (same instance) | PostgreSQL (same, new schema) |
| Real-time | Polling | Server-Sent Events (SSE) on `/api/admin/live` + `/api/me/live` |
| Job queue | Cron only | BullMQ + scrape cron |
| Logging | `print()` / file logs | pino structured JSON logging |

## Data Migration

| Item | Records Migrated | Filter |
|------|-----------------|--------|
| Search phrases | All LinkedIn phrases | `platform = 'linkedin'` |
| Leads | High-quality only | `score >= 4 OR intent_label = 'BUYER_PROJECT'` |
| Contacts | Mapped from migrated leads | Via lead UUID map |
| Outreach log | Mapped from migrated leads | Via lead UUID map |
| Proposals | Mapped from migrated leads | Via lead UUID map |
| Settings | All 44 keys | From `import/all_settings.tsv` |
