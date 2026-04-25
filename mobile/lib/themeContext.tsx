import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { Palette, ThemeMode, palettes, defaultPalette } from './theme';

// Shared MMKV bucket with the rest of the app (manifest cache, auth, etc).
const storage: MMKV = new MMKV({ id: 'leadhangover' });
const STORAGE_KEY = 'theme-mode';

type ThemeCtxValue = {
  palette: Palette;
  mode: ThemeMode;
  effectiveScheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
  radius: number;
  density: string;
};

const ThemeCtx = createContext<ThemeCtxValue>({
  palette: defaultPalette,
  mode: 'light',
  effectiveScheme: 'light',
  setMode: () => {},
  radius: 16,
  density: 'comfortable',
});

function readStoredMode(): ThemeMode | null {
  const stored = storage.getString(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return null;
}

function pickInitialMode(manifestMode: ThemeMode | undefined): ThemeMode {
  return readStoredMode() ?? manifestMode ?? 'light';
}

export function ThemeProvider({ children, manifest }: { children: React.ReactNode; manifest?: any }) {
  const systemScheme = useColorScheme();

  const manifestMode: ThemeMode | undefined =
    manifest?.theme?.mode === 'light' ||
    manifest?.theme?.mode === 'dark' ||
    manifest?.theme?.mode === 'system'
      ? manifest.theme.mode
      : undefined;
  const manifestPaletteName: string | undefined = manifest?.theme?.palette;
  const radius: number = manifest?.theme?.radius ?? 16;
  const density: string = manifest?.theme?.density ?? 'comfortable';

  const [mode, setModeState] = useState<ThemeMode>(() => pickInitialMode(manifestMode));

  const setMode = useCallback((newMode: ThemeMode) => {
    storage.set(STORAGE_KEY, newMode);
    setModeState(newMode);
  }, []);

  const effectiveScheme: 'light' | 'dark' =
    mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;

  const palette = useMemo<Palette>(() => {
    // If the manifest pins a specific named palette (graphite, vercel, cron, ...),
    // use it. Otherwise resolve warm-light / warm-dark from the user's chosen mode.
    if (
      manifestPaletteName &&
      manifestPaletteName !== 'warm-light' &&
      manifestPaletteName !== 'warm-dark'
    ) {
      return (palettes as Record<string, Palette>)[manifestPaletteName] ?? defaultPalette;
    }
    return effectiveScheme === 'dark' ? palettes['warm-dark'] : palettes['warm-light'];
  }, [manifestPaletteName, effectiveScheme]);

  return (
    <ThemeCtx.Provider value={{ palette, mode, effectiveScheme, setMode, radius, density }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export const useTheme = () => useContext(ThemeCtx);
