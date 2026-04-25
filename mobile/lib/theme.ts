export type ThemeMode = 'light' | 'dark' | 'system';

// LAND3 brand: cream / ink / orange. Mobile uses Manrope (Fraunces is hard on RN
// because of variable-axis loading; bold Manrope reads close enough for headlines).
export const palettes = {
  'warm-light': {
    bg: '#F7F1E5',           // cream
    card: '#FBF7EE',          // surface (paper)
    border: 'rgba(14,14,12,0.10)', // line
    text: '#0E0E0C',          // ink
    muted: '#2A2823',         // ash
    dim: 'rgba(14,14,12,0.55)',
    primary: '#FF5A1F',       // orange
    primaryFg: '#FFFFFF',
    success: '#3E7C4B',
    warning: '#C88A10',
    destructive: '#C8301A',
  },
  'warm-dark': {
    bg: '#0E0E0C',
    card: '#1A1815',
    border: 'rgba(247,241,229,0.10)',
    text: '#F7F1E5',
    muted: 'rgba(247,241,229,0.55)',
    dim: 'rgba(247,241,229,0.40)',
    primary: '#FF5A1F',
    primaryFg: '#FFFFFF',
    success: '#4CB782',
    warning: '#F2C94C',
    destructive: '#E5484D',
  },
  graphite: {
    bg: '#08090B',
    card: '#111113',
    border: '#1F1F23',
    text: '#F7F8F8',
    muted: '#8A8F98',
    dim: 'rgba(247,248,248,0.40)',
    primary: '#FF5A1F',
    primaryFg: '#FFFFFF',
    success: '#4CB782',
    warning: '#F2C94C',
    destructive: '#E5484D',
  },
  vercel: {
    bg: '#000000',
    card: '#0A0A0A',
    border: '#1F1F1F',
    text: '#EDEDED',
    muted: '#A1A1A1',
    dim: 'rgba(237,237,237,0.40)',
    primary: '#A3E635',
    primaryFg: '#000000',
    success: '#00C48C',
    warning: '#F5A524',
    destructive: '#FF4D4F',
  },
  cron: {
    bg: '#0B1020',
    card: '#141B30',
    border: '#1F2740',
    text: '#F4F6FB',
    muted: '#7D87A6',
    dim: 'rgba(244,246,251,0.40)',
    primary: '#4F8BFF',
    primaryFg: '#FFFFFF',
    success: '#2ED47A',
    warning: '#FFB020',
    destructive: '#F45B69',
  },
};

export type Palette = typeof palettes['warm-light'];
export const defaultPalette: Palette = palettes['warm-light'];
