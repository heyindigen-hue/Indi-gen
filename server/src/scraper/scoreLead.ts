/**
 * Heuristic ICP scoring (keyword-based). Lifted from old VPS code as
 * the cheap pre-filter before the LLM rubric runs.
 */

const ICP_KEYWORDS: Record<string, string[]> = {
  D2C: ['d2c', 'shopify', 'fashion', 'beauty', 'wellness', 'lifestyle brand'],
  SaaS: ['saas', 'software', 'mvp', 'product', 'platform', 'startup'],
  SME: ['manufacturing', 'sme', 'small business', 'automate', 'manual process'],
  Healthcare: ['healthcare', 'clinic', 'hospital', 'patient', 'medical'],
  Logistics: ['logistics', 'supply chain', 'dispatch', 'fleet'],
  Fintech: ['fintech', 'payment', 'finance', 'compliance'],
  International: ['us based', 'uk based', 'australia', 'canada', 'usd budget'],
  Ecommerce: ['ecommerce', 'online store', 'product listing', 'marketplace'],
};

const LARGE_COMPANIES = ['infosys', 'tcs', 'wipro', 'accenture', 'ibm', 'deloitte', 'cognizant', 'hcl'];
const DECISION_MAKER = ['founder', 'cto', 'ceo', 'director', 'head of', 'co-founder', 'owner', 'md'];
const PAIN_KEYWORDS = ['looking for developer', 'hiring', 'need a developer', 'build', 'shopify', 'automate', 'need help with'];

export function detectICP(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [icp, keywords] of Object.entries(ICP_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return icp;
  }
  return null;
}

export function scoreLead(name: string, headline: string, postText: string, company: string): number {
  let score = 0;
  const combined = `${headline} ${postText} ${company}`.toLowerCase();
  if (PAIN_KEYWORDS.some(k => combined.includes(k))) score += 3;
  if (detectICP(combined)) score += 2;
  if (DECISION_MAKER.some(t => headline?.toLowerCase().includes(t))) score += 2;
  if (postText?.length > 20) score += 1;
  if (LARGE_COMPANIES.some(c => combined.includes(c))) score -= 3;
  return Math.min(Math.max(score, 0), 10);
}
