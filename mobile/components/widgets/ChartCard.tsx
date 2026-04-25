import React, { memo } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Polyline, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type MetricData = { points: number[]; label?: string; change?: number };

type Props = {
  metric_key?: string;
  range?: string;
  color?: 'primary' | 'success' | 'warning';
  onAction?: (action: string) => void;
};

const METRIC_LABELS: Record<string, string> = {
  leads_per_day: 'Leads / day',
  tokens_used: 'Token burn',
  reply_rate: 'Reply rate',
};

const W = 280;
const H = 56;

const SparkArea = memo(function SparkArea({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = W / (data.length - 1);

  const pts = data
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * (H - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = ((data.length - 1) * step).toFixed(1);
  const firstY = (H - ((data[0] - min) / range) * (H - 8) - 4).toFixed(1);
  const areaPath = `M0,${H} L0,${firstY} ${pts
    .split(' ')
    .slice(1)
    .map((p) => `L${p}`)
    .join(' ')} L${lastX},${H} Z`;

  return (
    <Svg width={W} height={H}>
      <Defs>
        <LinearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#cg)" />
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
});

export default function ChartCard({
  metric_key = 'leads_per_day',
  range = '30d',
  color: colorKey = 'primary',
}: Props) {
  const { palette, radius } = useTheme();

  const colorValue: string = colorKey === 'success' ? palette.success : colorKey === 'warning' ? palette.warning : palette.primary;

  const { data, isLoading } = useQuery<MetricData>({
    queryKey: ['chart-card', metric_key, range],
    queryFn: async () => {
      const res = await api.get<MetricData>(`/stats/metric?key=${metric_key}&range=${range}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const points = data?.points ?? [4, 7, 5, 9, 6, 10, 8, 12, 9, 7, 11, 14, 10, 8, 13];
  const latest = points[points.length - 1] ?? 0;
  const prev = points[points.length - 2] ?? latest;
  const change = prev ? ((latest - prev) / prev) * 100 : 0;

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 14,
        overflow: 'hidden',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_500Medium' }}>
          {METRIC_LABELS[metric_key] ?? metric_key.replace(/_/g, ' ')}
        </Text>
        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }}>{range}</Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colorValue} />
        ) : (
          <>
            <Text style={{ color: palette.text, fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -1 }}>
              {latest}
            </Text>
            <Text
              style={{
                color: change >= 0 ? palette.success : palette.destructive,
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
                marginBottom: 4,
              }}
            >
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </Text>
          </>
        )}
      </View>

      <SparkArea data={points} color={colorValue} />
    </View>
  );
}
