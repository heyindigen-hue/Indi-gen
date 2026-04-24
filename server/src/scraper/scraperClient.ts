import axios, { AxiosResponse } from 'axios';
import { config } from '../config';

export interface ScrapeSearchRequest {
  query: string;
  filters?: {
    location?: string;
    industry?: string;
    title?: string;
    company_size?: string;
  };
  limit?: number;
  webhook_url?: string;
}

export interface ScrapeJob {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  requested_count: number;
  actual_count?: number;
  results?: ScrapeResult[];
  created_at?: string;
  completed_at?: string;
  error?: string;
}

export interface ScrapeResult {
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  linkedin_url?: string;
  location?: string;
  summary?: string;
}

export async function submitScrapeJob(req: ScrapeSearchRequest): Promise<ScrapeJob> {
  const resp: AxiosResponse<ScrapeJob> = await axios.post(
    `${config.scraperServiceUrl}/scrape/search`,
    req,
    { timeout: 10000 }
  );
  return resp.data;
}

export async function getScrapeJobStatus(jobId: string): Promise<ScrapeJob> {
  const resp: AxiosResponse<ScrapeJob> = await axios.get(
    `${config.scraperServiceUrl}/scrape/jobs/${jobId}`,
    { timeout: 5000 }
  );
  return resp.data;
}
