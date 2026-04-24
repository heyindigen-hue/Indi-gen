import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface AdminStats {
  mrr: number;
  mrr_sparkline: number[];
  mrr_wow: number;
  dau: number;
  dau_wow: number;
  leads_today: number;
  signups_today: number;
  signups_wow: number;
  token_burn_today: number;
  llm_cost_today_inr: number;
  scrape_success_rate: number;
  scrape_success_change: number;
  open_tickets: number;
}

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ['admin-stats'],
    queryFn: () => api.get<AdminStats>('/admin/stats'),
    staleTime: 30_000,
  });
}
