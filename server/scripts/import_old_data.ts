/**
 * import_old_data.ts
 *
 * Reads JSONL export files from /import/ and inserts them into the new schema.
 * Run on EC2 after deploying migrations 002 and 003.
 *
 * Usage:
 *   cd server
 *   npx tsx scripts/import_old_data.ts
 *
 * Environment: requires DATABASE_URL (or DB_* vars) to be set, same as server.
 *
 * Import order matters due to foreign keys:
 *   1. search_phrases (no FK beyond users — inserted without user FK)
 *   2. leads           (FK: phrase_id → search_phrases)
 *   3. contacts        (FK: lead_id   → leads)
 *   4. outreach_log    (FK: lead_id   → leads)
 *   5. proposals       (FK: lead_id   → leads)
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { Pool } from 'pg';

const DB_URL = process.env.DATABASE_URL || process.env.DB_URL || '';

if (!DB_URL) {
  console.error('ERROR: DATABASE_URL env var is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });

const IMPORT_DIR = path.resolve(__dirname, '../../import');

// ── Helpers ──────────────────────────────────────────────────────────────────

function readJsonl<T>(filename: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const filepath = path.join(IMPORT_DIR, filename);
    if (!fs.existsSync(filepath)) {
      console.warn(`  [WARN] File not found, skipping: ${filepath}`);
      return resolve([]);
    }
    const rows: T[] = [];
    const rl = readline.createInterface({ input: fs.createReadStream(filepath), crlfDelay: Infinity });
    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try { rows.push(JSON.parse(trimmed)); } catch { /* skip malformed */ }
    });
    rl.on('close', () => resolve(rows));
    rl.on('error', reject);
  });
}

function safe(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  return String(val);
}

function safeNum(val: unknown): number | null {
  const n = Number(val);
  return isNaN(n) ? null : n;
}

function safeJson(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  return typeof val === 'string' ? val : JSON.stringify(val);
}

function safeDate(val: unknown): string | null {
  if (!val) return null;
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

let imported = 0;
let skipped = 0;

async function upsertBatch(client: any, sql: string, rows: unknown[][]): Promise<void> {
  for (const row of rows) {
    try {
      await client.query(sql, row);
      imported++;
    } catch (e: any) {
      if (e.code === '23505') { skipped++; } // unique violation = already exists
      else { console.warn(`  [WARN] insert failed: ${e.message?.substring(0, 120)}`); skipped++; }
    }
  }
}

// ── 1. search_phrases ─────────────────────────────────────────────────────────

async function importPhrases(client: any): Promise<Map<number, number>> {
  console.log('\n[1/5] Importing search_phrases...');
  const rows = await readJsonl<any>('phrases.jsonl');
  console.log(`  Found ${rows.length} phrases`);

  const oldToNew = new Map<number, number>();

  for (const r of rows) {
    // Only import LinkedIn phrases (focus rule)
    if (r.platform && r.platform !== 'linkedin') { skipped++; continue; }
    try {
      const res = await client.query(
        `INSERT INTO search_phrases (phrase, enabled, last_used_at, total_runs, total_posts, total_new_leads, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (phrase) DO UPDATE SET
           enabled = EXCLUDED.enabled,
           total_runs = GREATEST(search_phrases.total_runs, EXCLUDED.total_runs),
           total_posts = GREATEST(search_phrases.total_posts, EXCLUDED.total_posts),
           total_new_leads = GREATEST(search_phrases.total_new_leads, EXCLUDED.total_new_leads)
         RETURNING id`,
        [
          safe(r.phrase),
          r.enabled !== false,
          safeDate(r.last_used_at),
          safeNum(r.total_runs) ?? 0,
          safeNum(r.total_posts) ?? 0,
          safeNum(r.total_new_leads) ?? 0,
          safeDate(r.created_at) ?? new Date().toISOString(),
        ]
      );
      if (res.rows.length) {
        oldToNew.set(Number(r.id), res.rows[0].id);
        imported++;
      }
    } catch (e: any) {
      console.warn(`  [WARN] phrase "${r.phrase}": ${e.message?.substring(0, 80)}`);
      skipped++;
    }
  }
  console.log(`  Done: ${oldToNew.size} phrases upserted`);
  return oldToNew;
}

// ── 2. leads ─────────────────────────────────────────────────────────────────

async function importLeads(client: any, phraseMap: Map<number, number>): Promise<Map<string, string>> {
  console.log('\n[2/5] Importing leads...');
  const rows = await readJsonl<any>('leads.jsonl');
  console.log(`  Found ${rows.length} leads`);

  const oldToNew = new Map<string, string>();
  let filtered = 0;

  for (const r of rows) {
    // Quality filter: score >= 4 OR intent_label = BUYER_PROJECT
    const score = safeNum(r.score) ?? 0;
    const intentLabel = safe(r.intent_label) ?? '';
    if (score < 4 && intentLabel !== 'BUYER_PROJECT') { filtered++; continue; }

    // Map old phrase_id to new serial
    const newPhraseId = r.phrase_id ? phraseMap.get(Number(r.phrase_id)) ?? null : null;

    try {
      const res = await client.query(
        `INSERT INTO leads (
           id, name, headline, linkedin_url, linkedin_urn, company,
           post_text, post_url, post_date, score, icp_type, status, notes,
           phrase_id, profile_data, drafts_cache, drafts_cached_at,
           enrichment_status, enriched_at, intent_label, intent_confidence,
           created_at, updated_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17,$18,$19,$20,$21,$22,$23
         )
         ON CONFLICT (linkedin_url) DO NOTHING
         RETURNING id`,
        [
          safe(r.id),
          safe(r.name),
          safe(r.headline),
          safe(r.linkedin_url),
          safe(r.linkedin_urn),
          safe(r.company),
          safe(r.post_text),
          safe(r.post_url),
          safeDate(r.post_date),
          score,
          safe(r.icp_type),
          safe(r.status) ?? 'New',
          safe(r.notes),
          newPhraseId,
          safeJson(r.profile_data),
          safeJson(r.drafts_cache),
          safeDate(r.drafts_cached_at),
          safe(r.enrichment_status) ?? 'pending',
          safeDate(r.enriched_at),
          safe(r.intent_label),
          safeNum(r.intent_confidence),
          safeDate(r.created_at) ?? new Date().toISOString(),
          safeDate(r.updated_at) ?? new Date().toISOString(),
        ]
      );
      if (res.rows.length) {
        oldToNew.set(r.id, res.rows[0].id);
        imported++;
      } else {
        // ON CONFLICT DO NOTHING — lead exists, record old→same id mapping
        const existing = await client.query(
          `SELECT id FROM leads WHERE linkedin_url = $1`, [safe(r.linkedin_url)]
        );
        if (existing.rows.length) oldToNew.set(r.id, existing.rows[0].id);
        skipped++;
      }
    } catch (e: any) {
      console.warn(`  [WARN] lead ${r.id}: ${e.message?.substring(0, 80)}`);
      skipped++;
    }
  }
  console.log(`  Done: ${oldToNew.size} leads imported, ${filtered} filtered (score<4), ${skipped} skipped`);
  return oldToNew;
}

// ── 3. contacts ───────────────────────────────────────────────────────────────

async function importContacts(client: any, leadMap: Map<string, string>): Promise<void> {
  console.log('\n[3/5] Importing contacts...');
  const rows = await readJsonl<any>('contacts.jsonl');
  console.log(`  Found ${rows.length} contacts`);

  const batch: unknown[][] = [];
  for (const r of rows) {
    const newLeadId = leadMap.get(r.lead_id);
    if (!newLeadId) { skipped++; continue; }
    if (!r.value) { skipped++; continue; }
    batch.push([
      newLeadId,
      safe(r.type) ?? 'email',
      safe(r.value),
      safe(r.sub_type),
      safe(r.rating),
      safeDate(r.verified_at),
      safeDate(r.created_at) ?? new Date().toISOString(),
    ]);
  }

  await upsertBatch(
    client,
    `INSERT INTO contacts (lead_id, type, value, sub_type, rating, verified_at, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (lead_id, value) DO NOTHING`,
    batch
  );
  console.log(`  Done`);
}

// ── 4. outreach_log ───────────────────────────────────────────────────────────

async function importOutreach(client: any, leadMap: Map<string, string>): Promise<void> {
  console.log('\n[4/5] Importing outreach_log...');
  const rows = await readJsonl<any>('outreach_log.jsonl');
  console.log(`  Found ${rows.length} outreach records`);

  const batch: unknown[][] = [];
  for (const r of rows) {
    const newLeadId = leadMap.get(r.lead_id);
    if (!newLeadId) { skipped++; continue; }
    batch.push([
      newLeadId,
      safe(r.channel) ?? 'linkedin',
      safe(r.subject),
      safe(r.message) ?? '',
      safe(r.status) ?? 'sent',
      safe(r.external_id),
      safeDate(r.opened_at),
      safeDate(r.replied_at),
      safeDate(r.sent_at) ?? new Date().toISOString(),
    ]);
  }

  await upsertBatch(
    client,
    `INSERT INTO outreach_log (lead_id, channel, subject, message, status, external_id, opened_at, replied_at, sent_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    batch
  );
  console.log(`  Done`);
}

// ── 5. proposals ─────────────────────────────────────────────────────────────

async function importProposals(client: any, leadMap: Map<string, string>): Promise<void> {
  console.log('\n[5/5] Importing proposals...');
  const rows = await readJsonl<any>('proposals.jsonl');
  console.log(`  Found ${rows.length} proposals`);

  // Ensure table exists (migration 003 should have run, but be safe)
  await client.query(`CREATE TABLE IF NOT EXISTS lead_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    title TEXT,
    scope JSONB,
    pricing JSONB,
    content_md TEXT,
    ai_content JSONB,
    overrides JSONB,
    pdf_url TEXT,
    filename TEXT,
    bytes INT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);

  const batch: unknown[][] = [];
  for (const r of rows) {
    const newLeadId = leadMap.get(r.lead_id);
    if (!newLeadId) { skipped++; continue; }
    batch.push([
      safe(r.id),
      newLeadId,
      safe(r.status) ?? 'draft',
      safe(r.pdf_url),
      safe(r.filename),
      safeNum(r.bytes),
      safeJson(r.ai_content),
      safeJson(r.overrides),
      safeDate(r.created_at) ?? new Date().toISOString(),
    ]);
  }

  await upsertBatch(
    client,
    `INSERT INTO lead_proposals (id, lead_id, status, pdf_url, filename, bytes, ai_content, overrides, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9)
     ON CONFLICT (id) DO NOTHING`,
    batch
  );
  console.log(`  Done`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('=== Indi-gen Data Import ===');
  console.log(`Import directory: ${IMPORT_DIR}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const phraseMap = await importPhrases(client);
    const leadMap = await importLeads(client, phraseMap);
    await importContacts(client, leadMap);
    await importOutreach(client, leadMap);
    await importProposals(client, leadMap);

    await client.query('COMMIT');
    console.log(`\n=== Import complete ===`);
    console.log(`  Imported : ${imported}`);
    console.log(`  Skipped  : ${skipped}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Import failed, rolled back:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
