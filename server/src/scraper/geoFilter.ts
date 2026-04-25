/**
 * Geo-filter — blocks leads from specific countries at scrape time.
 * Lifted from old VPS scraper (Pakistan block per 2026-04-19 directive).
 */

const PAKISTAN_TOKENS = [
  'pakistan',
  'karachi',
  'lahore',
  'islamabad',
  'rawalpindi',
  'peshawar',
  'faisalabad',
  'multan',
  'sialkot',
  'gujranwala',
  'quetta',
  'bahawalpur',
];

const PAKISTAN_PHONE = /(?:^|\D)\+?92[ -]?3\d{2}[ -]?\d{6,7}/;
const PKR_CURRENCY = /\bPKR\b/;
const PAKISTAN_RE = new RegExp(`\\b(${PAKISTAN_TOKENS.join('|')})\\b`, 'i');

export interface LeadLike {
  name?: string;
  location?: string | null;
  headline?: string | null;
  post_text?: string | null;
  company?: string | null;
  platform_data?: any;
}

export function isBlockedGeo(lead: LeadLike): boolean {
  const hardSignal = [
    lead.location,
    lead.company,
    lead.headline,
    lead.platform_data?.location,
    lead.platform_data?.country,
  ]
    .filter(Boolean)
    .join(' ');

  if (hardSignal && PAKISTAN_RE.test(hardSignal)) return true;

  const postSnippet = (lead.post_text || '').substring(0, 500);
  if (postSnippet && (PAKISTAN_PHONE.test(postSnippet) || PKR_CURRENCY.test(postSnippet))) {
    return true;
  }

  return false;
}

export function geoReason(lead: LeadLike): string | null {
  const hard = [
    lead.location,
    lead.company,
    lead.headline,
    lead.platform_data?.location,
    lead.platform_data?.country,
  ]
    .filter(Boolean)
    .join(' ');
  const m = hard && hard.match(PAKISTAN_RE);
  if (m) return `hard-signal: "${m[0]}"`;
  const snip = (lead.post_text || '').substring(0, 500);
  if (snip && PAKISTAN_PHONE.test(snip)) return 'post-text: +92 phone';
  if (snip && PKR_CURRENCY.test(snip)) return 'post-text: PKR currency';
  return null;
}

/** Convenience: keep lead only if NOT blocked geo. */
export function keepIfIN(lead: LeadLike): boolean {
  return !isBlockedGeo(lead);
}
