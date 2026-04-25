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

export async function handleCallback(results: any[]): Promise<void> {
  // SignalHire actual callback shape:
  //   { status: 'success'|'failed'|'credits_are_over', item: '<url>', candidate?: { fullName, contacts: [...], experience: [...] } }
  // (NOT { requestId, contacts } as our old code assumed)
  for (const result of results) {
    try {
      const status: string = result.status || 'unknown';
      const item: string = result.item || '';
      const candidate: any = result.candidate || {};

      if (!item) {
        logger.warn({ status }, 'SignalHire callback missing item URL');
        continue;
      }

      // Match by exact URL — falls back to substring if SignalHire normalised the URL
      const lead = await queryOne<any>(
        `SELECT id FROM leads
         WHERE linkedin_url = $1
            OR linkedin_url ILIKE '%' || regexp_replace($1, '^https?://(www\\.)?linkedin\\.com', '', 'i') || '%'
         LIMIT 1`,
        [item]
      );
      if (!lead) {
        logger.warn({ item, status }, 'No lead matched SignalHire callback URL');
        continue;
      }

      const leadId = lead.id;

      if (status !== 'success' || !candidate || Object.keys(candidate).length === 0) {
        // not_found / credits_are_over / partial — mark and move on
        await query(
          `UPDATE leads SET enrichment_status=$2, updated_at=NOW() WHERE id=$1`,
          [leadId, status === 'success' ? 'enriched' : 'not_found']
        );
        continue;
      }

      const contacts: any[] = candidate.contacts || [];
      let inserted = 0;
      for (const c of contacts) {
        if (!c?.value) continue;
        try {
          await query(
            `INSERT INTO contacts (lead_id, type, value, sub_type, rating, verified_at)
             VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (lead_id, value) DO UPDATE SET
               verified_at = EXCLUDED.verified_at,
               rating = EXCLUDED.rating`,
            [
              leadId,
              c.type || 'unknown',
              c.value,
              c.subType || null,
              c.rating || (c.isVerified ? 'verified' : null),
              c.isVerified ? new Date() : null,
            ]
          );
          inserted++;
        } catch (e: any) {
          logger.warn({ err: e.message, leadId, contact: c.value }, 'contact insert failed');
        }
      }

      const updates: string[] = ['enrichment_status=\'enriched\'', 'enriched_at=NOW()', 'updated_at=NOW()'];
      const params: any[] = [];
      const jobTitle = candidate.currentJobTitle || candidate.headline || (candidate.experience?.[0]?.position);
      const companyName = candidate.currentCompany || candidate.experience?.[0]?.company;
      const fullName = candidate.fullName;

      if (jobTitle) {
        params.push(jobTitle);
        updates.push(`headline=COALESCE(NULLIF(headline,''), $${params.length})`);
      }
      if (companyName) {
        params.push(companyName);
        updates.push(`company=COALESCE(NULLIF(company,''), $${params.length})`);
      }
      if (fullName) {
        params.push(fullName);
        updates.push(`name=COALESCE(NULLIF(name,''), $${params.length})`);
      }
      params.push(leadId);
      await query(`UPDATE leads SET ${updates.join(',')} WHERE id=$${params.length}`, params);

      logger.info({ leadId, contactsFound: contacts.length, contactsInserted: inserted }, 'SignalHire enrichment completed');
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
