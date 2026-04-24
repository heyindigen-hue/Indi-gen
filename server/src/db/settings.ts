import { query } from './client';

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query('SELECT value FROM app_settings WHERE key=$1', [key]);
  return rows.length ? rows[0].value : null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  if (!keys.length) return {};
  const rows = await query(`SELECT key, value FROM app_settings WHERE key = ANY($1::text[])`, [keys]);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function getAllPublicSettings(): Promise<Record<string, string>> {
  const rows = await query(`SELECT key, value FROM app_settings WHERE is_secret = FALSE`);
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

export async function setSetting(key: string, value: string, updatedBy?: string): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value, updated_by, updated_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2, updated_by=$3, updated_at=NOW()`,
    [key, value, updatedBy || null]
  );
}

export async function incrSetting(key: string, delta: number): Promise<void> {
  await query(
    `INSERT INTO app_settings (key, value, updated_at) VALUES ($1,$2::text,NOW())
     ON CONFLICT (key) DO UPDATE
     SET value=(COALESCE(NULLIF(app_settings.value,'')::bigint,0)+$2)::text, updated_at=NOW()`,
    [key, delta]
  );
}
