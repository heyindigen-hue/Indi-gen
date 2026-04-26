import axios from 'axios';
import { config } from '../config';
import { logger } from '../logger';
import { getSettings } from '../db/settings';

const MODEL = 'claude-haiku-4-5-20251001';

export interface LeadForDraft {
  id: string;
  name?: string | null;
  headline?: string | null;
  company?: string | null;
  post_text?: string | null;
  profile_data?: any;
  intent_label?: string | null;
}

export interface DraftSet {
  whatsapp: string;
  email_subject: string;
  email_body: string;
  linkedin_dm: string;
}

interface IndigenContext {
  pitch: string;
  caseStudies: string;
  writingStyle: string;
  bannedPhrases: string;
  signature: string;
  companyName: string;
  founder: string;
}

async function loadIndigenContext(): Promise<IndigenContext> {
  const ctx: Record<string, string> = await getSettings([
    'ai_context_pitch',
    'ai_context_case_studies',
    'ai_context_writing_style',
    'ai_context_banned_phrases',
    'ai_context_signature',
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
    writingStyle:
      ctx['ai_context_writing_style'] ||
      'Peer-to-peer, conversational, no jargon. Sound like a founder talking to another founder.',
    bannedPhrases:
      ctx['ai_context_banned_phrases'] ||
      'just wanted to reach out, hope this finds you well, circle back, synergy, low-hanging fruit',
    signature: ctx['ai_context_signature'] || `— ${founder}, ${companyName}`,
    companyName,
    founder,
  };
}

function pickAnchor(lead: LeadForDraft): string {
  const profile = lead.profile_data || {};
  if (lead.post_text && lead.post_text.length > 30) {
    return `their recent post (${lead.post_text.substring(0, 140).trim()}…)`;
  }
  const skill = Array.isArray(profile.skills) && profile.skills[0]?.name;
  if (skill) return `their work in ${skill}`;
  const exp = Array.isArray(profile.experience) && profile.experience[0];
  if (exp?.title && exp?.company) return `their role as ${exp.title} at ${exp.company}`;
  if (lead.company) return `the work at ${lead.company}`;
  if (lead.headline) return `their current focus (${lead.headline})`;
  return 'their LinkedIn presence';
}

function buildPrompt(lead: LeadForDraft, ctx: IndigenContext): string {
  const anchor = pickAnchor(lead);
  const profile = lead.profile_data || {};
  const profileBits: string[] = [];
  if (profile.summary || profile.bio) profileBits.push(`Bio: ${(profile.summary || profile.bio).substring(0, 240)}`);
  if (Array.isArray(profile.experience) && profile.experience.length) {
    const exp = profile.experience[0];
    if (exp.title) profileBits.push(`Current role: ${exp.title}${exp.company ? ` @ ${exp.company}` : ''}`);
  }
  if (Array.isArray(profile.education) && profile.education[0]?.school) {
    profileBits.push(`School: ${profile.education[0].school}`);
  }
  if (Array.isArray(profile.skills) && profile.skills.length) {
    profileBits.push(`Top skills: ${profile.skills.slice(0, 5).map((s: any) => s.name || s).join(', ')}`);
  }

  return `You are ${ctx.founder} from ${ctx.companyName}, writing personalised cold outreach to a LinkedIn lead.

CONTEXT — ${ctx.companyName}:
${ctx.pitch}

CASE STUDIES (use ONE if relevant):
${ctx.caseStudies}

WRITING STYLE:
${ctx.writingStyle}

BANNED PHRASES (do not use any of these):
${ctx.bannedPhrases}

SIGNATURE TO USE:
${ctx.signature}

THE LEAD:
Name: ${lead.name || 'Unknown'}
Headline: ${lead.headline || '(none)'}
Company: ${lead.company || '(none)'}
${profileBits.length ? `Profile snippets:\n- ${profileBits.join('\n- ')}` : ''}
${lead.post_text ? `\nTheir post:\n"""\n${lead.post_text.substring(0, 1200)}\n"""` : ''}

YOU MUST:
- Anchor on ${anchor}
- Sound like a peer — never pushy, no sales-bro openers
- Include ONE Indigen one-liner that matches what they need
- Include ONE case-study reference IF it matches their domain
- End with a low-friction question (yes/no or one-word answer)
- Avoid every banned phrase above
- Keep WhatsApp under 90 words, LinkedIn DM under 70 words, email body under 150 words

OUTPUT FORMAT — return ONE JSON object exactly:
{
  "whatsapp": "<message>",
  "email_subject": "<short, specific, lowercase ok>",
  "email_body": "<full email body with greeting + signature>",
  "linkedin_dm": "<DM text>"
}

NO other text. NO markdown fences. JUST the JSON object.`;
}

export async function generateDrafts(lead: LeadForDraft): Promise<DraftSet> {
  const apiKey = config.anthropic.apiKey;
  if (!apiKey) {
    logger.warn('draftService: CLAUDE_API_KEY not set, returning blank drafts');
    return { whatsapp: '', email_subject: '', email_body: '', linkedin_dm: '' };
  }

  const ctx = await loadIndigenContext();
  const prompt = buildPrompt(lead, ctx);

  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: MODEL,
        max_tokens: 1200,
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
      logger.warn({ leadId: lead.id, text: text.substring(0, 200) }, 'draftService: no JSON in Claude reply');
      return blank();
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      whatsapp: String(parsed.whatsapp || '').trim(),
      email_subject: String(parsed.email_subject || '').trim(),
      email_body: String(parsed.email_body || '').trim(),
      linkedin_dm: String(parsed.linkedin_dm || '').trim(),
    };
  } catch (err: any) {
    logger.error({ leadId: lead.id, err: err.message }, 'draftService: Claude call failed');
    return blank();
  }
}

function blank(): DraftSet {
  return { whatsapp: '', email_subject: '', email_body: '', linkedin_dm: '' };
}

export async function translateToEnglish(text: string): Promise<string> {
  const apiKey = config.anthropic.apiKey;
  if (!apiKey || !text) return text;
  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: MODEL,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Translate the following text to English. Keep it terse — no preamble, no explanation, just the translated text:\n\n${text}`,
          },
        ],
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 20000,
      }
    );
    return String(res.data?.content?.[0]?.text || text).trim();
  } catch (err: any) {
    logger.error({ err: err.message }, 'draftService: translate failed');
    return text;
  }
}
