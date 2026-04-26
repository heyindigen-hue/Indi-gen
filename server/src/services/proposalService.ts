import axios from 'axios';
import { config } from '../config';
import { logger } from '../logger';
import { getSettings } from '../db/settings';

const MODEL = 'claude-haiku-4-5-20251001';

export interface LeadForProposal {
  id: string;
  name?: string | null;
  headline?: string | null;
  company?: string | null;
  post_text?: string | null;
  intent_label?: string | null;
  intent_reason?: string | null;
  icp_type?: string | null;
  profile_data?: any;
}

export interface ProposalTier {
  name: string;
  price_inr: number;
  timeline: string;
  scope: string[];
  deliverables: string[];
}

export interface ProposalPayload {
  tiers: ProposalTier[];
}

interface IndigenContext {
  pitch: string;
  caseStudies: string;
  idealClients: string;
  writingStyle: string;
  bannedPhrases: string;
  companyName: string;
  founder: string;
}

async function loadContext(): Promise<IndigenContext> {
  const ctx = await getSettings([
    'ai_context_pitch',
    'ai_context_case_studies',
    'ai_context_ideal_clients',
    'ai_context_writing_style',
    'ai_context_banned_phrases',
    'company_profile',
  ]).catch(() => ({} as Record<string, string>));

  let companyName = 'Indigen Services';
  let founder = 'Yashraj Bhadane';
  if (ctx['company_profile']) {
    try {
      const profile = JSON.parse(ctx['company_profile']);
      companyName = profile.name || companyName;
      founder = profile.founder || founder;
    } catch {
      /* ignore */
    }
  }

  return {
    pitch:
      ctx['ai_context_pitch'] ||
      `${companyName} — full-stack AI + SaaS dev studio shipping Shopify Plus, RN, AI agents.`,
    caseStudies:
      ctx['ai_context_case_studies'] ||
      'Recently shipped a 10x-faster Shopify Plus storefront for a D2C skincare brand and a multi-agent AI workflow for a B2B SaaS.',
    idealClients:
      ctx['ai_context_ideal_clients'] ||
      'D2C founders, SaaS founders, and AI startups that need a senior team without the agency overhead.',
    writingStyle:
      ctx['ai_context_writing_style'] ||
      'Specific, peer-to-peer, and concrete. No fluff.',
    bannedPhrases:
      ctx['ai_context_banned_phrases'] ||
      'just wanted to reach out, hope this finds you well, circle back, synergy, low-hanging fruit',
    companyName,
    founder,
  };
}

function buildPrompt(lead: LeadForProposal, ctx: IndigenContext): string {
  const profile = lead.profile_data || {};
  const profileBits: string[] = [];
  if (profile.summary || profile.bio) profileBits.push(`Bio: ${(profile.summary || profile.bio).substring(0, 200)}`);
  if (Array.isArray(profile.experience) && profile.experience[0]) {
    const exp = profile.experience[0];
    if (exp.title) profileBits.push(`Current role: ${exp.title}${exp.company ? ` @ ${exp.company}` : ''}`);
  }

  return `You are ${ctx.founder} from ${ctx.companyName}, scoping a 3-tier proposal for a LinkedIn lead.

CONTEXT — ${ctx.companyName}:
${ctx.pitch}

IDEAL CLIENTS:
${ctx.idealClients}

CASE STUDIES (cite ONE if relevant in scope/deliverables):
${ctx.caseStudies}

WRITING STYLE:
${ctx.writingStyle}

BANNED PHRASES:
${ctx.bannedPhrases}

THE LEAD:
Name: ${lead.name || 'Unknown'}
Headline: ${lead.headline || '(none)'}
Company: ${lead.company || '(none)'}
ICP type: ${lead.icp_type || '(unknown)'}
Buyer-intent: ${lead.intent_label || '(unknown)'}${lead.intent_reason ? ` — ${lead.intent_reason}` : ''}
${profileBits.length ? `Profile snippets:\n- ${profileBits.join('\n- ')}` : ''}
${lead.post_text ? `\nThey posted:\n"""\n${lead.post_text.substring(0, 1000)}\n"""` : ''}

YOUR TASK:
Build a 3-tier proposal (Starter / Growth / Premium). Tailor the scope to what the lead
actually needs based on their post / role / ICP. Pricing is in INR (Indian Rupees).

PRICING GUIDANCE:
- Starter:   ₹150,000 – ₹250,000  · 2–3 weeks · MVP / scoped pilot
- Growth:    ₹400,000 – ₹650,000  · 4–6 weeks · production build (this is the recommended/featured tier)
- Premium:   ₹900,000 – ₹1,500,000 · 8–12 weeks · enterprise build with retainer

OUTPUT FORMAT — return ONE JSON object exactly:
{
  "tiers": [
    {
      "name": "Starter",
      "price_inr": 200000,
      "timeline": "2–3 weeks",
      "scope": ["bullet 1", "bullet 2", "bullet 3"],
      "deliverables": ["bullet 1", "bullet 2", "bullet 3"]
    },
    {
      "name": "Growth",
      "price_inr": 500000,
      "timeline": "4–6 weeks",
      "scope": ["…"],
      "deliverables": ["…"]
    },
    {
      "name": "Premium",
      "price_inr": 1200000,
      "timeline": "8–12 weeks",
      "scope": ["…"],
      "deliverables": ["…"]
    }
  ]
}

NO other text. NO markdown fences. JUST the JSON object.
Each scope/deliverables list should have 3-5 bullets, each ≤ 14 words, concrete and lead-specific.`;
}

function fallback(lead: LeadForProposal): ProposalPayload {
  const company = lead.company || 'Your team';
  return {
    tiers: [
      {
        name: 'Starter',
        price_inr: 200000,
        timeline: '2–3 weeks',
        scope: [
          `Discovery + architecture for ${company}`,
          'MVP scope freeze with one core flow',
          'Weekly demos to validate direction',
        ],
        deliverables: [
          'Working MVP deployed to staging',
          'Source code in your GitHub',
          'Handover doc + architecture diagram',
        ],
      },
      {
        name: 'Growth',
        price_inr: 500000,
        timeline: '4–6 weeks',
        scope: [
          `Full production build tailored to ${company}`,
          'CI/CD pipeline + observability baked in',
          'Two integrations of your choice',
          'Two rounds of UX iteration',
        ],
        deliverables: [
          'Production-ready app',
          'Test suite ≥80% coverage',
          'Runbook + on-call playbook',
          '30-day post-launch support',
        ],
      },
      {
        name: 'Premium',
        price_inr: 1200000,
        timeline: '8–12 weeks',
        scope: [
          'Multi-environment enterprise build',
          'AI / agent layer if scoped',
          'Security + compliance review (DPDP)',
          'Performance budget enforced via CI',
          '90-day retainer for tweaks',
        ],
        deliverables: [
          'Production app + staging + dev',
          'Full DPDP-compliant data layer',
          'Cost / latency dashboards',
          'Architecture decision records',
          '90-day on-call retainer',
        ],
      },
    ],
  };
}

export async function generateProposal(lead: LeadForProposal): Promise<ProposalPayload> {
  const apiKey = config.anthropic.apiKey;
  if (!apiKey) {
    logger.warn('proposalService: CLAUDE_API_KEY not set, using fallback proposal');
    return fallback(lead);
  }

  const ctx = await loadContext();
  const prompt = buildPrompt(lead, ctx);

  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 30000,
      }
    );
    const text: string = res.data?.content?.[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn({ leadId: lead.id }, 'proposalService: no JSON in Claude reply');
      return fallback(lead);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed?.tiers) || parsed.tiers.length === 0) {
      logger.warn({ leadId: lead.id }, 'proposalService: malformed tier array');
      return fallback(lead);
    }
    const tiers: ProposalTier[] = parsed.tiers.slice(0, 3).map((t: any) => ({
      name: String(t.name || 'Tier'),
      price_inr: Number(t.price_inr) || 0,
      timeline: String(t.timeline || ''),
      scope: Array.isArray(t.scope) ? t.scope.map(String) : [],
      deliverables: Array.isArray(t.deliverables) ? t.deliverables.map(String) : [],
    }));
    return { tiers };
  } catch (err: any) {
    logger.error({ leadId: lead.id, err: err.message }, 'proposalService: Claude call failed');
    return fallback(lead);
  }
}
