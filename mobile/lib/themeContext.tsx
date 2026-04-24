import React, { createContext, useContext } from 'react';
import { Palette, palettes, defaultPalette } from './theme';

type ThemeCtxValue = { palette: Palette; radius: number; density: string };

const ThemeCtx = createContext<ThemeCtxValue>({
  palette: defaultPalette, radius: 14, density: 'comfortable',
});

export function ThemeProvider({ children, manifest }: { children: React.ReactNode; manifest?: any }) {
  const p = manifest?.theme?.palette || 'graphite';
  const palette = (palettes as any)[p] || defaultPalette;
  const radius = manifest?.theme?.radius ?? 14;
  const density = manifest?.theme?.density || 'comfortable';
  return <ThemeCtx.Provider value={{ palette, radius, density }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
