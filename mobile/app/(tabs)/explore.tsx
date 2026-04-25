import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkIcon } from '../../components/icons';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';
import { ScoreBadge } from '../../components/ui/ScoreBadge';
import { Chip } from '../../components/ui/Chip';

type SavedLead = {
  id: string;
  name: string;
  company?: string;
  headline?: string;
  score?: number;
  icp?: string;
  icp_type?: string;
  avatar?: string;
  profile_data?: { profile_photo_url?: string };
  savedAt?: string;
};

type SavedLeadsResponse = {
  leads: SavedLead[];
  total: number;
  limit: number;
  offset: number;
};

function filterLeads(leads: SavedLead[], search: string): SavedLead[] {
  if (!search.trim()) return leads;
  const lower = search.toLowerCase();
  return leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(lower) ||
      (lead.company?.toLowerCase().includes(lower) ?? false)
  );
}

function LeadCard({ lead, palette, radius }: { lead: SavedLead; palette: any; radius: number }) {
  return (
    <Pressable
      onPress={() => router.push(`/lead/${lead.id}` as any)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderRadius: radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardAvatarRow}>
        <Avatar uri={lead.profile_data?.profile_photo_url ?? lead.avatar} name={lead.name} size={48} />
      </View>
      <Text style={[styles.cardName, { color: palette.text }]} numberOfLines={1}>
        {lead.name}
      </Text>
      {lead.company ? (
        <Text style={[styles.cardCompany, { color: palette.muted }]} numberOfLines={1}>
          {lead.company}
        </Text>
      ) : null}
      <View style={styles.cardBadges}>
        {lead.score != null ? <ScoreBadge score={lead.score} /> : null}
        {(lead.icp_type ?? lead.icp) ? <Chip label={(lead.icp_type ?? lead.icp) as string} /> : null}
      </View>
    </Pressable>
  );
}

function EmptyState({
  search,
  palette,
}: {
  search: string;
  palette: any;
}) {
  const hasSearch = search.trim().length > 0;
  return (
    <View style={styles.emptyState}>
      <BookmarkIcon size={40} color={palette.muted} strokeWidth={1.5} />
      <Text style={[styles.emptyText, { color: palette.muted }]}>
        {hasSearch
          ? `No leads match "${search}"`
          : 'No saved leads. Swipe right on leads to save them!'}
      </Text>
    </View>
  );
}

export default function ExploreScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery<SavedLeadsResponse>({
    queryKey: ['leads', 'saved'],
    queryFn: async () => {
      const res = await api.get('/leads', {
        params: { status: 'Saved', platform: 'linkedin', limit: 100, sort: 'recent' },
      });
      const payload = res.data as any;
      if (Array.isArray(payload)) {
        return { leads: payload, total: payload.length, limit: 100, offset: 0 };
      }
      return payload as SavedLeadsResponse;
    },
    staleTime: 30_000,
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['leads', 'saved'] });
    }, [qc])
  );

  const allLeads = data?.leads ?? [];
  const filtered = filterLeads(allLeads, search);
  const totalCount = allLeads.length;
  const filteredCount = filtered.length;

  const headerRight =
    search.trim()
      ? `${filteredCount} / ${totalCount}`
      : String(totalCount);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Saved Leads</Text>
        <View style={[styles.countChip, { backgroundColor: palette.primary + '22', borderColor: palette.primary + '55' }]}>
          <Text style={[styles.countChipText, { color: palette.primary }]}>{headerRight}</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or company..."
          placeholderTextColor={palette.muted}
          style={[styles.searchInput, { color: palette.text }]}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Grid */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          }
          ListEmptyComponent={<EmptyState search={search} palette={palette} />}
          renderItem={({ item }) => (
            <View style={styles.gridItem}>
              <LeadCard lead={item} palette={palette} radius={radius} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  countChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    padding: 0,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  columnWrapper: {
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
  card: {
    padding: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 6,
  },
  cardAvatarRow: {
    marginBottom: 2,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  cardCompany: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  cardBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
});
