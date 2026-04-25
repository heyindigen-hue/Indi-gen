import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type ChannelData = { channel: string; count: number; color?: string };
type ChannelResponse = { channels: ChannelData[] };

type Props = {
  period?: string;
};

const COLORS = ['#F97316', '#FCD34D', '#34D399', '#60A5FA', '#A78BFA'];

function DonutSegments({ data, size }: { data: { value: number; color: string }[]; size: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - 16) / 2;
  const strokeWidth = size * 0.22;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  return (
    <Svg width={size} height={size}>
      {data.map((seg, i) => {
        const fraction = seg.value / total;
        const dash = fraction * circumference;
        const gap = circumference - dash;
        const rotation = -90 + (offset / total) * 360;
        offset += seg.value;
        return (
          <Circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
          />
        );
      })}
    </Svg>
  );
}

export default function ChannelMix({ period = '30d' }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<ChannelResponse>({
    queryKey: ['channel-mix', period],
    queryFn: async () => {
      const res = await api.get<ChannelResponse>(`/stats/channel-mix?period=${period}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const channels = data?.channels ?? [];
  const total = channels.reduce((s, c) => s + c.count, 0);

  const segments = channels.map((c, i) => ({
    value: c.count,
    color: c.color ?? COLORS[i % COLORS.length],
    label: c.channel,
  }));

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 14,
      }}
    >
      <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600', marginBottom: 12 }}>
        Outreach Mix · {period}
      </Text>

      {isLoading ? (
        <View style={{ alignItems: 'center', padding: 16 }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : channels.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 12 }}>
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No outreach yet</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <DonutSegments data={segments} size={80} />
          <View style={{ flex: 1, gap: 6 }}>
            {segments.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: s.color }} />
                <Text style={{ flex: 1, color: palette.text, fontSize: 12, fontFamily: 'Inter_400Regular' }} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_500Medium' }}>
                  {total ? Math.round((s.value / total) * 100) : 0}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
