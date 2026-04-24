export interface Lead {
  id: string;
  linkedinId: string;
  name: string;
  headline: string | null;
  location: string | null;
  profileUrl: string;
  score: number | null;
  savedAt: string;
  enrichedAt: string | null;
}
