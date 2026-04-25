import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type Cell = { label: string; value_key: string; color?: 'primary' | 'success' | 'warning' | 'accent' };

type Props = {
  cells?: Cell[];
};

type StatsResponse = Record<string, number | string>;

const DEFAULT_CELLS: Cell[] = [
  { label: 'Saved', value_key: 'leads_saved_30d', color: 'primary' },
  { label: 'Sent', value_key: 'sent_30d', color: 'warning' },
  { label: 'Reply %', value_key: 'reply_rate', color: 'success' },
  { label: 'Tokens', value_key: 'token_balance', color: 'accent' },
];

export default function StatGrid({ cells = DEFAULT_CELLS }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<StatsResponse>({
    queryKey: ['stat-grid'],
    queryFn: async () => {
      const res = await api.get<StatsResponse>('/stats/summary');
      return res.data;
    },
    staleTime: 120_000,
  });

  const colorMap: Record<string, string> = {
    primary: palette.primary,
    success: palette.success,
    warning: palette.warning,
    accent: (palette as any).accent ?? palette.primary,
  };

  const activeCells = (cells ?? DEFAULT_CELLS).slice(0, 4);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {activeCells.map((cell, i) => {
        const accent = colorMap[cell.color ?? 'primary'] ?? palette.primary;
        const rawValue = data?.[cell.value_key];
        const displayValue =
          rawValue !== undefined
            ? typeof rawValue === 'number'
              ? rawValue >= 1000
                ? `${(rawValue / 1000).toFixed(1)}k`
                : String(rawValue)
              : String(rawValue)
            : '—';

        return (
          <View
            key={i}
            style={{
              flex: 1,
              minWidth: '45%',
              backgroundColor: accent + '10',
              borderRadius: radius / 1.5,
              borderWidth: 0.5,
              borderColor: accent + '30',
              padding: 12,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={accent} />
            ) : (
              <Text style={{ color: accent, fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.5 }}>
                {displayValue}
              </Text>
            )}
            <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 3 }}>
              {cell.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
