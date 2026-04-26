import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { api } from './api';

export type DraftSet = {
  whatsapp?: string;
  email_subject?: string;
  email_body?: string;
  linkedin_dm?: string;
  cached?: boolean;
  cached_at?: string;
};

export type Lead = {
  id: string;
  name?: string;
  headline?: string;
  company?: string;
  linkedin_url?: string;
  linkedin_urn?: string;
  post_text?: string;
  post_url?: string;
  score?: number;
  icp_type?: string;
  status?: string;
  notes?: string;
  intent_label?: string;
  intent_confidence?: number;
  intent_reason?: string;
  drafts_cache?: DraftSet | null;
  drafts_cached_at?: string;
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

// Legacy 3-field shape kept for compatibility with the inline lead-detail draft tabs.
export type Drafts = { email?: string; linkedin?: string; whatsapp?: string };

function adaptToLegacyDrafts(d: DraftSet | null | undefined): Drafts {
  if (!d) return {};
  return {
    email: d.email_body || '',
    linkedin: d.linkedin_dm || '',
    whatsapp: d.whatsapp || '',
  };
}

export function useLeadDrafts(id: string | undefined, cached?: Drafts | DraftSet | null) {
  return useQuery<Drafts>({
    queryKey: ['lead-drafts', id],
    queryFn: async () => {
      const res = await api.post<DraftSet & { cached?: boolean }>(`/leads/${id}/drafts`, {});
      return adaptToLegacyDrafts(res.data);
    },
    enabled: !!id,
    initialData: (() => {
      if (!cached) return undefined;
      const c = cached as any;
      if (c.email_body || c.linkedin_dm || c.whatsapp) {
        return adaptToLegacyDrafts(c);
      }
      if (c.email || c.linkedin || c.whatsapp) {
        return c as Drafts;
      }
      return undefined;
    })(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useFullDraftSet(id: string | undefined, cached?: DraftSet | null) {
  return useQuery<DraftSet>({
    queryKey: ['lead-drafts-full', id],
    queryFn: async () => {
      const res = await api.post<DraftSet & { cached?: boolean; cached_at?: string }>(
        `/leads/${id}/drafts`,
        {}
      );
      return res.data;
    },
    enabled: !!id,
    initialData: cached || undefined,
    staleTime: 30 * 60 * 1000,
  });
}

export function useRegenerateDrafts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post<DraftSet>(`/leads/${id}/drafts`, { force: true });
      return { id, drafts: res.data };
    },
    onSuccess: ({ id, drafts }) => {
      qc.setQueryData(['lead-drafts-full', id], drafts);
      qc.setQueryData(['lead-drafts', id], adaptToLegacyDrafts(drafts));
      qc.invalidateQueries({ queryKey: ['lead', id] });
    },
  });
}

export function useMarkUnqualified() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      await api.post(`/leads/${id}/mark-unqualified`, reason ? { reason } : {});
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['lead', id] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useTranslate() {
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post<{ translated: string }>(`/leads/translate`, { text });
      return res.data.translated;
    },
  });
}
