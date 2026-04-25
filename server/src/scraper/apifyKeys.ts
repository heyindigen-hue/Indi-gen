import { getSetting, setSetting } from '../db/settings';
import { logger } from '../logger';

/**
 * Apify multi-key management with ROTATION + SPEND TRACKING + MONTHLY CAPS.
 * Lifted from old VPS scraper (2026-04-19/20 work) and adapted to new server.
 *
 * Storage: app_settings.apify_tokens (JSON array).
 *
 * Rotation strategy (pickActiveKey):
 *   1. Filter to active keys with spend < monthly_cap_usd this period
 *   2. Pick key with LOWEST current-period spend (load balance)
 *   3. Tiebreaker: least-recently-used
 *
 * Per-key tracking:
 *   - total_runs, total_posts (lifetime)
 *   - period_spend_usd (resets on month rollover via ensurePeriodFresh)
 *   - period_start (first day of current month, UTC)
 *   - last_used_at (updated on every pick)
 *   - failures (consecutive zero-post runs; tracking only — does NOT auto-deactivate)
 *
 * Monthly cap:
 *   - Each key has monthly_cap_usd (default $150 = full monthly credit)
 *   - When key crosses cap → excluded from rotation until period resets
 *   - Live-checks Apify usage; auto-exhausts keys within $15 of cap
 */

export interface ApifyKey {
  id: string;
  key: string;
  label: string;
  active: boolean;
  failures: number;
  last_zero_at: string | null;
  last_success_at: string | null;
  last_used_at: string | null;
  total_runs: number;
  total_posts: number;
  period_start: string | null;
  period_spend_usd: number;
  lifetime_spend_usd: number;
  monthly_cap_usd: number;
  exhausted_at: string | null;
}

const SETTINGS_KEY = 'apify_tokens';
const DEFAULT_MONTHLY_CAP_USD = 150;

export async function loadKeys(): Promise<ApifyKey[]> {
  const raw = await getSetting(SETTINGS_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map(normalize) : [];
  } catch {
    return [];
  }
}

function normalize(k: any): ApifyKey {
  return {
    id: k.id,
    key: k.key,
    label: k.label,
    active: k.active !== false,
    failures: k.failures || 0,
    last_zero_at: k.last_zero_at || null,
    last_success_at: k.last_success_at || null,
    last_used_at: k.last_used_at || null,
    total_runs: k.total_runs || 0,
    total_posts: k.total_posts || 0,
    period_start: k.period_start || null,
    period_spend_usd: Number(k.period_spend_usd) || 0,
    lifetime_spend_usd: Number(k.lifetime_spend_usd) || 0,
    monthly_cap_usd: Number(k.monthly_cap_usd) || DEFAULT_MONTHLY_CAP_USD,
    exhausted_at: k.exhausted_at || null,
  };
}

async function saveKeys(keys: ApifyKey[]): Promise<void> {
  await setSetting(SETTINGS_KEY, JSON.stringify(keys));
}

export async function ensureMigrated(): Promise<void> {
  const current = await loadKeys();
  if (current.length) return;
  const legacy = await getSetting('apify_token');
  if (legacy && legacy.trim()) {
    await saveKeys([
      normalize({ id: 'legacy', key: legacy, label: 'Legacy token', active: true }),
    ]);
  }
}

function currentPeriodStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

function ensurePeriodFresh(k: ApifyKey): boolean {
  const nowPeriod = currentPeriodStart();
  if (k.period_start !== nowPeriod) {
    k.period_start = nowPeriod;
    k.period_spend_usd = 0;
    if (k.exhausted_at) {
      logger.info({ key: k.label, exhaustedAt: k.exhausted_at }, 'ApifyKeys: month rollover, reactivating exhausted key');
      k.exhausted_at = null;
      if (!k.active && k.failures < 999) k.active = true;
    }
    return true;
  }
  return false;
}

const _apifyUsageCache = new Map<string, { checkedAt: number; usedUsd: number }>();
const APIFY_USAGE_CACHE_MS = 5 * 60 * 1000;
const APIFY_EXHAUSTION_BUFFER_USD = 15;

async function fetchApifyMonthlyUsage(token: string): Promise<number> {
  const cached = _apifyUsageCache.get(token);
  if (cached && Date.now() - cached.checkedAt < APIFY_USAGE_CACHE_MS) {
    return cached.usedUsd;
  }
  try {
    const res = await fetch(
      `https://api.apify.com/v2/users/me/usage/monthly?token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return -1;
    const data = (await res.json()) as any;
    const used = Number(data?.data?.totalUsageCreditsUsdAfterVolumeDiscount) || 0;
    _apifyUsageCache.set(token, { checkedAt: Date.now(), usedUsd: used });
    return used;
  } catch {
    return -1;
  }
}

export async function pickActiveKey(): Promise<ApifyKey | null> {
  await ensureMigrated();
  const keys = await loadKeys();
  if (!keys.length) return null;

  const now = Date.now();
  let dirty = false;

  for (const k of keys) {
    if (ensurePeriodFresh(k)) dirty = true;
    if (!k.active && k.last_zero_at) {
      const dormantMs = now - new Date(k.last_zero_at).getTime();
      if (dormantMs > 24 * 60 * 60 * 1000) {
        k.active = true;
        k.failures = 0;
        dirty = true;
      }
    }
  }

  const eligible = keys.filter(k => k.active && k.period_spend_usd < k.monthly_cap_usd);
  if (!eligible.length) {
    if (dirty) await saveKeys(keys);
    return null;
  }

  eligible.sort((a, b) => {
    if (a.period_spend_usd !== b.period_spend_usd) return a.period_spend_usd - b.period_spend_usd;
    const ta = a.last_used_at ? new Date(a.last_used_at).getTime() : 0;
    const tb = b.last_used_at ? new Date(b.last_used_at).getTime() : 0;
    return ta - tb;
  });

  let picked: ApifyKey | null = null;
  for (const candidate of eligible) {
    const liveUsage = await fetchApifyMonthlyUsage(candidate.key);
    if (liveUsage >= 0 && liveUsage >= candidate.monthly_cap_usd - APIFY_EXHAUSTION_BUFFER_USD) {
      candidate.exhausted_at = new Date().toISOString();
      candidate.period_spend_usd = candidate.monthly_cap_usd;
      dirty = true;
      logger.warn(
        { label: candidate.label, used: liveUsage, cap: candidate.monthly_cap_usd },
        'ApifyKeys: live-check auto-exhausting near-capped key'
      );
      continue;
    }
    picked = candidate;
    break;
  }
  if (!picked) {
    if (dirty) await saveKeys(keys);
    return null;
  }
  picked.last_used_at = new Date().toISOString();
  await saveKeys(keys);
  return picked;
}

export async function recordRun(keyId: string, postsFound: number, estCostUsd = 0): Promise<void> {
  const keys = await loadKeys();
  const k = keys.find(x => x.id === keyId);
  if (!k) return;
  ensurePeriodFresh(k);
  k.total_runs++;
  k.total_posts += postsFound;
  k.period_spend_usd = Number((k.period_spend_usd + estCostUsd).toFixed(4));
  k.lifetime_spend_usd = Number((k.lifetime_spend_usd + estCostUsd).toFixed(4));
  if (k.period_spend_usd >= k.monthly_cap_usd && !k.exhausted_at) {
    k.exhausted_at = new Date().toISOString();
    logger.warn(
      { label: k.label, spend: k.period_spend_usd, cap: k.monthly_cap_usd },
      'ApifyKeys: key exhausted, resumes next month'
    );
  }
  if (postsFound === 0) {
    k.last_zero_at = new Date().toISOString();
  } else {
    k.failures = 0;
    k.last_success_at = new Date().toISOString();
  }
  await saveKeys(keys);
}

export async function recordKeyError(keyId: string, errorType: string, errorMessage?: string): Promise<void> {
  const hardFailures = [
    'platform-feature-disabled',
    'usage-hard-limit-exceeded',
    'token-not-authorized',
    'subscription-required',
  ];
  const monthlyLimitFailures = ['platform-feature-disabled', 'usage-hard-limit-exceeded'];
  if (!hardFailures.includes(errorType)) return;

  const keys = await loadKeys();
  const k = keys.find(x => x.id === keyId);
  if (!k) return;

  if (monthlyLimitFailures.includes(errorType)) {
    k.exhausted_at = new Date().toISOString();
    k.period_spend_usd = k.monthly_cap_usd;
    logger.warn({ label: k.label, errorType }, 'ApifyKeys: hit monthly limit, marked exhausted');
    await saveKeys(keys);
    return;
  }
  k.active = false;
  k.failures = 999;
  k.last_zero_at = new Date().toISOString();
  logger.warn(
    { label: k.label, id: k.id, errorType, errorMessage },
    'ApifyKeys: hard-deactivating key'
  );
  await saveKeys(keys);
}

export async function addKey(key: string, label: string, monthlyCapUsd = DEFAULT_MONTHLY_CAP_USD): Promise<ApifyKey> {
  const keys = await loadKeys();
  const newKey = normalize({
    id: Math.random().toString(36).slice(2, 10),
    key,
    label: label || `Key ${keys.length + 1}`,
    active: true,
    period_start: currentPeriodStart(),
    monthly_cap_usd: monthlyCapUsd,
  });
  keys.push(newKey);
  await saveKeys(keys);
  return newKey;
}

export async function updateKey(id: string, patch: Partial<ApifyKey>): Promise<ApifyKey | null> {
  const keys = await loadKeys();
  const k = keys.find(x => x.id === id);
  if (!k) return null;
  Object.assign(k, patch);
  await saveKeys(keys);
  return k;
}

export async function deleteKey(id: string): Promise<boolean> {
  const keys = await loadKeys();
  const next = keys.filter(k => k.id !== id);
  if (next.length === keys.length) return false;
  await saveKeys(next);
  return true;
}

export function maskKey(key: string): string {
  if (!key) return '';
  if (key.length < 20) return '***';
  return key.substring(0, 10) + '…' + key.slice(-6);
}

export async function keyStats(): Promise<{
  total_keys: number;
  active_keys: number;
  total_monthly_cap: number;
  total_period_spend: number;
  total_remaining: number;
  keys: Array<{
    id: string;
    label: string;
    active: boolean;
    masked_key: string;
    period_spend: number;
    cap: number;
    remaining: number;
    failures: number;
    exhausted_at: string | null;
    last_used_at: string | null;
    total_runs: number;
    total_posts: number;
  }>;
}> {
  const keys = await loadKeys();
  for (const k of keys) ensurePeriodFresh(k);

  const total_monthly_cap = keys.reduce((s, k) => s + k.monthly_cap_usd, 0);
  const total_period_spend = keys.reduce((s, k) => s + k.period_spend_usd, 0);

  return {
    total_keys: keys.length,
    active_keys: keys.filter(k => k.active).length,
    total_monthly_cap,
    total_period_spend: Number(total_period_spend.toFixed(4)),
    total_remaining: Number((total_monthly_cap - total_period_spend).toFixed(4)),
    keys: keys.map(k => ({
      id: k.id,
      label: k.label,
      active: k.active && k.period_spend_usd < k.monthly_cap_usd,
      masked_key: maskKey(k.key),
      period_spend: k.period_spend_usd,
      cap: k.monthly_cap_usd,
      remaining: Number((k.monthly_cap_usd - k.period_spend_usd).toFixed(4)),
      failures: k.failures,
      exhausted_at: k.exhausted_at,
      last_used_at: k.last_used_at,
      total_runs: k.total_runs,
      total_posts: k.total_posts,
    })),
  };
}
