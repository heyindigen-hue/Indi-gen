import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import * as SecureStore from 'expo-secure-store';

const mmkv = createMMKV({ id: 'leadhangover' });
const storage = {
  getItem: (k: string) => mmkv.getString(k) ?? null,
  setItem: (k: string, v: string) => mmkv.set(k, v),
  removeItem: (k: string) => mmkv.remove(k),
};

type User = { id: string; email: string; name: string | null };
type AuthState = {
  user: User | null;
  setAuth: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setAuth: async (token, user) => {
        await SecureStore.setItemAsync('leadhangover_token', token);
        set({ user });
      },
      logout: async () => {
        await SecureStore.deleteItemAsync('leadhangover_token');
        set({ user: null });
      },
    }),
    { name: 'auth', storage: createJSONStorage(() => storage) }
  )
);
