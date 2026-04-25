-- Add full 8-step onboarding sequence to the v3 mobile manifest
-- The admin onboarding editor reads from screens.onboarding.onboarding

UPDATE ui_manifests
SET manifest = jsonb_set(
  manifest,
  '{screens,onboarding}',
  '{
    "onboarding": [
      {
        "id": "welcome",
        "title": "Wake up to better leads",
        "body": "LeadHangover finds people already asking for what you sell — on LinkedIn, Reddit, and beyond.",
        "illustrationUrl": "",
        "inputType": "none",
        "options": [],
        "validationRegex": "",
        "animated": true,
        "order": 0
      },
      {
        "id": "company_name",
        "title": "Tell us about your business",
        "body": "This helps us find leads relevant to what you actually sell.",
        "illustrationUrl": "",
        "inputType": "text",
        "options": [],
        "validationRegex": "",
        "animated": false,
        "order": 1
      },
      {
        "id": "what_you_sell",
        "title": "What do you sell?",
        "body": "Describe your product or service in your own words.",
        "illustrationUrl": "",
        "inputType": "text",
        "options": [],
        "validationRegex": "",
        "animated": false,
        "order": 2
      },
      {
        "id": "ideal_client",
        "title": "Who is your ideal client?",
        "body": "Select all that apply — we will tune the lead feed to match.",
        "illustrationUrl": "",
        "inputType": "chip",
        "options": ["D2C Brand", "SaaS", "SME", "Healthcare", "Logistics", "Fintech", "Ecommerce", "AgriTech", "EduTech", "RealEstate", "Manufacturing", "Startup"],
        "validationRegex": "",
        "animated": false,
        "order": 3
      },
      {
        "id": "search_phrases",
        "title": "What are they saying online?",
        "body": "Pick or add phrases your ideal customers use when they need help.",
        "illustrationUrl": "",
        "inputType": "chip",
        "options": ["looking for developer", "need to build app", "hiring shopify dev", "building saas", "need mobile app", "looking for agency", "website redesign", "need tech co-founder"],
        "validationRegex": "",
        "animated": false,
        "order": 4
      },
      {
        "id": "geography",
        "title": "Which markets do you target?",
        "body": "Select regions so we focus on the right geography.",
        "illustrationUrl": "",
        "inputType": "chip",
        "options": ["India", "USA", "UK", "Canada", "Australia", "Maharashtra", "Karnataka", "Delhi", "Tamil Nadu", "Gujarat", "International"],
        "validationRegex": "",
        "animated": false,
        "order": 5
      },
      {
        "id": "plan",
        "title": "Choose your plan",
        "body": "Start free — upgrade anytime as you grow.",
        "illustrationUrl": "",
        "inputType": "select",
        "options": ["free", "starter", "pro", "enterprise"],
        "validationRegex": "",
        "animated": false,
        "order": 6
      },
      {
        "id": "finding_leads",
        "title": "Finding your first leads…",
        "body": "Scanning the web for people who need exactly what you offer.",
        "illustrationUrl": "",
        "inputType": "none",
        "options": [],
        "validationRegex": "",
        "animated": true,
        "order": 7
      }
    ]
  }'::jsonb,
  true
)
WHERE platform = 'mobile' AND version = 3;
