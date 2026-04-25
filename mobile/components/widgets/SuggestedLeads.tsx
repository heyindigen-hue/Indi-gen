import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type SuggestedLead = {
  id: string;
  name?: string;
  headline?: string;
  score: number;
};

type Props = {
  score_min?: number;
  limit?: number;
  onAction?: (action: string, id: string) => void;
};

export default function SuggestedLeads({ score_min = 7, limit = 5, onAction }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<SuggestedLead[]>({
    queryKey: ['suggested-leads', score_min, limit],
    queryFn: async () => {
      const res = await api.get<SuggestedLead[]>(`/leads/suggested?score_min=${score_min}&limit=${limit}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const leads = data ?? [];

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: palette.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
            ✨ AI Picks
          </Text>
          <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
            Score ≥ {score_min}/10
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)}>
          <Text style={{ color: palette.primary, fontSize: 12, fontFamily: 'Inter_500Medium' }}>See all →</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : leads.length === 0 ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No suggestions yet</Text>
        </View>
      ) : (
        leads.slice(0, limit).map((lead) => (
          <TouchableOpacity
            key={lead.id}
            onPress={() => {
              onAction?.('view_lead', lead.id);
              router.push(`/lead/${lead.id}` as any);
            }}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderTopWidth: 0.5,
              borderTopColor: palette.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: palette.primary + '14',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: palette.primary, fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                {(lead.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_500Medium' }} numberOfLines={1}>
                {lead.name ?? 'Unknown'}
              </Text>
              {lead.headline ? (
                <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 }} numberOfLines={1}>
                  {lead.headline}
                </Text>
              ) : null}
            </View>
            <View
              style={{
                backgroundColor: palette.success + '18',
                borderRadius: 6,
                paddingHorizontal: 7,
                paddingVertical: 3,
              }}
            >
              <Text style={{ color: palette.success, fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700' }}>
                {lead.score}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}
