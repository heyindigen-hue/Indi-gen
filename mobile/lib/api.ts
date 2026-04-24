import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE = process.env.EXPO_PUBLIC_API_URL || 'https://leadgen.indigenservices.com/api';

export const api = axios.create({ baseURL: BASE, timeout: 20000 });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('leadhangover_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err?.response?.status === 401) {
      await SecureStore.deleteItemAsync('leadhangover_token');
    }
    return Promise.reject(err);
  }
);
