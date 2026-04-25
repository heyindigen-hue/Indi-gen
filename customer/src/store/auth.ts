import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar_url?: string | null;
  plan?: string | null;
  onboarding_completed_at?: string | null;
  token_balance?: number;
  features?: string[];
};

type State = {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuth = create<State>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (token, user) => {
        localStorage.setItem('leadhangover_token', token);
        set({ token, user });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('leadhangover_token');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'leadhangover_customer_auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
