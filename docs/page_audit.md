# LeadHangover — Page Audit Report
Generated: 2026-04-25

## Summary of Fixes Applied This Session

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Admin `/admin/*` sub-routes all 404 (missing Vite base + Router basename) | CRITICAL | ✅ Fixed |
| 2 | Lead detail 404 — component missing, route unregistered | CRITICAL | ✅ Fixed |
| 3 | Landing logo uses wrong brand colors (orange petals instead of cream) | HIGH | ✅ Fixed |
| 4 | Admin login page has no editorial split-layout | HIGH | ✅ Fixed |
| 5 | Double `/api` prefix in 10 settings/security admin pages | CRITICAL | ✅ Fixed |
| 6 | `leads/proposals.tsx` (326 lines) orphaned — no route in App.tsx | HIGH | ✅ Fixed |

---

## Admin Pages (`/admin/*`)

| Route | Component File | Status | Notes |
|-------|---------------|--------|-------|
| `/admin/` | `dashboard/index.tsx` | ✅ Real | KPI cards, real API calls |
| `/admin/users` | `users/index.tsx` | ✅ Real | Full table with filters, 529 lines |
| `/admin/users/:id` | `users/[id].tsx` | ✅ Real | Full detail view, 879 lines |
| `/admin/users/invites` | `users/invites.tsx` | ✅ Real | Invite management, 222 lines |
| `/admin/users/waitlist` | `users/waitlist.tsx` | ✅ Real | Waitlist management, 155 lines |
| `/admin/users/verification` | inline | 🚧 Stub | PlaceholderPage — "Coming soon" |
| `/admin/users/activity` | inline | 🚧 Stub | PlaceholderPage — "Coming soon" |
| `/admin/users/roles` | inline | 🚧 Stub | PlaceholderPage — "Coming soon" |
| `/admin/leads` | `leads/index.tsx` | ✅ Real | Full table; bulk Delete is toast stub |
| `/admin/leads/:id` | `leads/[id].tsx` | ✅ Real | **Created this session** — 3-tab detail: Overview/Outreach/Notes |
| `/admin/leads/enrichment` | `leads/enrichment.tsx` | ✅ Real | Enrichment queue, 262 lines |
| `/admin/leads/add` | `leads/add.tsx` | ✅ Real | Manual add form, 161 lines |
| `/admin/leads/proposals` | `leads/proposals.tsx` | ✅ Real | **Route registered this session** — 326 lines, AI proposal management |
| `/admin/leads/scoring` | inline | 🚧 Stub | PlaceholderPage — "Coming soon" |
| `/admin/leads/export` | inline | 🚧 Stub | PlaceholderPage — "Coming soon" |
| `/admin/scrapers` | `scrapers/index.tsx` | ✅ Real | 335 lines; Quarantine is toast stub |
| `/admin/scrapers/runs` | `scrapers/runs.tsx` | ✅ Real | 282 lines |
| `/admin/scrapers/accounts` | `scrapers/accounts.tsx` | ✅ Real | 356 lines; Rotate/Pause are toast stubs |
| `/admin/scrapers/schedules` | `scrapers/schedules.tsx` | ✅ Real | 243 lines |
| `/admin/scrapers/sources` | inline | 🚧 Stub | PlaceholderPage |
| `/admin/scrapers/logs` | inline | 🚧 Stub | PlaceholderPage |
| `/admin/ai` | inline | 🚧 Stub | PlaceholderPage — section index |
| `/admin/ai/prompts` | `ai/prompts.tsx` | ✅ Real | 303 lines |
| `/admin/ai/context` | `ai/context.tsx` | ✅ Real | 110 lines |
| `/admin/ai/usage` | `ai/usage.tsx` | ✅ Real | 247 lines |
| `/admin/integrations` | `integrations/index.tsx` | ✅ Real | 133 lines; some "Coming soon" badges |
| `/admin/integrations/cashfree` | `integrations/cashfree.tsx` | ✅ Real | 135 lines |
| `/admin/integrations/anthropic` | `integrations/anthropic.tsx` | ✅ Real | 127 lines |
| `/admin/integrations/signalhire` | `integrations/signalhire.tsx` | ✅ Real | 97 lines |
| `/admin/integrations/linkedin` | `integrations/linkedin.tsx` | ✅ Real | 156 lines |
| `/admin/integrations/proxies` | `integrations/proxies.tsx` | ✅ Real | 115 lines |
| `/admin/integrations/email` | `integrations/email.tsx` | ✅ Real | 107 lines |
| `/admin/integrations/whatsapp` | `integrations/whatsapp.tsx` | ✅ Real | 127 lines |
| `/admin/billing` | inline | 🚧 Stub | PlaceholderPage — section index |
| `/admin/billing/plans` | `billing/plans.tsx` | ✅ Real | Edit via Dialog + mutation |
| `/admin/billing/subscriptions` | `billing/subscriptions.tsx` | ✅ Real | 358 lines |
| `/admin/billing/invoices` | `billing/invoices.tsx` | ✅ Real | 405 lines |
| `/admin/billing/refunds` | `billing/refunds.tsx` | ✅ Real | 345 lines |
| `/admin/billing/coupons` | `billing/coupons.tsx` | ✅ Real | 326 lines |
| `/admin/mobile-ui/home` | `mobile-ui/home.tsx` | ✅ Real | Drag-drop builder, 333 lines |
| `/admin/mobile-ui/tabs` | `mobile-ui/tabs.tsx` | ✅ Real | 343 lines |
| `/admin/mobile-ui/onboarding` | `mobile-ui/onboarding.tsx` | ✅ Real | 177 lines |
| `/admin/mobile-ui/paywall` | `mobile-ui/paywall.tsx` | ✅ Real | 387 lines |
| `/admin/mobile-ui/theme` | `mobile-ui/theme.tsx` | ✅ Real | 349 lines |
| `/admin/mobile-ui/strings` | `mobile-ui/strings.tsx` | ✅ Real | AI translate is toast stub |
| `/admin/mobile-ui/templates` | `mobile-ui/templates.tsx` | ✅ Real | Test send is toast stub |
| `/admin/settings` | inline | 🚧 Stub | PlaceholderPage — section index |
| `/admin/settings/brand` | `settings/brand.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/settings/company` | `settings/company.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/settings/legal` | `settings/legal.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/settings/templates` | `settings/templates.tsx` | ✅ Real | Redirects to /mobile-ui/templates |
| `/admin/settings/flags` | `settings/flags.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/settings/maintenance` | `settings/maintenance.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/security` | inline | 🚧 Stub | PlaceholderPage — section index |
| `/admin/security/admins` | `security/admins.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/security/sessions` | `security/sessions.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/security/api-keys` | `security/api-keys.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/security/audit` | `security/audit.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/security/dpdp` | `security/dpdp.tsx` | ✅ Fixed | **Double /api prefix fixed this session** |
| `/admin/platform` | inline | 🚧 Stub | PlaceholderPage — section index |
| `/admin/platform/logs` | `platform/logs.tsx` | ✅ Real | 335 lines |
| `/admin/platform/errors` | `platform/errors.tsx` | ✅ Real | 498 lines |
| `/admin/platform/webhooks` | `platform/webhooks.tsx` | ✅ Real | 403 lines |

---

## Customer Pages (`/`)

| Route | Component File | Status | Notes |
|-------|---------------|--------|-------|
| `/login` | `pages/Login.tsx` | ✅ Real | Form with zod validation |
| `/signup` | `pages/Signup.tsx` | ✅ Real | 235 lines |
| `/onboarding` | `pages/Onboarding.tsx` | ✅ Real | Multi-step, 418 lines |
| `/` (home) | `pages/Home.tsx` | ✅ Real | 269 lines |
| `/leads` | `pages/Leads.tsx` | ✅ Real | Full table, 539 lines |
| `/leads/:id` | `pages/LeadDetail.tsx` | ✅ Real | 530 lines with tabs |
| `/proposals` | `pages/Proposals.tsx` | ✅ Real | 214 lines |
| `/proposals/:id` | `pages/ProposalDetail.tsx` | ✅ Real | Markdown editor, 265 lines |
| `/outreach` | `pages/Outreach.tsx` | ✅ Real | 188 lines, real API |
| `/insights` | `pages/Insights.tsx` | ✅ Real | 324 lines |
| `/scrape` | `pages/Scrape.tsx` | ✅ Real | 374 lines |
| `/help` | `pages/Help.tsx` | ✅ Real | 201 lines |
| `/settings/account` | `settings/Account.tsx` | ✅ Real | 218 lines |
| `/settings/company` | `settings/Company.tsx` | ✅ Real | 206 lines |
| `/settings/billing` | `settings/Billing.tsx` | ✅ Real | 254 lines |
| `/settings/notifications` | `settings/Notifications.tsx` | ✅ Real | 139 lines |
| `/settings/integrations` | `settings/Integrations.tsx` | ✅ Real | WhatsApp section has "Coming soon" badge |
| `/settings/branding` | `settings/Branding.tsx` | 🚧 Partial | White-label preview panel missing (JSX comment placeholder) |

---

## Mobile Screens (`mobile/app/`)

| Screen | File | Status | Notes |
|--------|------|--------|-------|
| Login | `(auth)/login.tsx` | ✅ Real | 153 lines |
| Home/feed | `(tabs)/index.tsx` | ✅ Real | Manifest-driven, real API |
| Leads/explore | `(tabs)/explore.tsx` | ✅ Real | 277 lines |
| Outreach | `(tabs)/outreach.tsx` | ✅ Real | 365 lines |
| Insights | `(tabs)/insights.tsx` | ✅ Real | 315 lines |
| Settings (main) | `(tabs)/settings.tsx` | ✅ Real | 207 lines |
| Lead detail | `lead/[id].tsx` | ✅ Real | 790 lines with AI drafts |
| Onboarding | `onboarding.tsx` | ✅ Real | Multi-step, 572 lines |
| Paywall | `paywall.tsx` | ✅ Real | 557 lines, Cashfree integration |
| LinkedIn WebView | `webview-linkedin.tsx` | ✅ Real | 387 lines |
| settings/profile | `settings/profile.tsx` | ✅ Real | 185 lines |
| settings/password | `settings/password.tsx` | ✅ Real | 130 lines |
| settings/billing | `settings/billing.tsx` | ✅ Real | 158 lines |
| settings/notifications | `settings/notifications.tsx` | ✅ Real | 169 lines |
| settings/sessions | `settings/sessions.tsx` | ✅ Real | 152 lines |
| settings/2fa | `settings/2fa.tsx` | ✅ Real | 228 lines |
| settings/integrations | `settings/integrations.tsx` | 🚧 Partial | WhatsApp "Coming soon" badge |
| settings/branding | `settings/branding.tsx` | ✅ Real | 177 lines |
| settings/company | `settings/company.tsx` | ✅ Real | 260 lines |
| settings/legal | `settings/legal.tsx` | ✅ Real | 85 lines |
| settings/help | `settings/help.tsx` | ✅ Real | 190 lines |
| settings/data | `settings/data.tsx` | ✅ Real | 189 lines |
| settings/about | `settings/about.tsx` | ✅ Real | 105 lines |

**Note on mobile tabs:** Tab rendering is fully manifest-driven via `useManifest()`. If the backend returns empty/misconfigured manifest, no tabs render. The `index.tsx`, `explore.tsx`, `outreach.tsx`, `insights.tsx`, and `settings.tsx` screens only activate when the manifest maps their IDs.

---

## Remaining Known Stubs (not blocking — intentional "Coming soon")

These are registered routes that render a `PlaceholderPage` with "Coming soon" text. They are not broken, just not yet implemented:

- `/admin/users/verification`, `/admin/users/activity`, `/admin/users/roles`
- `/admin/leads/scoring`, `/admin/leads/export`
- `/admin/scrapers/sources`, `/admin/scrapers/logs`
- `/admin/ai` (section index)
- `/admin/billing` (section index)
- `/admin/integrations` section items with "Coming soon" badges
- `/admin/settings` (section index)
- `/admin/security` (section index)
- `/admin/platform` (section index)

## Remaining Low-Priority Issues (not fixed — no runtime breakage)

| File | Issue |
|------|-------|
| `admin/.../scrapers/accounts.tsx` | "Rotate cookie" and "Pause" buttons → toast stubs |
| `admin/.../mobile-ui/strings.tsx` | "AI translate" button → toast stub |
| `admin/.../mobile-ui/templates.tsx` | "Test send" (email + push) → toast stubs |
| `customer/.../settings/Branding.tsx` | White-label preview panel is a JSX comment placeholder |
| `mobile/.../settings/integrations.tsx` | WhatsApp section shows "Coming soon" badge |
