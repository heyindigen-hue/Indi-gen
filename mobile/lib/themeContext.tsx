import React, { createContext, useContext, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV, type MMKV } from 'react-native-mmkv';
import { Palette, ThemeMode, palettes, defaultPalette } from './theme';

const storage: MMKV = createMMKV({ id: 'lh-theme' });

type ThemeCtxValue = {
  palette: Palette;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  radius: number;
  density: string;
};

const ThemeCtx = createContext<ThemeCtxValue>({
  palette: defaultPalette,
  mode: 'light',
  setMode: () => {},
  radius: 16,
  density: 'comfortable',
});

export function ThemeProvider({ children, manifest }: { children: React.ReactNode; manifest?: any }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const stored = storage.getString('theme_mode');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'light';
  });

  const setMode = useCallback((newMode: ThemeMode) => {
    storage.set('theme_mode', newMode);
    setModeState(newMode);
  }, []);

  const manifestPaletteName = manifest?.theme?.palette;
  const radius = manifest?.theme?.radius ?? 16;
  const density = manifest?.theme?.density ?? 'comfortable';

  let palette: Palette;
  if (manifestPaletteName && manifestPaletteName !== 'warm-light' && manifestPaletteName !== 'warm-dark') {
    palette = (palettes as any)[manifestPaletteName] ?? defaultPalette;
  } else {
    const effectiveMode = mode === 'system'
      ? (systemScheme === 'dark' ? 'dark' : 'light')
      : mode;
    palette = effectiveMode === 'dark' ? palettes['warm-dark'] : palettes['warm-light'];
  }

  return (
    <ThemeCtx.Provider value={{ palette, mode, setMode, radius, density }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
