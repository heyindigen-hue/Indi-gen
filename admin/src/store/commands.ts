import { useEffect } from 'react';
import { create } from 'zustand';

export type Cmd = {
  id: string;
  label: string;
  group: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
};

type S = {
  commands: Cmd[];
  open: boolean;
  register: (c: Cmd) => () => void;
  setOpen: (v: boolean) => void;
};

export const useCommands = create<S>((set) => ({
  commands: [],
  open: false,
  register: (c) => {
    set((s) => ({ commands: [...s.commands.filter((x) => x.id !== c.id), c] }));
    return () => set((s) => ({ commands: s.commands.filter((x) => x.id !== c.id) }));
  },
  setOpen: (v) => set({ open: v }),
}));

export function useRegisterCommand(cmd: Cmd, deps: unknown[]) {
  const register = useCommands((s) => s.register);
  useEffect(() => {
    const unregister = register(cmd);
    return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
