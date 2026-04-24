import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { createMMKV } from 'react-native-mmkv';
import defaultManifest from '../constants/defaultManifest.json';

const cache = createMMKV({ id: 'leadhangover' });
const KEY = 'ui_manifest_v1';

export function useManifest() {
  return useQuery({
    queryKey: ['ui-manifest'],
    queryFn: async () => {
      try {
        const res = await api.get('/public/ui-manifest', { params: { platform: 'mobile' } });
        cache.set(KEY, JSON.stringify(res.data));
        return res.data;
      } catch {
        const stored = cache.getString(KEY);
        if (stored) return JSON.parse(stored);
        return defaultManifest;
      }
    },
    staleTime: 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: true,
  });
}
