import axios from 'axios';
import { config } from '../config';
import { logger } from '../logger';

export interface RawLead {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  location?: string;
  summary?: string;
  [key: string]: any;
}

export interface FilteredLead extends RawLead {
  icp_score: number;
  is_icp: boolean;
  rejection_reason?: string;
}

interface FilterContext {
  icpCriteria: string;
  rejectionPatterns?: string[];
}

const BATCH_SIZE = 8;

async function filterBatch(leads: RawLead[], context: FilterContext): Promise<FilteredLead[]> {
  const prompt = `You are a B2B lead quality filter. Given the ICP (Ideal Customer Profile) criteria and a list of leads, score each lead from 0-100 and determine if they match the ICP.

ICP Criteria: ${context.icpCriteria}
${context.rejectionPatterns?.length ? `Rejection patterns (auto-reject if matched): ${context.rejectionPatterns.join(', ')}` : ''}

Leads to evaluate (JSON array):
${JSON.stringify(leads, null, 2)}

Respond ONLY with a valid JSON array of the same length as the input, where each object has:
- icp_score: number 0-100
- is_icp: boolean (true if score >= 60)
- rejection_reason: string (only if is_icp=false, brief reason)

Keep all original fields intact. Response must be valid JSON only.`;

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': config.anthropic.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 30000,
    }
  );

  const text: string = response.data.content[0].text.trim();
  const jsonStart = text.indexOf('[');
  const jsonEnd = text.lastIndexOf(']');
  if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON array in Claude response');

  const parsed: FilteredLead[] = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  return leads.map((lead, i) => ({
    ...lead,
    icp_score: parsed[i]?.icp_score ?? 50,
    is_icp: parsed[i]?.is_icp ?? false,
    rejection_reason: parsed[i]?.rejection_reason,
  }));
}

export async function filterLeads(leads: RawLead[], context: FilterContext): Promise<FilteredLead[]> {
  if (!config.anthropic.apiKey) {
    logger.warn('Anthropic API key not configured — skipping Claude filter, marking all as ICP');
    return leads.map(l => ({ ...l, icp_score: 50, is_icp: true }));
  }

  const results: FilteredLead[] = [];

  for (let i = 0; i < leads.length; i += BATCH_SIZE) {
    const batch = leads.slice(i, i + BATCH_SIZE);
    try {
      const filtered = await filterBatch(batch, context);
      results.push(...filtered);
      logger.debug({ batchStart: i, batchSize: batch.length }, 'Claude filter batch complete');
    } catch (err: any) {
      logger.error({ err: err.message, batchStart: i }, 'Claude filter batch failed — passing through unscored');
      results.push(...batch.map(l => ({ ...l, icp_score: 50, is_icp: true })));
    }
    if (i + BATCH_SIZE < leads.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return results;
}

export async function learnRejection(lead: RawLead, reason: string): Promise<void> {
  logger.info({ lead: lead.linkedin_url || lead.email, reason }, 'Rejection learning recorded');
}
