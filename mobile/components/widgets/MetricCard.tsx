import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type MetricResponse = {
  value: string | number;
  delta?: string;
  label?: string;
};

type Props = {
  label?: string;
  metric_key?: string;
  value?: string | number;
  delta?: string;
  icon?: string;
  color?: string;
  onAction?: (action: string) => void;
};

export default function MetricCard({ label = '', metric_key, value: staticValue, delta: staticDelta, icon, color }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<MetricResponse>({
    queryKey: ['metric', metric_key],
    queryFn: async () => {
      const res = await api.get<MetricResponse>(`/metrics/${metric_key}`);
      return res.data;
    },
    enabled: !!metric_key,
    staleTime: 60_000,
  });

  const displayLabel = data?.label ?? label;
  const displayValue = data?.value ?? staticValue ?? '—';
  const displayDelta = data?.delta ?? staticDelta;
  const accentColor = color ?? palette.primary;
  const isPositive = displayDelta?.startsWith('+');

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 16,
        flex: 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text
          style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_500Medium', letterSpacing: 0.4 }}
          numberOfLines={1}
        >
          {displayLabel.toUpperCase()}
        </Text>
        {icon ? <Text style={{ fontSize: 14 }}>{icon}</Text> : null}
      </View>

      {isLoading && metric_key ? (
        <ActivityIndicator color={accentColor} style={{ alignSelf: 'flex-start' }} />
      ) : (
        <Text
          style={{
            color: accentColor !== palette.primary ? accentColor : palette.text,
            fontSize: 28,
            fontWeight: '700',
            fontFamily: 'Inter_700Bold',
            letterSpacing: -0.5,
          }}
        >
          {String(displayValue)}
        </Text>
      )}

      {displayDelta ? (
        <Text
          style={{
            color: isPositive ? palette.success : palette.destructive,
            fontSize: 12,
            fontFamily: 'Inter_500Medium',
            marginTop: 6,
          }}
        >
          {displayDelta}
        </Text>
      ) : null}
    </View>
  );
}
