import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type StreakData = { current: number; best: number; days: boolean[] };

type Props = {
  type?: 'login' | 'scrape';
};

export default function StreakCounter({ type = 'login' }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<StreakData>({
    queryKey: ['streak', type],
    queryFn: async () => {
      const res = await api.get<StreakData>(`/stats/streak?type=${type}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const streak = data?.current ?? 0;
  const best = data?.best ?? streak;
  const days = data?.days ?? Array(7).fill(false).map((_, i) => i < streak % 7);

  const label = type === 'login' ? 'Login streak' : 'Scrape streak';
  const emoji = streak >= 7 ? '🔥' : streak >= 3 ? '✨' : '⚡';

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ fontSize: 36 }}>{emoji}</Text>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                <Text style={{ color: palette.text, fontSize: 32, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -1 }}>
                  {streak}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>days</Text>
              </View>
              <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular' }}>{label}</Text>
            </>
          )}
        </View>
        {best > 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: palette.muted, fontSize: 10, fontFamily: 'Inter_400Regular' }}>Best</Text>
            <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>{best}</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 4, marginTop: 12 }}>
        {days.slice(-7).map((active: boolean, i: number) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              backgroundColor: active ? palette.primary : palette.border,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', color: palette.muted, fontSize: 9, fontFamily: 'Inter_400Regular' }}>
            {d}
          </Text>
        ))}
      </View>
    </View>
  );
}
