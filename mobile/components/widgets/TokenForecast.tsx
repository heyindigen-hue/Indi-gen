import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type ForecastData = {
  days_remaining: number;
  daily_burn: number;
  balance: number;
  status: 'ok' | 'low' | 'critical';
};

export default function TokenForecast() {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<ForecastData>({
    queryKey: ['token-forecast'],
    queryFn: async () => {
      const res = await api.get<ForecastData>('/billing/tokens/forecast');
      return res.data;
    },
    staleTime: 300_000,
  });

  const status = data?.status ?? 'ok';
  const accentColor =
    status === 'critical' ? palette.destructive
    : status === 'low' ? palette.warning
    : palette.success;

  const days = data?.days_remaining ?? 0;
  const burn = data?.daily_burn ?? 0;

  return (
    <View
      style={{
        backgroundColor: accentColor + '0D',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: accentColor + '30',
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: accentColor + '18',
          borderWidth: 2,
          borderColor: accentColor + '40',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={accentColor} />
        ) : (
          <>
            <Text style={{ color: accentColor, fontSize: 20, fontFamily: 'Inter_700Bold', fontWeight: '700', lineHeight: 24 }}>
              {days}
            </Text>
            <Text style={{ color: accentColor, fontSize: 9, fontFamily: 'Inter_400Regular', opacity: 0.7 }}>days</Text>
          </>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          Token Runway
        </Text>
        {!isLoading && (
          <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
            ~{burn} tokens/day at current rate
          </Text>
        )}
        {status !== 'ok' && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            activeOpacity={0.8}
            style={{
              alignSelf: 'flex-start',
              marginTop: 8,
              backgroundColor: accentColor,
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius / 2,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
              Top up
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
