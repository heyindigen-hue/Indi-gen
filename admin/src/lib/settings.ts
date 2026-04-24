import { api } from './api';

export interface SettingEntry {
  key: string;
  value: string;
  is_secret: boolean;
}

export const getSetting = (key: string) =>
  api.get<{ value: string | null }>(`/admin/settings/${key}`);

export const setSetting = (key: string, value: string) =>
  api.post('/admin/settings', { key, value });

export const getSettingsByCategory = (category: string) =>
  api.get<SettingEntry[]>(`/admin/settings?category=${category}`);
