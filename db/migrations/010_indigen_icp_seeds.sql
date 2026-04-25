-- Replace demo leads with 30 Indigen-ICP-matched seed leads.
-- Drops every existing lead (FK CASCADE clears contacts/outreach_log/filter_feedback)
-- then seeds 30 leads spread across the four ICP segments Indigen actually serves:
--   D2C / Shopify Plus / headless commerce  (10)
--   SaaS / React Native mobile builds       (8)
--   AI chatbots / workflow automation       (6)
--   Hiring developer / agency in India      (4)
--   Website redesign                        (2)
-- All posts are originals (no real LinkedIn text reproduced) and LinkedIn slugs are
-- fictional — enrichment will fail until SignalHire is wired up. owner_id is the
-- Indigen super_admin 32f83f94-8959-4193-8431-9f4e580e68c3.

BEGIN;

DELETE FROM leads;
DELETE FROM contacts;  -- belt-and-suspenders, CASCADE should already have cleared

INSERT INTO leads (
  owner_id, name, headline, linkedin_url, company,
  post_text, post_url, post_date,
  score, icp_type, status,
  enrichment_status, enriched_at,
  intent_label, intent_confidence
) VALUES
-- ============== D2C / Shopify Plus / headless (10) ==============
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Priya Sharma',
  'Founder @ Slate Studio · Skincare D2C scaling on Shopify Plus',
  'https://linkedin.com/in/priya-sharma-slate',
  'Slate Studio',
  E'Three months into our Shopify Plus migration and I am hitting the limits of the standard checkout. Has anyone here built custom shipping rules with the Functions API? We are shipping skincare to four countries and the tax + duty logic is a maze. Genuinely open to recs for a small but sharp Shopify dev team.',
  'https://www.linkedin.com/posts/priya-sharma-slate_activity-7000000123001-AB',
  NOW() - INTERVAL '2 days',
  9, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '1 day',
  'strong_buyer', 0.92
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Rahul Mehra',
  'Co-founder @ Helix Labs · Headless Shopify + Hydrogen',
  'https://linkedin.com/in/rahul-mehra-helix',
  'Helix Labs',
  E'Spent the weekend prototyping Hydrogen on top of our Plus storefront. The DX is great but I am not sure we have the bandwidth to maintain a custom front-end. Looking for an agency that has actually shipped headless Shopify in production — not just experimented. India-based preferred for the timezone overlap.',
  'https://www.linkedin.com/posts/rahul-mehra-helix_activity-7000000123002-CD',
  NOW() - INTERVAL '1 day',
  10, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '12 hours',
  'strong_buyer', 0.96
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Vikram Anand',
  'Founder @ Kindred Co · D2C accessories scaling INR 1Cr to 10Cr',
  'https://linkedin.com/in/vikram-anand-kindred',
  'Kindred Co',
  E'From INR 1 Cr to INR 10 Cr in 18 months has been wild. The site is the bottleneck now — slow LCP, broken filtering on mobile, abandoned carts climbing every week. We need someone who can rebuild the storefront on Shopify Plus without disappearing for three months. Open to fixed-scope or retainer.',
  'https://www.linkedin.com/posts/vikram-anand-kindred_activity-7000000123003-EF',
  NOW() - INTERVAL '5 days',
  9, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '4 days',
  'buyer', 0.84
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Ankit Bhatt',
  'Founder @ Northstar · Migrating Magento to Shopify Plus',
  'https://linkedin.com/in/ankit-bhatt-northstar',
  'Northstar',
  E'Pulling the trigger on a Magento to Shopify Plus move this quarter. The data migration alone scares me — twelve years of order history, 40k SKUs, three currencies. Anyone here done this at scale? Especially keen to talk to teams who have done it without nuking SEO.',
  'https://www.linkedin.com/posts/ankit-bhatt-northstar_activity-7000000123004-GH',
  NOW() - INTERVAL '8 days',
  8, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '7 days',
  'buyer', 0.81
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Kavya Iyer',
  'Founder @ Granular · Headless commerce on Shopify Plus',
  'https://linkedin.com/in/kavya-iyer-granular',
  'Granular',
  E'Building Granular as a headless commerce stack — Shopify Plus on the back, Next.js plus Sanity on the front. The biggest pain right now is preview environments for content editors. If you have solved this for a small D2C team, I would love to hear the trade-offs you actually made.',
  'https://www.linkedin.com/posts/kavya-iyer-granular_activity-7000000123005-IJ',
  NOW() - INTERVAL '4 days',
  9, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '3 days',
  'strong_buyer', 0.9
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Riya Sen',
  'Co-founder @ Boltframe · Custom Shopify Plus theme work',
  'https://linkedin.com/in/riya-sen-boltframe',
  'Boltframe',
  E'Looked at every Shopify Plus theme on the market this week and they all feel the same. We are designing a custom theme + storefront, but I need a developer who actually understands Liquid plus the section rendering API instead of just slapping Tailwind on top. Long-term partnership for the right team.',
  'https://www.linkedin.com/posts/riya-sen-boltframe_activity-7000000123006-KL',
  NOW() - INTERVAL '11 days',
  8, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '10 days',
  'buyer', 0.78
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Arjun Rao',
  'Founder @ Loom & Co · D2C apparel · Shopify checkout customization',
  'https://linkedin.com/in/arjun-rao-loom',
  'Loom & Co',
  E'Customer support is drowning in checkout edge cases — incorrect taxes for J and K, COD failures, gift card stacking. We are on Shopify Plus so I know Functions API can fix most of this, but I need a senior dev who has shipped these before. Who has built this for a fashion brand?',
  'https://www.linkedin.com/posts/arjun-rao-loom_activity-7000000123007-MN',
  NOW() - INTERVAL '6 days',
  9, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '5 days',
  'strong_buyer', 0.88
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Neha Joshi',
  'Founder @ Hearthstone · Home goods D2C scaling Shopify Plus internationally',
  'https://linkedin.com/in/neha-joshi-hearthstone',
  'Hearthstone',
  E'Finally went live in the US and UK last week — and now my Shopify admin is chaos. Multi-region inventory, currency-specific pricing, separate transactional emails per market. I need someone who has built a clean ops layer on top of Plus for international D2C. Hard mode: bootstrapped, no VC budget.',
  'https://www.linkedin.com/posts/neha-joshi-hearthstone_activity-7000000123008-OP',
  NOW() - INTERVAL '9 days',
  8, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '8 days',
  'buyer', 0.82
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Karthik Subramanian',
  'Founder @ Bloom Decor · Hiring a Shopify dev team for re-architect',
  'https://linkedin.com/in/karthik-sub-bloom',
  'Bloom Decor',
  E'Six years on Shopify and the storefront is held together with apps and duct tape. Time for a proper re-architect — fewer apps, more custom Liquid plus Functions, faster site, cleaner CMS. Hiring a team that has actually done this before. Plus merchant credentials a bonus.',
  'https://www.linkedin.com/posts/karthik-sub-bloom_activity-7000000123009-QR',
  NOW() - INTERVAL '3 days',
  10, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '2 days',
  'strong_buyer', 0.94
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Aditya Naik',
  'Founder @ Khadi & Co · Slow-fashion D2C, headless front-end',
  'https://linkedin.com/in/aditya-naik-khadi',
  'Khadi & Co',
  E'Slow-fashion D2C — small batch drops, lots of editorial, every collection is a story. The default Shopify theme does not do justice to the work. Looking for a small studio that can build us a headless front-end with great content tooling. Sustainability story matters.',
  'https://www.linkedin.com/posts/aditya-naik-khadi_activity-7000000123010-ST',
  NOW() - INTERVAL '7 days',
  8, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '6 days',
  'buyer', 0.83
),

-- ============== React Native / Mobile (8) ==============
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Anjali Kapoor',
  'Head of Ops @ Pivot Mfg · React Native field-ops app',
  'https://linkedin.com/in/anjali-kapoor-pivot',
  'Pivot Mfg',
  E'We are a manufacturing SME and our floor team is on paper checklists. Need a React Native app for shop-floor data capture — works offline, syncs to our SQL database when WiFi is available. Plus a small admin dashboard. India-based dev or studio strongly preferred.',
  'https://www.linkedin.com/posts/anjali-kapoor-pivot_activity-7000000123011-UV',
  NOW() - INTERVAL '5 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '4 days',
  'strong_buyer', 0.89
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Rohan Gupta',
  'Founder @ Beacon Labs · Cutting an RN MVP in 6 weeks',
  'https://linkedin.com/in/rohan-gupta-beacon',
  'Beacon Labs',
  E'Cutting a React Native MVP in six weeks and I need help. The product is a B2B inspection app — camera capture, geotagging, reports. I have the designs and API ready, I just do not want to ship a Frankenstein. Open to a fast partner who can move with us.',
  'https://www.linkedin.com/posts/rohan-gupta-beacon_activity-7000000123012-WX',
  NOW() - INTERVAL '1 day',
  10, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '6 hours',
  'strong_buyer', 0.95
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Sneha Pillai',
  'Co-founder @ Maple Group · Health-tech consumer app',
  'https://linkedin.com/in/sneha-pillai-maple',
  'Maple Group',
  E'Building a consumer health-tech app in India — telemedicine plus tracking plus reminders. We have Figma designs done. Hiring a React Native developer (or small team) who has shipped a real consumer app, ideally one with HIPAA / DPDP-grade data flow.',
  'https://www.linkedin.com/posts/sneha-pillai-maple_activity-7000000123013-YZ',
  NOW() - INTERVAL '12 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '11 days',
  'strong_buyer', 0.86
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Manish Kothari',
  'Founder @ Acme Threads · Bootstrapping iOS + Android via React Native',
  'https://linkedin.com/in/manish-kothari-acme',
  'Acme Threads',
  E'Bootstrapping our way to v1 — iOS plus Android via React Native, no native code if we can avoid it. I have the product, design and a backend ready. Looking for a senior RN engineer who is OK with shipping 80 percent good fast over 100 percent good slow. India hours preferred.',
  'https://www.linkedin.com/posts/manish-kothari-acme_activity-7000000123014-AB',
  NOW() - INTERVAL '14 days',
  8, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '13 days',
  'buyer', 0.79
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Pooja Reddy',
  'Founder @ Indigo Stitch · React Native rewrite of our web product',
  'https://linkedin.com/in/pooja-reddy-indigo',
  'Indigo Stitch',
  E'Our web product has hit a ceiling — 70 percent of usage is mobile and the responsive site is brutal. Time to rewrite as React Native and reuse the API. Need a developer who has done a clean web to RN port without rebuilding the whole product. 8 to 10 week engagement.',
  'https://www.linkedin.com/posts/pooja-reddy-indigo_activity-7000000123015-CD',
  NOW() - INTERVAL '17 days',
  8, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '16 days',
  'buyer', 0.76
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Tarun Malhotra',
  'Founder @ Pista Atelier · SaaS for Indian SMBs · React Native + FastAPI',
  'https://linkedin.com/in/tarun-malhotra-pista',
  'Pista Atelier',
  E'Working on a SaaS for Indian small businesses — invoicing, expense tracking, GST. React Native front-end, FastAPI back-end. Stack is set, scope is clear, I just need an experienced RN dev to take the mobile side off my plate so I can focus on growth.',
  'https://www.linkedin.com/posts/tarun-malhotra-pista_activity-7000000123016-EF',
  NOW() - INTERVAL '4 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '3 days',
  'strong_buyer', 0.88
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Divya Krishnan',
  'Founder @ Riverbank · Marketplace for second-hand designer fashion',
  'https://linkedin.com/in/divya-krishnan-riverbank',
  'Riverbank',
  E'Marketplace for second-hand designer fashion. v1 needs to be React Native — buyers and sellers, in-app messaging, escrow. Looking for an RN dev or small studio that can come in for v1 and stick around for v2. Bonus if you have built marketplace mechanics before.',
  'https://www.linkedin.com/posts/divya-krishnan-riverbank_activity-7000000123017-GH',
  NOW() - INTERVAL '9 days',
  7, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '8 days',
  'researching', 0.7
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Rakesh Verma',
  'Co-founder @ Sweetlime · React Native v1 launching next month',
  'https://linkedin.com/in/rakesh-verma-sweetlime',
  'Sweetlime',
  E'Pushing v1 of our React Native app live next month. Already have a freelancer doing the heavy lift but we need a proper studio relationship to scale into Q3. CI / CD, store submissions, post-launch support. India preferred.',
  'https://www.linkedin.com/posts/rakesh-verma-sweetlime_activity-7000000123018-IJ',
  NOW() - INTERVAL '13 days',
  8, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '12 days',
  'buyer', 0.81
),

-- ============== AI chatbot / Workflow automation (6) ==============
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Ishita Banerjee',
  'Founder @ Brushstroke · Building a Claude-powered chatbot for D2C support',
  'https://linkedin.com/in/ishita-banerjee-brushstroke',
  'Brushstroke',
  E'Customer support is eating 30 percent of my week. Looking for someone to build us a Claude-powered chat that knows our SKUs, our return policy, and the last three orders for any signed-in customer. Shopify front-end, ideally drops in via app or theme. Real conversations only.',
  'https://www.linkedin.com/posts/ishita-banerjee-brushstroke_activity-7000000123019-KL',
  NOW() - INTERVAL '6 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '5 days',
  'strong_buyer', 0.89
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Saurav Das',
  'Co-founder @ Tatva Wellness · Automating onboarding with n8n + Claude',
  'https://linkedin.com/in/saurav-das-tatva',
  'Tatva Wellness',
  E'Our onboarding is a mess of Google Forms, Notion, Stripe and a WhatsApp group. Need someone to wire all of this together with n8n plus Claude — auto-tag, auto-respond, auto-create the invoice. Ideally a freelancer who lives in the automation world day to day.',
  'https://www.linkedin.com/posts/saurav-das-tatva_activity-7000000123020-MN',
  NOW() - INTERVAL '10 days',
  8, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '9 days',
  'buyer', 0.82
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Meera Pillai',
  'Founder @ Saffron Stack · Claude-powered agents for SMB workflows',
  'https://linkedin.com/in/meera-pillai-saffron',
  'Saffron Stack',
  E'Building Saffron — Claude-powered agents for Indian SMB workflows. We have the agent layer, but I need a senior engineer who knows MCP, tool calling, and how to make agents that do not hallucinate. Hiring contractor with possibility of joining founding team.',
  'https://www.linkedin.com/posts/meera-pillai-saffron_activity-7000000123021-OP',
  NOW() - INTERVAL '2 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '1 day',
  'strong_buyer', 0.91
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Akash Shetty',
  'Eng lead @ Kavach Tech · Slack bot + Linear integration',
  'https://linkedin.com/in/akash-shetty-kavach',
  'Kavach Tech',
  E'Want to wire Linear and Slack so my team stops manually moving tickets. Looking for an AI / automation dev who can build a Slack bot that auto-creates Linear issues from messages, tags the right person, and closes the loop. Should be a 1 to 2 week project.',
  'https://www.linkedin.com/posts/akash-shetty-kavach_activity-7000000123022-QR',
  NOW() - INTERVAL '18 days',
  7, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '17 days',
  'researching', 0.68
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Shreya Hegde',
  'Founder @ Westwind Co · MCP server build for internal stack',
  'https://linkedin.com/in/shreya-hegde-westwind',
  'Westwind Co',
  E'We have a sprawling internal stack — CRM, Notion, Postgres, Linear. Want to build an MCP server so our LLM agents can read and write across it. Looking for a Python dev who has shipped an MCP server in production, not just a demo.',
  'https://www.linkedin.com/posts/shreya-hegde-westwind_activity-7000000123023-ST',
  NOW() - INTERVAL '5 days',
  8, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '4 days',
  'buyer', 0.84
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Varun Patel',
  'Founder @ Halcyon Labs · AI agent for sales outreach',
  'https://linkedin.com/in/varun-patel-halcyon',
  'Halcyon Labs',
  E'Sales team spends four hours a day on outreach. I want an AI agent that drafts personalized cold emails, picks three leads to focus on each morning, and learns from what gets replies. Anthropic plus Postgres plus a thin React app. Open to discussing scope.',
  'https://www.linkedin.com/posts/varun-patel-halcyon_activity-7000000123024-UV',
  NOW() - INTERVAL '11 days',
  9, 'SaaS', 'New',
  'enriched', NOW() - INTERVAL '10 days',
  'strong_buyer', 0.87
),

-- ============== Hiring developer / agency in India (4) ==============
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Tanvi Agarwal',
  'CTO @ Lumberyard · Hunting for a backend + DevOps studio in India',
  'https://linkedin.com/in/tanvi-agarwal-lumberyard',
  'Lumberyard',
  E'Lumberyard is hunting for a dev agency in India for backend plus DevOps work — mostly Node and AWS, some K8s. Long-term retainer, not project work. Drop a comment if you run a tight 5 to 10 person shop and want to chat.',
  'https://www.linkedin.com/posts/tanvi-agarwal-lumberyard_activity-7000000123025-WX',
  NOW() - INTERVAL '15 days',
  7, 'Services', 'New',
  'enriched', NOW() - INTERVAL '14 days',
  'buyer', 0.76
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Rajat Singh',
  'Founder @ Quill & Co · Hiring full-stack devs (Bangalore / Pune)',
  'https://linkedin.com/in/rajat-singh-quill',
  'Quill & Co',
  E'Hiring two full-stack devs (Node plus React) — Bangalore, Pune, or remote. Long-term, retainer-style. We pay above market for senior devs who can own product end to end. DM with a CV or your portfolio.',
  'https://www.linkedin.com/posts/rajat-singh-quill_activity-7000000123026-YZ',
  NOW() - INTERVAL '8 days',
  8, 'Services', 'New',
  'enriched', NOW() - INTERVAL '7 days',
  'buyer', 0.8
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Diya Mukherjee',
  'Founder @ Tinplate Studio · Looking for a 6-month dev team',
  'https://linkedin.com/in/diya-mukherjee-tinplate',
  'Tinplate Studio',
  E'Need a small dev team for a 6 month build — early-stage SaaS, Next.js plus Postgres plus a tiny mobile app at the end. Looking for a studio, not freelancers. India-based preferred so we can work in real time.',
  'https://www.linkedin.com/posts/diya-mukherjee-tinplate_activity-7000000123027-AB',
  NOW() - INTERVAL '19 days',
  7, 'Services', 'New',
  'enriched', NOW() - INTERVAL '18 days',
  'researching', 0.7
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Nikhil Khanna',
  'Founder @ Magenta Matter · Need a Mumbai dev studio for ongoing work',
  'https://linkedin.com/in/nikhil-khanna-magenta',
  'Magenta Matter',
  E'Magenta is going from agency to product — need a Mumbai-based dev studio for ongoing app and web work as we incubate. Open to retainer. Bonus points if you are comfortable working without specs and figuring it out as we go.',
  'https://www.linkedin.com/posts/nikhil-khanna-magenta_activity-7000000123028-CD',
  NOW() - INTERVAL '21 days',
  6, 'Services', 'New',
  'enriched', NOW() - INTERVAL '20 days',
  'researching', 0.66
),

-- ============== Website redesign (2) ==============
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Sania Qureshi',
  'Head of Marketing @ Cardamom AI · Webflow / Next.js redesign',
  'https://linkedin.com/in/sania-qureshi-cardamom',
  'Cardamom AI',
  E'Cardamom''s site has been the same since 2023 and it shows. Looking for a Webflow or Next.js studio that can give us a brand-aligned site in 4 to 5 weeks. Should be fast, animated, and not look like every other AI startup site on the planet.',
  'https://www.linkedin.com/posts/sania-qureshi-cardamom_activity-7000000123029-EF',
  NOW() - INTERVAL '6 days',
  7, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '5 days',
  'buyer', 0.78
),
(
  '32f83f94-8959-4193-8431-9f4e580e68c3',
  'Yash Choudhary',
  'Founder @ Driftroot · Redoing our product website end to end',
  'https://linkedin.com/in/yash-choudhary-driftroot',
  'Driftroot',
  E'Redoing the Driftroot product site end to end. Need a brand-savvy dev partner — copy plus design plus build, not a generic agency. Bonus if you have worked with consumer brands before. Indian preferred for cultural fit.',
  'https://www.linkedin.com/posts/yash-choudhary-driftroot_activity-7000000123030-GH',
  NOW() - INTERVAL '16 days',
  6, 'D2C', 'New',
  'enriched', NOW() - INTERVAL '15 days',
  'researching', 0.69
);

-- One email contact per lead + phone for ~half of them.
INSERT INTO contacts (lead_id, type, value, sub_type)
SELECT l.id, c.kind, c.value, 'seed'
FROM (VALUES
  -- emails (all 30)
  ('https://linkedin.com/in/priya-sharma-slate',          'email', 'priya.sharma@slatestudio.com'),
  ('https://linkedin.com/in/rahul-mehra-helix',           'email', 'rahul.mehra@helixlabs.com'),
  ('https://linkedin.com/in/vikram-anand-kindred',        'email', 'vikram@kindredco.com'),
  ('https://linkedin.com/in/ankit-bhatt-northstar',       'email', 'ankit.bhatt@northstar.com'),
  ('https://linkedin.com/in/kavya-iyer-granular',         'email', 'kavya@granular.com'),
  ('https://linkedin.com/in/riya-sen-boltframe',          'email', 'riya@boltframe.com'),
  ('https://linkedin.com/in/arjun-rao-loom',              'email', 'arjun@loomco.com'),
  ('https://linkedin.com/in/neha-joshi-hearthstone',      'email', 'neha.joshi@hearthstone.com'),
  ('https://linkedin.com/in/karthik-sub-bloom',           'email', 'karthik@bloomdecor.com'),
  ('https://linkedin.com/in/aditya-naik-khadi',           'email', 'aditya@khadico.com'),
  ('https://linkedin.com/in/anjali-kapoor-pivot',         'email', 'anjali.kapoor@pivotmfg.com'),
  ('https://linkedin.com/in/rohan-gupta-beacon',          'email', 'rohan@beaconlabs.com'),
  ('https://linkedin.com/in/sneha-pillai-maple',          'email', 'sneha.pillai@maplegroup.com'),
  ('https://linkedin.com/in/manish-kothari-acme',         'email', 'manish@acmethreads.com'),
  ('https://linkedin.com/in/pooja-reddy-indigo',          'email', 'pooja@indigostitch.com'),
  ('https://linkedin.com/in/tarun-malhotra-pista',        'email', 'tarun@pistaatelier.com'),
  ('https://linkedin.com/in/divya-krishnan-riverbank',    'email', 'divya.krishnan@riverbank.com'),
  ('https://linkedin.com/in/rakesh-verma-sweetlime',      'email', 'rakesh@sweetlime.com'),
  ('https://linkedin.com/in/ishita-banerjee-brushstroke', 'email', 'ishita@brushstroke.com'),
  ('https://linkedin.com/in/saurav-das-tatva',            'email', 'saurav@tatvawellness.com'),
  ('https://linkedin.com/in/meera-pillai-saffron',        'email', 'meera@saffronstack.com'),
  ('https://linkedin.com/in/akash-shetty-kavach',         'email', 'akash@kavachtech.com'),
  ('https://linkedin.com/in/shreya-hegde-westwind',       'email', 'shreya.hegde@westwindco.com'),
  ('https://linkedin.com/in/varun-patel-halcyon',         'email', 'varun@halcyonlabs.com'),
  ('https://linkedin.com/in/tanvi-agarwal-lumberyard',    'email', 'tanvi.agarwal@lumberyard.com'),
  ('https://linkedin.com/in/rajat-singh-quill',           'email', 'rajat@quillco.com'),
  ('https://linkedin.com/in/diya-mukherjee-tinplate',     'email', 'diya@tinplatestudio.com'),
  ('https://linkedin.com/in/nikhil-khanna-magenta',       'email', 'nikhil@magentamatter.com'),
  ('https://linkedin.com/in/sania-qureshi-cardamom',      'email', 'sania.qureshi@cardamom.com'),
  ('https://linkedin.com/in/yash-choudhary-driftroot',    'email', 'yash@driftroot.com'),
  -- phones for 14 of the 30
  ('https://linkedin.com/in/priya-sharma-slate',          'phone', '+91 98 102 12345'),
  ('https://linkedin.com/in/rahul-mehra-helix',           'phone', '+91 99 871 23456'),
  ('https://linkedin.com/in/kavya-iyer-granular',         'phone', '+91 98 765 43210'),
  ('https://linkedin.com/in/arjun-rao-loom',              'phone', '+91 97 123 45670'),
  ('https://linkedin.com/in/karthik-sub-bloom',           'phone', '+91 99 765 12340'),
  ('https://linkedin.com/in/anjali-kapoor-pivot',         'phone', '+91 98 332 11244'),
  ('https://linkedin.com/in/rohan-gupta-beacon',          'phone', '+91 97 991 23478'),
  ('https://linkedin.com/in/sneha-pillai-maple',          'phone', '+91 96 234 88210'),
  ('https://linkedin.com/in/tarun-malhotra-pista',        'phone', '+91 98 110 33445'),
  ('https://linkedin.com/in/ishita-banerjee-brushstroke', 'phone', '+91 99 230 44512'),
  ('https://linkedin.com/in/meera-pillai-saffron',        'phone', '+91 97 887 65432'),
  ('https://linkedin.com/in/varun-patel-halcyon',         'phone', '+91 99 110 56789'),
  ('https://linkedin.com/in/rajat-singh-quill',           'phone', '+91 98 451 22678'),
  ('https://linkedin.com/in/sania-qureshi-cardamom',      'phone', '+91 98 989 67890')
) AS c(url, kind, value)
JOIN leads l ON l.linkedin_url = c.url;

COMMIT;
