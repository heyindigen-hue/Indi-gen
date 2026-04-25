import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { api } from './api';

export type Lead = {
  id: string;
  name?: string;
  headline?: string;
  company?: string;
  linkedin_url?: string;
  post_text?: string;
  post_url?: string;
  score?: number;
  icp_type?: string;
  status?: string;
  notes?: string;
  intent_label?: string;
  intent_confidence?: number;
  drafts_cache?: { email?: string; linkedin?: string; whatsapp?: string } | null;
  enrichment_status?: string;
  profile_data?: { profile_photo_url?: string; [k: string]: any };
  created_at?: string;
  updated_at?: string;
  contacts?: LeadContact[];
};

export type LeadContact = {
  id: number;
  lead_id: string;
  type: 'email' | 'phone' | 'linkedin' | string;
  value: string;
  sub_type?: string | null;
  rating?: 'verified' | 'high' | 'medium' | 'low' | null;
  verified_at?: string | null;
};

type ListResponse = {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
};

type Filters = {
  status?: string;
  platform?: 'linkedin';
  sort?: 'score' | 'recent';
  limit?: number;
  offset?: number;
  icp_type?: string;
};

const LEADS_KEY = (filters: Filters) => ['leads', filters] as const;

export function useLeadFeed(filters: Filters) {
  const params = {
    status: filters.status,
    platform: filters.platform,
    sort: filters.sort,
    icp_type: filters.icp_type,
    limit: filters.limit ?? 20,
    offset: filters.offset ?? 0,
  };
  return useQuery<ListResponse>({
    queryKey: LEADS_KEY(filters),
    queryFn: async () => {
      const res = await api.get<ListResponse | Lead[]>('/leads', { params });
      // Older deployments returned the bare array; normalise.
      const data = res.data as any;
      if (Array.isArray(data)) {
        return { leads: data, total: data.length, limit: params.limit, offset: params.offset };
      }
      return data as ListResponse;
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useLead(id: string | undefined) {
  return useQuery<Lead>({
    queryKey: ['lead', id],
    queryFn: async () => {
      const res = await api.get<Lead>(`/leads/${id}`);
      return res.data;
    },
    enabled: !!id,
    staleTime: 60_000,
  });
}

/**
 * Optimistic status mutation. Updates the cached lead and any list
 * cache that contains this lead — UI reflects the change immediately,
 * before the server round-trip resolves.
 */
export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/leads/${id}/status`, { status });
      return { id, status };
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['lead', id] });

      const prevLead = qc.getQueryData<Lead>(['lead', id]);
      if (prevLead) {
        qc.setQueryData<Lead>(['lead', id], { ...prevLead, status });
      }

      // Rewrite every cached leads-feed list, dropping the lead so the next card
      // animates in immediately. We snapshot for rollback on failure.
      const listSnapshots: { key: any; data: ListResponse | undefined }[] = [];
      qc.getQueriesData<ListResponse>({ queryKey: ['leads'] }).forEach(([key, data]) => {
        listSnapshots.push({ key, data });
        if (!data) return;
        qc.setQueryData<ListResponse>(key as any, {
          ...data,
          leads: data.leads.filter((l) => l.id !== id),
          total: Math.max(0, data.total - 1),
        });
      });

      return { prevLead, listSnapshots };
    },
    onError: (_err, vars, ctx) => {
      if (!ctx) return;
      if (ctx.prevLead) qc.setQueryData(['lead', vars.id], ctx.prevLead);
      ctx.listSnapshots.forEach((s) => qc.setQueryData(s.key, s.data));
    },
    onSettled: (_data, _err, vars) => {
      // Don't invalidate the leads list on success — the optimistic
      // splice is already correct and refetching forces a flicker.
      qc.invalidateQueries({ queryKey: ['lead', vars.id] });
    },
  });
}

export function useEnrichLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/leads/${id}/enrich`);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
    },
  });
}

export type Drafts = { email?: string; linkedin?: string; whatsapp?: string };

export function useLeadDrafts(id: string | undefined, cached?: Drafts | null) {
  return useQuery<Drafts>({
    queryKey: ['lead-drafts', id],
    queryFn: async () => {
      const res = await api.post<{ drafts: string[] }>(`/leads/${id}/drafts`);
      const [email, linkedin, whatsapp] = res.data.drafts ?? [];
      return { email, linkedin, whatsapp };
    },
    enabled: !!id,
    initialData: cached && (cached.email || cached.linkedin || cached.whatsapp) ? cached : undefined,
    staleTime: 30 * 60 * 1000,
  });
}
