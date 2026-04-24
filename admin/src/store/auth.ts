import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type User = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  avatar_url?: string | null;
};

type State = {
  user: User | null;
  token: string | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuth = create<State>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (token, user) => {
        localStorage.setItem('indigen_token', token);
        set({ token, user });
      },
      logout: () => {
        localStorage.removeItem('indigen_token');
        set({ token: null, user: null });
      },
    }),
    {
      name: 'indigen_auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
    },
  ),
);
