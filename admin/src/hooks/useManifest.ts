import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Manifest } from '@/types/sdui';

export function useManifest(platform: 'mobile' = 'mobile') {
  const { data, isLoading } = useQuery<Manifest[]>({
    queryKey: ['manifests', platform],
    queryFn: () => api.get<Manifest[]>(`/admin/manifests?platform=${platform}`),
  });

  const versions = data ?? [];
  const active = versions.find((m) => m.enabled) ?? null;
  const draft = versions.find((m) => !m.enabled) ?? null;

  return { active, draft, versions, isLoading };
}
