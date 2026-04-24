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

export async function enrichLead(leadId: string, linkedinUrl?: string, email?: string): Promise<void> {
  const apiKey = config.signalhire.apiKey;
  if (!apiKey) {
    logger.warn('SignalHire API key not configured');
    return;
  }

  const searchData: any = { webhookUrl: `${process.env.PUBLIC_URL || ''}/webhook/signalhire` };
  if (linkedinUrl) searchData.url = linkedinUrl;
  else if (email) searchData.email = email;
  else {
    logger.warn({ leadId }, 'No linkedin URL or email to enrich');
    return;
  }

  try {
    const resp = await axios.post(`${BASE_URL}/candidate/search`, searchData, {
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    const requestId = resp.data?.requestId;
    await query(
      `UPDATE enrichment_requests SET provider_job_id=$1, status='processing'
       WHERE lead_id=$2 AND provider='signalhire' AND status='queued'`,
      [requestId || null, leadId]
    );
  } catch (err: any) {
    logger.error({ err: err.message, leadId }, 'SignalHire enrichment request failed');
    await query(
      `UPDATE enrichment_requests SET status='failed', error=$1
       WHERE lead_id=$2 AND provider='signalhire' AND status='queued'`,
      [err.message, leadId]
    );
  }
}

export async function handleCallback(results: SignalHireResult[]): Promise<void> {
  for (const result of results) {
    try {
      const requestId = result.requestId || result.candidateId;
      if (!requestId) continue;

      const enrichReq = await queryOne<any>(
        `SELECT lead_id FROM enrichment_requests WHERE provider_job_id=$1 AND provider='signalhire'`,
        [requestId]
      );
      if (!enrichReq) {
        logger.warn({ requestId }, 'No enrichment request found for SignalHire callback');
        continue;
      }

      const leadId = enrichReq.lead_id;
      const contacts = result.contacts || [];

      for (const contact of contacts) {
        await query(
          `INSERT INTO lead_contacts (lead_id, type, value, is_verified, source)
           VALUES ($1,$2,$3,$4,'signalhire')
           ON CONFLICT (lead_id, type, value) DO UPDATE SET is_verified=$4, updated_at=NOW()`,
          [leadId, contact.type, contact.value, contact.isVerified || false]
        );
      }

      const updates: string[] = ['enriched_at=NOW()', 'updated_at=NOW()'];
      const params: any[] = [];

      const emails = contacts.filter(c => c.type === 'email').map(c => c.value);
      const phones = contacts.filter(c => c.type === 'phone').map(c => c.value);

      if (emails.length) {
        params.push(emails[0]);
        updates.push(`email=COALESCE(NULLIF(email,''), $${params.length})`);
      }
      if (phones.length) {
        params.push(phones[0]);
        updates.push(`phone=COALESCE(NULLIF(phone,''), $${params.length})`);
      }
      if (result.currentJobTitle) {
        params.push(result.currentJobTitle);
        updates.push(`title=COALESCE(NULLIF(title,''), $${params.length})`);
      }
      if (result.currentCompany) {
        params.push(result.currentCompany);
        updates.push(`company=COALESCE(NULLIF(company,''), $${params.length})`);
      }
      if (result.fullName) {
        params.push(result.fullName);
        updates.push(`full_name=COALESCE(NULLIF(full_name,''), $${params.length})`);
      }

      params.push(leadId);
      await query(`UPDATE leads SET ${updates.join(',')} WHERE id=$${params.length}`, params);

      await query(
        `UPDATE enrichment_requests SET status='completed', completed_at=NOW()
         WHERE lead_id=$1 AND provider='signalhire'`,
        [leadId]
      );
      logger.info({ leadId, contactsFound: contacts.length }, 'SignalHire enrichment completed');
    } catch (err: any) {
      logger.error({ err: err.message, result }, 'SignalHire callback processing failed');
    }
  }
}

export async function batchEnrich(leadIds: string[]): Promise<void> {
  for (const leadId of leadIds) {
    const lead = await queryOne<any>(`SELECT id, linkedin_url, email FROM leads WHERE id=$1`, [leadId]);
    if (lead) await enrichLead(lead.id, lead.linkedin_url || undefined, lead.email || undefined);
    await new Promise(r => setTimeout(r, 200));
  }
}
