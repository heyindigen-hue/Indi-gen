import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { useFilterStore } from '../../store/filters';
import { Avatar } from '../ui/Avatar';
import { ScoreBadge } from '../ui/ScoreBadge';
import { Chip } from '../ui/Chip';

type Lead = {
  id: string;
  name: string;
  headline?: string;
  company?: string;
  score?: number;
  icp?: string;
  avatar?: string;
};

type Props = {
  title?: string;
  onAction?: (action: string) => void;
};

const LeadCard = memo(function LeadCard({ lead }: { lead: Lead }) {
  const { palette, radius } = useTheme();

  const handlePress = useCallback(() => {
    router.push(`/lead/${lead.id}` as any);
  }, [lead.id]);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 12,
        width: 160,
        marginRight: 10,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Avatar name={lead.name} uri={lead.avatar} size={38} />
        {lead.score !== undefined && <ScoreBadge score={lead.score} />}
      </View>

      <Text
        style={{ color: palette.text, fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}
        numberOfLines={1}
      >
        {lead.name}
      </Text>

      {lead.headline ? (
        <Text
          style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }}
          numberOfLines={1}
        >
          {lead.headline}
        </Text>
      ) : null}

      {lead.icp ? <Chip label={lead.icp} active color="#8B5CF6" /> : null}
    </TouchableOpacity>
  );
});

const SeeAllCard = memo(function SeeAllCard() {
  const { palette, radius } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/explore' as any)}
      activeOpacity={0.75}
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginRight: 4,
      }}
    >
      <Text style={{ color: palette.primary, fontSize: 22 }}>→</Text>
      <Text style={{ color: palette.primary, fontSize: 11, fontFamily: 'Inter_500Medium' }}>See all</Text>
    </TouchableOpacity>
  );
});

export default function RecentLeadsCarousel({ title = 'Recent Leads', onAction }: Props) {
  const { palette } = useTheme();
  const { activeFilter } = useFilterStore();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['leads-carousel', activeFilter],
    queryFn: async () => {
      const params: Record<string, string | number> = { status: 'New', limit: 20 };
      if (activeFilter) params.icp = activeFilter;
      const res = await api.get<Lead[]>('/leads', { params });
      return res.data;
    },
    staleTime: 30_000,
  });

  const renderItem = useCallback(({ item }: { item: Lead }) => <LeadCard lead={item} />, []);
  const keyExtractor = useCallback((item: Lead) => item.id, []);

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text
          style={{ color: palette.text, fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}
        >
          {title}
        </Text>
        {isLoading && <ActivityIndicator size="small" color={palette.muted} />}
      </View>

      {leads.length === 0 && !isLoading ? (
        <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
          No leads yet — try scraping or adjusting filters.
        </Text>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={leads}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListFooterComponent={<SeeAllCard />}
          removeClippedSubviews
          maxToRenderPerBatch={8}
          initialNumToRender={5}
          getItemLayout={(_, index) => ({ length: 170, offset: 170 * index, index })}
        />
      )}
    </View>
  );
}
