// Lead scoring — weights derived from ICP signal strength analysis

export const SCORE_WEIGHTS = {
  titleMatch: 25,
  companySize: 20,
  industryMatch: 20,
  locationMatch: 10,
  recentActivity: 10,
  emailVerified: 8,
  phonePresent: 7,
} as const;

export const ICP_INDUSTRIES = [
  'technology', 'software', 'saas', 'fintech', 'healthtech',
  'edtech', 'ecommerce', 'retail', 'manufacturing', 'logistics',
  'consulting', 'professional services', 'media', 'telecom',
];

export const ICP_TITLES = [
  'ceo', 'cto', 'coo', 'cfo', 'founder', 'co-founder',
  'president', 'vp', 'vice president', 'director', 'head of',
  'manager', 'owner', 'partner', 'principal',
];

export const ICP_COMPANY_SIZE_RANGES: Record<string, { min: number; max: number; score: number }> = {
  startup:     { min: 1,   max: 50,   score: 15 },
  smb:         { min: 51,  max: 500,  score: 20 },
  midmarket:   { min: 501, max: 5000, score: 18 },
  enterprise:  { min: 5001, max: Infinity, score: 10 },
};

export interface LeadInput {
  title?: string;
  company?: string;
  industry?: string;
  employeeCount?: number;
  location?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  lastActivityAt?: Date;
  targetIndustries?: string[];
  targetLocations?: string[];
}

export interface ScoreResult {
  total: number;
  breakdown: Record<string, number>;
  icpMatch: boolean;
  icpTier: 'A' | 'B' | 'C' | 'D';
  signals: string[];
}

export function detectICP(lead: LeadInput): boolean {
  const titleLower = (lead.title || '').toLowerCase();
  const industryLower = (lead.industry || '').toLowerCase();

  const hasIcpTitle = ICP_TITLES.some(t => titleLower.includes(t));
  const hasIcpIndustry = ICP_INDUSTRIES.some(i => industryLower.includes(i));

  return hasIcpTitle && hasIcpIndustry;
}

export function scoreLead(lead: LeadInput): ScoreResult {
  const breakdown: Record<string, number> = {};
  const signals: string[] = [];

  // Title match
  const titleLower = (lead.title || '').toLowerCase();
  const titleScore = ICP_TITLES.some(t => titleLower.includes(t)) ? SCORE_WEIGHTS.titleMatch : 0;
  breakdown.titleMatch = titleScore;
  if (titleScore) signals.push(`title: ${lead.title}`);

  // Industry match
  const industryLower = (lead.industry || '').toLowerCase();
  const targetIndustries = lead.targetIndustries?.map(i => i.toLowerCase()) ?? ICP_INDUSTRIES;
  const industryScore = targetIndustries.some(i => industryLower.includes(i)) ? SCORE_WEIGHTS.industryMatch : 0;
  breakdown.industryMatch = industryScore;
  if (industryScore) signals.push(`industry: ${lead.industry}`);

  // Company size
  let sizeScore = 0;
  if (lead.employeeCount != null) {
    for (const range of Object.values(ICP_COMPANY_SIZE_RANGES)) {
      if (lead.employeeCount >= range.min && lead.employeeCount <= range.max) {
        sizeScore = range.score;
        break;
      }
    }
  }
  breakdown.companySize = sizeScore;
  if (sizeScore) signals.push(`size: ${lead.employeeCount} employees`);

  // Location match
  const locationLower = (lead.location || '').toLowerCase();
  const targetLocations = lead.targetLocations?.map(l => l.toLowerCase()) ?? [];
  const locationScore = targetLocations.length > 0 && targetLocations.some(l => locationLower.includes(l))
    ? SCORE_WEIGHTS.locationMatch
    : 0;
  breakdown.locationMatch = locationScore;
  if (locationScore) signals.push(`location: ${lead.location}`);

  // Recent activity (LinkedIn or job change in last 90 days)
  const activityScore = lead.lastActivityAt
    && (Date.now() - lead.lastActivityAt.getTime()) < 90 * 24 * 60 * 60 * 1000
    ? SCORE_WEIGHTS.recentActivity : 0;
  breakdown.recentActivity = activityScore;
  if (activityScore) signals.push('recently active');

  // Email verified
  const emailScore = lead.email && lead.email.includes('@') ? SCORE_WEIGHTS.emailVerified : 0;
  breakdown.emailVerified = emailScore;
  if (emailScore) signals.push('email present');

  // Phone present
  const phoneScore = lead.phone ? SCORE_WEIGHTS.phonePresent : 0;
  breakdown.phonePresent = phoneScore;
  if (phoneScore) signals.push('phone present');

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const icpMatch = detectICP(lead);

  let icpTier: 'A' | 'B' | 'C' | 'D';
  if (total >= 75) icpTier = 'A';
  else if (total >= 55) icpTier = 'B';
  else if (total >= 35) icpTier = 'C';
  else icpTier = 'D';

  return { total, breakdown, icpMatch, icpTier, signals };
}
