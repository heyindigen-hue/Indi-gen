import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type BalanceResponse = {
  balance: number;
  weekly_change?: number;
  history?: number[];
};

type Props = {
  showTopUp?: boolean;
  onAction?: (action: string) => void;
};

const SPARK_W = 88;
const SPARK_H = 28;

const Sparkline = memo(function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = SPARK_W / (data.length - 1);

  const pts = data
    .map((v, i) => {
      const x = i * step;
      const y = SPARK_H - ((v - min) / range) * (SPARK_H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Build filled path for gradient area
  const firstX = '0';
  const lastX = ((data.length - 1) * step).toFixed(1);
  const firstY = (SPARK_H - ((data[0] - min) / range) * (SPARK_H - 4) - 2).toFixed(1);
  const areaPath = `M0,${SPARK_H} L${firstX},${firstY} ${pts.split(' ').slice(1).map((p, i) => `L${p}`).join(' ')} L${lastX},${SPARK_H} Z`;

  return (
    <Svg width={SPARK_W} height={SPARK_H}>
      <Defs>
        <LinearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={areaPath} fill="url(#sg)" />
      <Polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
});

export default function TokenBalance({ showTopUp = true, onAction }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<BalanceResponse>({
    queryKey: ['token-balance'],
    queryFn: async () => {
      const res = await api.get<BalanceResponse>('/billing/tokens/balance');
      return res.data;
    },
    staleTime: 60_000,
  });

  const balance = data?.balance ?? 0;
  const weeklyChange = data?.weekly_change;
  const history = data?.history ?? [];

  const handleTopUp = () => {
    onAction?.('top_up');
    router.push('/paywall');
  };

  return (
    <View
      style={{
        backgroundColor: palette.primary + '14',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.primary + '40',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 0.4 }}>
          TOKENS
        </Text>
        {showTopUp && (
          <TouchableOpacity
            onPress={handleTopUp}
            style={{
              backgroundColor: palette.primary,
              borderRadius: radius / 2,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Text style={{ color: palette.primaryFg, fontSize: 12, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
              Top up
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={palette.primary} style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
      ) : (
        <Text
          style={{
            color: palette.text,
            fontSize: 36,
            fontWeight: '700',
            fontFamily: 'Inter_700Bold',
            lineHeight: 40,
            letterSpacing: -1,
          }}
        >
          {balance.toLocaleString()}
        </Text>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Sparkline data={history.length >= 2 ? history : [4, 7, 5, 8, 6, 9, 7, 10, 8, 6, 9, 11, 8, 7]} color={palette.primary} />
          {weeklyChange !== undefined && (
            <Text
              style={{
                color: weeklyChange >= 0 ? palette.success : palette.destructive,
                fontSize: 12,
                fontFamily: 'Inter_500Medium',
              }}
            >
              {weeklyChange >= 0 ? '+' : ''}{weeklyChange} this week
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
