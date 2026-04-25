import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type FollowupData = { count: number; leads: Array<{ id: string; name?: string; days_silent: number }> };

type Props = {
  days_threshold?: number;
  onAction?: (action: string) => void;
};

export default function FollowupReminder({ days_threshold = 7, onAction }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<FollowupData>({
    queryKey: ['followup-reminder', days_threshold],
    queryFn: async () => {
      const res = await api.get<FollowupData>(`/leads/needs-followup?days=${days_threshold}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const count = data?.count ?? 0;
  const top = data?.leads?.slice(0, 3) ?? [];

  if (!isLoading && count === 0) return null;

  return (
    <TouchableOpacity
      onPress={() => {
        onAction?.('view_followups');
        router.push('/(tabs)/outreach' as any);
      }}
      activeOpacity={0.9}
      style={{
        backgroundColor: '#FEF2F2',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: '#FECACA',
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: top.length ? 10 : 0 }}>
        <Text style={{ fontSize: 22 }}>⏰</Text>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator size="small" color={palette.destructive} />
          ) : (
            <>
              <Text style={{ color: '#991B1B', fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
                {count} lead{count !== 1 ? 's' : ''} need follow-up
              </Text>
              <Text style={{ color: '#EF4444', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
                No reply in {days_threshold}+ days
              </Text>
            </>
          )}
        </View>
        <Text style={{ color: '#EF4444', fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>View →</Text>
      </View>

      {top.length > 0 && (
        <View style={{ gap: 5 }}>
          {top.map((lead) => (
            <View
              key={lead.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: '#FFF5F5',
                borderRadius: radius / 2,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
              <Text style={{ flex: 1, color: '#7F1D1D', fontSize: 12, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                {lead.name ?? 'Unknown lead'}
              </Text>
              <Text style={{ color: '#EF4444', fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                {lead.days_silent}d
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
