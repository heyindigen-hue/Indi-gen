import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';
import { Avatar } from '../../components/ui/Avatar';
import { LeadIcon, FilterIcon } from '../../components/icons';

type Lead = {
  id: string;
  name?: string | null;
  headline?: string | null;
  company?: string | null;
  score?: number | null;
  status?: string | null;
  icp_type?: string | null;
  intent_label?: string | null;
  intent_confidence?: number | null;
  created_at?: string | null;
  post_date?: string | null;
};

type LeadsPage = {
  leads: Lead[];
  total: number;
  limit: number;
  offset: number;
};

type SortKey = 'score' | 'recent';
type StatusKey = 'all' | 'New' | 'Contacted' | 'Qualified' | 'Skip';
type IcpKey = 'all' | 'D2C' | 'SaaS' | 'Services';
type CategoryKey =
  | 'All'
  | 'Shopify'
  | 'SaaS'
  | 'AI'
  | 'Mobile'
  | 'Web'
  | 'Design'
  | 'Social Media';

const PAGE = 20;

const STATUS_FILTERS: { id: StatusKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'New', label: 'New' },
  { id: 'Contacted', label: 'Contacted' },
  { id: 'Qualified', label: 'Qualified' },
  { id: 'Skip', label: 'Skip' },
];

const ICP_FILTERS: { id: IcpKey; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'D2C', label: 'D2C' },
  { id: 'SaaS', label: 'SaaS' },
  { id: 'Services', label: 'Services' },
];

const CATEGORY_FILTERS: CategoryKey[] = [
  'All',
  'Shopify',
  'SaaS',
  'AI',
  'Mobile',
  'Web',
  'Design',
  'Social Media',
];

function daysAgo(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return hours <= 0 ? 'just now' : `${hours}h ago`;
  }
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function intentColor(label: string | null | undefined, palette: any): string {
  if (label === 'strong_buyer') return palette.success;
  if (label === 'buyer') return palette.primary;
  if (label === 'researching') return palette.warning;
  return palette.muted;
}

function prettyIntent(label: string | null | undefined): string {
  if (!label) return '';
  return label.replace('_', ' ');
}

export default function LeadsTab() {
  const { palette, radius, effectiveScheme } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [sort, setSort] = useState<SortKey>('score');
  const [statusFilter, setStatusFilter] = useState<StatusKey>('all');
  const [icpFilter, setIcpFilter] = useState<IcpKey>('all');
  const [category, setCategory] = useState<CategoryKey>('All');

  const queryKey = useMemo(
    () => ['leads', 'tab', sort, statusFilter, icpFilter, category] as const,
    [sort, statusFilter, icpFilter, category]
  );

  const params = useMemo(() => {
    const p: Record<string, string | number> = { limit: PAGE, platform: 'linkedin' };
    if (statusFilter !== 'all') p.status = statusFilter;
    if (icpFilter !== 'all') p.icp_type = icpFilter;
    if (category !== 'All') p.category = category;
    return p;
  }, [statusFilter, icpFilter, category]);

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const res = await api.get<LeadsPage | Lead[]>('/leads', {
        params: { ...params, offset: pageParam },
      });
      // Server returns { leads, total, limit, offset }; defend against either shape.
      const body: any = res.data;
      const items: Lead[] = Array.isArray(body) ? body : Array.isArray(body?.leads) ? body.leads : [];
      const total: number = Array.isArray(body) ? items.length : Number(body?.total ?? items.length);
      return { items, total, offset: Number(pageParam) };
    },
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((sum, p: any) => sum + (p.items?.length ?? 0), 0);
      if (last.items.length < PAGE) return undefined;
      if (loaded >= last.total) return undefined;
      return loaded;
    },
    staleTime: 30_000,
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['leads', 'tab'] });
    }, [qc])
  );

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/leads/${id}/status`, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads', 'tab'] });
    },
    onError: () => {
      Alert.alert('Could not update', 'Lead status change failed. Please try again.');
    },
  });

  const onLongPress = useCallback(
    (lead: Lead) => {
      haptic.medium();
      Alert.alert(
        lead.name ?? 'Lead',
        'Quick actions',
        [
          { text: 'Mark new', onPress: () => statusMutation.mutate({ id: lead.id, status: 'New' }) },
          { text: 'Move to contacted', onPress: () => statusMutation.mutate({ id: lead.id, status: 'Contacted' }) },
          { text: 'Skip', style: 'destructive', onPress: () => statusMutation.mutate({ id: lead.id, status: 'Skip' }) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    },
    [statusMutation]
  );

  const allLeads: Lead[] = useMemo(() => {
    const flat = (data?.pages ?? []).flatMap((p: any) => p.items as Lead[]);
    if (sort === 'score') {
      return [...flat].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return [...flat].sort(
      (a, b) =>
        new Date(b.created_at ?? b.post_date ?? 0).getTime() -
        new Date(a.created_at ?? a.post_date ?? 0).getTime()
    );
  }, [data, sort]);

  const total = data?.pages?.[0]?.total ?? 0;
  const newCount = useMemo(
    () => allLeads.filter((l) => (l.status ?? '').toLowerCase() === 'new').length,
    [allLeads]
  );

  const renderItem = useCallback(
    ({ item }: { item: Lead }) => (
      <LeadRow lead={item} palette={palette} radius={radius} onLongPress={() => onLongPress(item)} />
    ),
    [palette, radius, onLongPress]
  );

  const keyExtractor = useCallback((item: Lead) => item.id, []);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: palette.text }]}>Your Leads</Text>
          <Text style={[styles.headerSubtitle, { color: palette.muted }]}>
            {total} total · {newCount} new
          </Text>
        </View>
      </View>

      <View style={[styles.sortRow, { borderColor: palette.border }]}>
        <SortPill
          label="Top score"
          active={sort === 'score'}
          palette={palette}
          onPress={() => setSort('score')}
        />
        <SortPill
          label="Most recent"
          active={sort === 'recent'}
          palette={palette}
          onPress={() => setSort('recent')}
        />
        <View style={{ flex: 1 }} />
        <FilterIcon size={16} color={palette.muted} strokeWidth={1.6} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {CATEGORY_FILTERS.map((c) => (
          <FilterChip
            key={`c-${c}`}
            label={c}
            active={category === c}
            palette={palette}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={`s-${f.id}`}
            label={f.label}
            active={statusFilter === f.id}
            palette={palette}
            onPress={() => setStatusFilter(f.id)}
          />
        ))}
        <View style={[styles.chipDivider, { backgroundColor: palette.border }]} />
        {ICP_FILTERS.map((f) => (
          <FilterChip
            key={`i-${f.id}`}
            label={f.label}
            active={icpFilter === f.id}
            palette={palette}
            onPress={() => setIcpFilter(f.id)}
          />
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={allLeads}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 32 }]}
          ItemSeparatorComponent={() => (
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: palette.border }} />
          )}
          ListEmptyComponent={<EmptyState palette={palette} effectiveScheme={effectiveScheme} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={palette.muted} size="small" />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

function SortPill({
  label,
  active,
  palette,
  onPress,
}: {
  label: string;
  active: boolean;
  palette: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortPill,
        {
          backgroundColor: active ? palette.text : 'transparent',
          borderColor: active ? palette.text : palette.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.sortPillText, { color: active ? palette.bg : palette.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  palette,
  onPress,
}: {
  label: string;
  active: boolean;
  palette: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? palette.primary : palette.card,
          borderColor: active ? palette.primary : palette.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? palette.primaryFg : palette.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LeadRow({
  lead,
  palette,
  radius,
  onLongPress,
}: {
  lead: Lead;
  palette: any;
  radius: number;
  onLongPress: () => void;
}) {
  const score = lead.score ?? 0;
  const highScore = score >= 8;
  const date = lead.post_date ?? lead.created_at ?? null;

  return (
    <Pressable
      onPress={() => router.push(`/lead/${lead.id}` as any)}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? palette.card : palette.bg },
      ]}
    >
      <Avatar name={lead.name ?? '?'} size={44} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, { color: palette.text }]} numberOfLines={1}>
            {lead.name ?? 'Unknown lead'}
          </Text>
          <View style={styles.rowTopRight}>
            <View
              style={[
                styles.scoreChip,
                {
                  backgroundColor: highScore ? palette.primary : palette.card,
                  borderColor: highScore ? palette.primary : palette.border,
                  borderWidth: highScore ? 0 : StyleSheet.hairlineWidth,
                  borderRadius: radius / 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.scoreChipText,
                  { color: highScore ? palette.primaryFg : palette.text },
                ]}
              >
                {score.toFixed(score % 1 === 0 ? 0 : 1)}
              </Text>
            </View>
          </View>
        </View>
        {lead.headline ? (
          <Text
            style={[styles.rowHeadline, { color: palette.muted }]}
            numberOfLines={1}
          >
            {lead.headline}
          </Text>
        ) : null}
        <View style={styles.rowMeta}>
          {lead.company ? (
            <Text
              style={[styles.metaPiece, { color: palette.text }]}
              numberOfLines={1}
            >
              {lead.company}
            </Text>
          ) : null}
          {lead.intent_label ? (
            <Text
              style={[styles.metaPiece, { color: intentColor(lead.intent_label, palette) }]}
              numberOfLines={1}
            >
              · {prettyIntent(lead.intent_label)}
            </Text>
          ) : null}
          {date ? (
            <Text
              style={[styles.metaPiece, { color: palette.muted }]}
              numberOfLines={1}
            >
              · {daysAgo(date)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({
  palette,
  effectiveScheme: _scheme,
}: {
  palette: any;
  effectiveScheme: 'light' | 'dark';
}) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyMark, { borderColor: palette.primary + '40', backgroundColor: palette.primary + '12' }]}>
        <LeadIcon size={36} color={palette.primary} strokeWidth={1.6} />
      </View>
      <Text style={[styles.emptyTitle, { color: palette.text, fontFamily: 'Fraunces_400Regular' }]}>
        No leads yet
      </Text>
      <Text style={[styles.emptyBody, { color: palette.muted }]}>
        Your hunter wakes up at 3am IST tonight. We&apos;ll surface fresh D2C, Shopify Plus, React
        Native and AI prospects right here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sortPillText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  chipRow: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
  },
  chipDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    marginHorizontal: 6,
  },
  listContent: {
    paddingTop: 4,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
  scoreChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: 'center',
  },
  scoreChipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  rowHeadline: {
    fontSize: 12.5,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaPiece: {
    fontSize: 11.5,
    fontFamily: 'Inter_500Medium',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  footerLoader: { paddingVertical: 18, alignItems: 'center' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 96,
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyMark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 22,
    fontStyle: 'italic',
  },
  emptyBody: {
    fontSize: 13.5,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
});
