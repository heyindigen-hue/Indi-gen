import axios from 'axios';
import { query, queryOne } from '../db/client';
import { config } from '../config';
import { logger } from '../logger';

const BASE_URL = 'https://www.signalhire.com/api/v1';

interface SignalHireContact {
  type: 'email' | 'phone' | 'linkedin' | 'twitter' | 'github';
  value: string;
  isVerified?: boolean;
}

interface SignalHireResult {
  requestId?: string;
  candidateId?: string;
  fullName?: string;
  currentJobTitle?: string;
  currentCompany?: string;
  location?: string;
  contacts?: SignalHireContact[];
  status?: 'found' | 'not_found' | 'processing';
}

export async function enrichLead(leadId: string, linkedinUrl?: string): Promise<void> {
  const apiKey = config.signalhire.apiKey;
  if (!apiKey) {
    logger.warn('SignalHire API key not configured');
    return;
  }

  if (!linkedinUrl) {
    logger.warn({ leadId }, 'No linkedin URL to enrich');
    return;
  }

  // SignalHire /candidate/search expects:
  //   items: string[]   (LinkedIn profile URLs, must be absolute)
  //   callbackUrl: string  (absolute https URL — relative paths return 422)
  const publicBase = process.env.PUBLIC_URL || 'https://leadgen.indigenservices.com';
  const searchData = {
    items: [linkedinUrl],
    callbackUrl: `${publicBase.replace(/\/$/, '')}/webhook/signalhire`,
  };

  try {
    const resp = await axios.post(`${BASE_URL}/candidate/search`, searchData, {
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const requestId = resp.data?.requestId;
    // Store request ID in profile_data for callback matching
    await query(
      `UPDATE leads
       SET enrichment_status='processing',
           profile_data = COALESCE(profile_data,'{}') || $2::jsonb,
           updated_at=NOW()
       WHERE id=$1`,
      [leadId, JSON.stringify({ signalhire_request_id: requestId || null })]
    );
  } catch (err: any) {
    logger.error({ err: err.message, leadId }, 'SignalHire enrichment request failed');
    await query(
      `UPDATE leads SET enrichment_status='failed', updated_at=NOW() WHERE id=$1`,
      [leadId]
    );
  }
}

export async function handleCallback(results: SignalHireResult[]): Promise<void> {
  for (const result of results) {
    try {
      const requestId = result.requestId || result.candidateId;
      if (!requestId) continue;

      // Find lead by stored signalhire_request_id in profile_data
      const lead = await queryOne<any>(
        `SELECT id FROM leads WHERE profile_data->>'signalhire_request_id'=$1`,
        [requestId]
      );
      if (!lead) {
        logger.warn({ requestId }, 'No lead found for SignalHire callback');
        continue;
      }

      const leadId = lead.id;
      const contacts = result.contacts || [];

      // contacts table: lead_id, type, value, verified_at — UNIQUE(lead_id, value)
      for (const contact of contacts) {
        await query(
          `INSERT INTO contacts (lead_id, type, value, verified_at)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (lead_id, value) DO UPDATE SET verified_at=$4`,
          [leadId, contact.type, contact.value, contact.isVerified ? new Date() : null]
        );
      }

      const updates: string[] = ['enrichment_status=\'completed\'', 'enriched_at=NOW()', 'updated_at=NOW()'];
      const params: any[] = [];

      if (result.currentJobTitle) {
        params.push(result.currentJobTitle);
        updates.push(`headline=COALESCE(NULLIF(headline,''), $${params.length})`);
      }
      if (result.currentCompany) {
        params.push(result.currentCompany);
        updates.push(`company=COALESCE(NULLIF(company,''), $${params.length})`);
      }
      if (result.fullName) {
        params.push(result.fullName);
        updates.push(`name=COALESCE(NULLIF(name,''), $${params.length})`);
      }

      params.push(leadId);
      await query(`UPDATE leads SET ${updates.join(',')} WHERE id=$${params.length}`, params);

      logger.info({ leadId, contactsFound: contacts.length }, 'SignalHire enrichment completed');
    } catch (err: any) {
      logger.error({ err: err.message, result }, 'SignalHire callback processing failed');
    }
  }
}

export async function batchEnrich(leadIds: string[]): Promise<void> {
  for (const leadId of leadIds) {
    const lead = await queryOne<any>(`SELECT id, linkedin_url FROM leads WHERE id=$1`, [leadId]);
    if (lead) await enrichLead(lead.id, lead.linkedin_url || undefined);
    await new Promise(r => setTimeout(r, 200));
  }
}
