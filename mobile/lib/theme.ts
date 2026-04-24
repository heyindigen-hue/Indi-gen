export const palettes = {
  graphite: {
    bg: '#08090B', card: '#111113', border: '#1F1F23',
    text: '#F7F8F8', muted: '#8A8F98',
    primary: '#7170FF', primaryFg: '#FFFFFF',
    success: '#4CB782', warning: '#F2C94C', destructive: '#E5484D',
  },
  vercel: {
    bg: '#000000', card: '#0A0A0A', border: '#1F1F1F',
    text: '#EDEDED', muted: '#A1A1A1',
    primary: '#A3E635', primaryFg: '#000000',
    success: '#00C48C', warning: '#F5A524', destructive: '#FF4D4F',
  },
  cron: {
    bg: '#0B1020', card: '#141B30', border: '#1F2740',
    text: '#F4F6FB', muted: '#7D87A6',
    primary: '#4F8BFF', primaryFg: '#FFFFFF',
    success: '#2ED47A', warning: '#FFB020', destructive: '#F45B69',
  },
};

export type Palette = typeof palettes.graphite;
export const defaultPalette: Palette = palettes.graphite;
