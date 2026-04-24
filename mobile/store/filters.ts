import { create } from 'zustand';

type FilterState = {
  activeFilter: string | null;
  setFilter: (filter: string | null) => void;
};

export const useFilterStore = create<FilterState>((set) => ({
  activeFilter: null,
  setFilter: (filter) => set({ activeFilter: filter }),
}));
