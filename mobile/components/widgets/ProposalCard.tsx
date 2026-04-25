import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type Proposal = {
  id: string;
  lead_name?: string;
  subject?: string;
  status?: string;
  updated_at?: string;
};

type Props = {
  lead_id?: string | null;
  proposal_id?: string | null;
  onAction?: (action: string) => void;
};

export default function ProposalCard({ lead_id, proposal_id, onAction }: Props) {
  const { palette, radius } = useTheme();

  const url = proposal_id
    ? `/proposals/${proposal_id}`
    : lead_id
    ? `/proposals?lead_id=${lead_id}`
    : '/proposals/latest';

  const { data, isLoading } = useQuery<Proposal>({
    queryKey: ['proposal-card', proposal_id, lead_id],
    queryFn: async () => {
      const res = await api.get<Proposal>(url);
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const handleContinue = () => {
    onAction?.('continue_proposal');
    if (data?.id) router.push(`/(tabs)/outreach?proposal=${data.id}` as any);
  };

  if (isLoading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={palette.primary} />
      </View>
    );
  }

  if (!data) return null;

  return (
    <TouchableOpacity
      onPress={handleContinue}
      activeOpacity={0.85}
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius / 2,
          backgroundColor: palette.primary + '14',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 20 }}>📄</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          {data.subject ?? 'Draft proposal'}
        </Text>
        {data.lead_name ? (
          <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
            For {data.lead_name}
          </Text>
        ) : null}
      </View>
      <Text style={{ color: palette.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
        Continue →
      </Text>
    </TouchableOpacity>
  );
}
