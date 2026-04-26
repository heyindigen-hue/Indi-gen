import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';
import { useUpdateLeadStatus } from '../../lib/useLeads';
import { KanbanIcon } from '../../components/icons';

type PipelineLead = {
  id: string;
  name?: string | null;
  company?: string | null;
  headline?: string | null;
  score?: number | null;
  status?: string | null;
  intent_label?: string | null;
  created_at?: string | null;
  post_date?: string | null;
};

type ColumnKey = 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won/Lost';

type ColumnDef = {
  key: ColumnKey;
  label: string;
  // Statuses that bucket into this column. The first entry is the canonical
  // status used when moving cards INTO this column.
  matches: string[];
};

const COLUMNS: ColumnDef[] = [
  { key: 'New',           label: 'New',           matches: ['New', 'new'] },
  { key: 'Contacted',     label: 'Contacted',     matches: ['Contacted', 'contacted'] },
  { key: 'Qualified',     label: 'Qualified',     matches: ['Qualified', 'qualified'] },
  { key: 'Proposal Sent', label: 'Proposal Sent', matches: ['Proposal Sent', 'proposal_sent'] },
  { key: 'Won/Lost',      label: 'Won/Lost',      matches: ['Won', 'won', 'Lost', 'lost', 'closed'] },
];

const COLUMN_WIDTH = Math.round(Dimensions.get('window').width * 0.78);

function daysAgo(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return 'just now';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 1) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    return hours <= 0 ? 'just now' : `${hours}h`;
  }
  if (days === 1) return '1d';
  return `${days}d`;
}

function bucketFor(status: string | null | undefined): ColumnKey {
  if (!status) return 'New';
  for (const col of COLUMNS) {
    if (col.matches.includes(status)) return col.key;
  }
  return 'New';
}

export default function PipelineScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const statusMut = useUpdateLeadStatus();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery<{ leads: PipelineLead[] }>({
    queryKey: ['pipeline-leads'],
    queryFn: async () => {
      // Pull a generous slice; pipeline rarely shows more than a few hundred.
      const res = await api.get<any>('/leads', {
        params: { limit: 300, platform: 'linkedin' },
      });
      const body = res.data;
      const items: PipelineLead[] = Array.isArray(body) ? body : Array.isArray(body?.leads) ? body.leads : [];
      return { leads: items };
    },
    staleTime: 30_000,
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['pipeline-leads'] });
    }, [qc])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const grouped = useMemo(() => {
    const map: Record<ColumnKey, PipelineLead[]> = {
      'New': [],
      'Contacted': [],
      'Qualified': [],
      'Proposal Sent': [],
      'Won/Lost': [],
    };
    for (const l of data?.leads ?? []) {
      const col = bucketFor(l.status);
      map[col].push(l);
    }
    // Sort each column by score then recency.
    for (const k of Object.keys(map) as ColumnKey[]) {
      map[k].sort((a, b) => {
        const sa = a.score ?? 0;
        const sb = b.score ?? 0;
        if (sb !== sa) return sb - sa;
        return new Date(b.created_at ?? b.post_date ?? 0).getTime() -
               new Date(a.created_at ?? a.post_date ?? 0).getTime();
      });
    }
    return map;
  }, [data]);

  const onLongPressCard = useCallback(
    (lead: PipelineLead) => {
      haptic.medium();
      Alert.alert(
        lead.name ?? 'Lead',
        'Move to status',
        [
          { text: 'New',           onPress: () => statusMut.mutate({ id: lead.id, status: 'New' }) },
          { text: 'Contacted',     onPress: () => statusMut.mutate({ id: lead.id, status: 'Contacted' }) },
          { text: 'Qualified',     onPress: () => statusMut.mutate({ id: lead.id, status: 'Qualified' }) },
          { text: 'Proposal Sent', onPress: () => statusMut.mutate({ id: lead.id, status: 'Proposal Sent' }) },
          { text: 'Won',           onPress: () => statusMut.mutate({ id: lead.id, status: 'Won' }) },
          { text: 'Lost', style: 'destructive', onPress: () => statusMut.mutate({ id: lead.id, status: 'Lost' }) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    },
    [statusMut]
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <KanbanIcon size={20} color={palette.text} strokeWidth={2} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text
            style={[
              styles.headerTitle,
              { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
            ]}
          >
            Pipeline
          </Text>
          <Text style={[styles.headerSubtitle, { color: palette.muted }]}>
            Drag-free kanban — long-press a card to move it
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {COLUMNS.map((col) => {
            const items = grouped[col.key];
            const hasBuyer = items.some((l) => l.intent_label === 'BUYER_PROJECT');
            return (
              <View
                key={col.key}
                style={[
                  styles.column,
                  {
                    width: COLUMN_WIDTH,
                    backgroundColor: palette.card,
                    borderColor: palette.border,
                    borderRadius: radius,
                  },
                ]}
              >
                <View style={styles.columnHeader}>
                  <Text
                    style={[
                      styles.columnTitle,
                      { color: palette.text, fontFamily: 'Inter_700Bold' },
                    ]}
                  >
                    {col.label}
                  </Text>
                  <Text style={[styles.columnCount, { color: palette.muted }]}>
                    {items.length}
                  </Text>
                  {hasBuyer ? (
                    <View
                      style={[styles.buyerDot, { backgroundColor: palette.primary }]}
                    />
                  ) : null}
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.cardsList}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor={palette.primary}
                      colors={[palette.primary]}
                    />
                  }
                >
                  {items.length === 0 ? (
                    <View style={styles.emptyCol}>
                      <Text
                        style={{
                          color: palette.muted,
                          fontSize: 12,
                          textAlign: 'center',
                          fontFamily: 'Inter_400Regular',
                        }}
                      >
                        No leads here yet.
                      </Text>
                    </View>
                  ) : (
                    items.map((lead) => (
                      <Card
                        key={lead.id}
                        lead={lead}
                        palette={palette}
                        radius={radius}
                        onLongPress={() => onLongPressCard(lead)}
                      />
                    ))
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function Card({
  lead,
  palette,
  radius,
  onLongPress,
}: {
  lead: PipelineLead;
  palette: any;
  radius: number;
  onLongPress: () => void;
}) {
  const score = lead.score ?? 0;
  const high = score >= 8;
  const date = lead.post_date ?? lead.created_at ?? null;

  return (
    <Pressable
      onPress={() => router.push(`/lead/${lead.id}` as any)}
      onLongPress={onLongPress}
      delayLongPress={300}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? palette.bg : palette.card,
          borderColor: palette.border,
          borderRadius: radius - 4,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Text
          style={[styles.cardName, { color: palette.text, fontFamily: 'Inter_700Bold' }]}
          numberOfLines={1}
        >
          {lead.name ?? 'Unknown lead'}
        </Text>
        <View
          style={[
            styles.scoreChip,
            {
              backgroundColor: high ? palette.primary : palette.bg,
              borderColor: high ? palette.primary : palette.border,
              borderWidth: high ? 0 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <Text
            style={{
              color: high ? palette.primaryFg : palette.text,
              fontSize: 11,
              fontFamily: 'Inter_700Bold',
            }}
          >
            {score.toFixed(0)}
          </Text>
        </View>
      </View>

      {lead.company ? (
        <Text
          style={[
            styles.cardCompany,
            { color: palette.muted, fontFamily: 'Inter_400Regular' },
          ]}
          numberOfLines={1}
        >
          {lead.company}
        </Text>
      ) : null}

      <View style={styles.cardFoot}>
        {lead.intent_label === 'BUYER_PROJECT' ? (
          <View
            style={[
              styles.intentChip,
              { backgroundColor: palette.primary + '14', borderColor: palette.primary + '40' },
            ]}
          >
            <Text
              style={{
                color: palette.primary,
                fontSize: 10,
                fontFamily: 'Inter_700Bold',
                letterSpacing: 0.4,
              }}
            >
              BUYER
            </Text>
          </View>
        ) : null}
        {date ? (
          <Text style={[styles.cardDate, { color: palette.muted }]}>{daysAgo(date)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    gap: 10,
  },
  column: {
    marginRight: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 8,
    flex: 1,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  columnCount: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  buyerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  cardsList: {
    gap: 8,
    paddingBottom: 80,
  },
  emptyCol: {
    paddingVertical: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  card: {
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
  },
  cardCompany: {
    fontSize: 12,
  },
  cardFoot: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreChip: {
    minWidth: 26,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intentChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
});
