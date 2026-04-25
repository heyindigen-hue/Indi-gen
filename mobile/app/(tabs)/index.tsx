import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { useLeadFeed, useUpdateLeadStatus, Lead } from '../../lib/useLeads';
import { Avatar } from '../../components/ui/Avatar';
import { FlowerMark } from '../../components/icons/FlowerMark';
import LeadHeroCard from '../../components/lead/LeadHeroCard';

type BalanceResponse = { balance: number };
type MeResponse = { name?: string; email?: string };

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export default function Home() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const feedFilters = useMemo(
    () => ({ status: 'New' as const, platform: 'linkedin' as const, sort: 'score' as const, limit: 12 }),
    []
  );
  const { data: feed, isLoading, refetch } = useLeadFeed(feedFilters);
  const leads = feed?.leads ?? [];
  const heroLead = leads[0];

  const savedFilters = useMemo(
    () => ({ status: 'Saved' as const, platform: 'linkedin' as const, sort: 'recent' as const, limit: 8 }),
    []
  );
  const { data: savedFeed } = useLeadFeed(savedFilters);
  const recentSaved = (savedFeed?.leads ?? []).slice(0, 5);

  const { data: me } = useQuery<MeResponse>({
    queryKey: ['auth-me'],
    queryFn: async () => (await api.get<MeResponse>('/auth/me')).data,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: balance } = useQuery<BalanceResponse>({
    queryKey: ['token-balance'],
    queryFn: async () => (await api.get<BalanceResponse>('/billing/tokens/balance')).data,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const statusMut = useUpdateLeadStatus();

  const onSave = useCallback(
    (lead: Lead) => {
      statusMut.mutate({ id: lead.id, status: 'Saved' });
    },
    [statusMut]
  );
  const onSkip = useCallback(
    (lead: Lead) => {
      statusMut.mutate({ id: lead.id, status: 'Skipped' });
    },
    [statusMut]
  );
  const onOpenDetail = useCallback((lead: Lead) => {
    router.push(`/lead/${lead.id}`);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      qc.invalidateQueries({ queryKey: ['leads'] }),
      qc.invalidateQueries({ queryKey: ['token-balance'] }),
    ]);
    setRefreshing(false);
  }, [qc, refetch]);

  const todayCount = feed?.total ?? 0;
  const avgScore = useMemo(() => {
    if (!leads.length) return 0;
    const sum = leads.reduce((acc, l) => acc + (l.score ?? 0), 0);
    return sum / leads.length;
  }, [leads]);
  const savedThisWeek = savedFeed?.total ?? recentSaved.length;

  const userName = (me?.name || me?.email || 'there').split(' ')[0];

  const renderSavedItem: ListRenderItem<Lead> = useCallback(
    ({ item }) => <SavedCard lead={item} onPress={() => onOpenDetail(item)} />,
    [onOpenDetail]
  );

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* sticky header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            backgroundColor: palette.bg,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.flowerBg,
              { backgroundColor: palette.primary + '14', borderColor: palette.primary + '40' },
            ]}
          >
            <FlowerMark size={20} petal={palette.text} core={palette.primary} />
          </View>
          <View>
            <Text style={[styles.greeting, { color: palette.muted, fontFamily: 'Inter_500Medium' }]}>
              {greeting()},
            </Text>
            <Text
              style={[
                styles.userName,
                { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
              ]}
              numberOfLines={1}
            >
              {userName}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/paywall')}
          style={[
            styles.tokenChip,
            { backgroundColor: palette.primary + '14', borderColor: palette.primary + '50' },
          ]}
          hitSlop={6}
        >
          <Text style={{ fontSize: 13 }}>⚡</Text>
          <Text
            style={{
              color: palette.primary,
              fontSize: 13,
              fontFamily: 'Inter_600SemiBold',
              letterSpacing: -0.2,
            }}
          >
            {(balance?.balance ?? 0).toLocaleString()}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
          />
        }
      >
        {/* HERO */}
        <View style={styles.heroSection}>
          {isLoading ? (
            <View
              style={[
                styles.heroLoader,
                { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius * 1.5 },
              ]}
            >
              <ActivityIndicator color={palette.primary} />
              <Text style={{ color: palette.muted, marginTop: 10, fontSize: 13 }}>
                Finding your best leads…
              </Text>
            </View>
          ) : heroLead ? (
            <HeroSwipeArea
              lead={heroLead}
              onSave={() => onSave(heroLead)}
              onSkip={() => onSkip(heroLead)}
              onOpenDetail={() => onOpenDetail(heroLead)}
            />
          ) : (
            <View
              style={[
                styles.heroLoader,
                { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius * 1.5 },
              ]}
            >
              <Text
                style={{
                  color: palette.text,
                  fontSize: 18,
                  fontFamily: 'Fraunces_600SemiBold',
                  marginBottom: 6,
                }}
              >
                All caught up.
              </Text>
              <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
                Pull to refresh — fresh leads land throughout the day.
              </Text>
            </View>
          )}
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <StatCard label="In queue" value={todayCount.toString()} sub="quality leads" palette={palette} radius={radius} onPress={() => router.push('/leads')} />
          <StatCard
            label="Avg score"
            value={avgScore ? avgScore.toFixed(1) : '—'}
            sub="of next 12"
            palette={palette}
            radius={radius}
          />
          <StatCard
            label="Saved"
            value={savedThisWeek.toString()}
            sub="this week"
            palette={palette}
            radius={radius}
            onPress={() => router.push('/explore')}
          />
        </View>

        {/* RECENTLY SAVED */}
        {recentSaved.length > 0 && (
          <View style={styles.savedSection}>
            <View style={styles.sectionHeader}>
              <Text
                style={{
                  color: palette.text,
                  fontSize: 13,
                  fontFamily: 'Inter_600SemiBold',
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                }}
              >
                Recently saved
              </Text>
              <Pressable onPress={() => router.push('/explore')} hitSlop={8}>
                <Text style={{ color: palette.primary, fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                  View all
                </Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={recentSaved}
              keyExtractor={(l) => l.id}
              renderItem={renderSavedItem}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              removeClippedSubviews
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Wraps the hero card so we can prefetch the next lead the moment the active
// one is rendered — that way "Save" feels instant: the next card is already
// hydrated in cache.
function HeroSwipeArea({
  lead,
  onSave,
  onSkip,
  onOpenDetail,
}: {
  lead: Lead;
  onSave: () => void;
  onSkip: () => void;
  onOpenDetail: () => void;
}) {
  const qc = useQueryClient();
  React.useEffect(() => {
    qc.prefetchQuery({
      queryKey: ['lead', lead.id],
      queryFn: async () => (await api.get(`/leads/${lead.id}`)).data,
      staleTime: 60_000,
    });
  }, [lead.id, qc]);

  return (
    <LeadHeroCard
      lead={lead}
      onSave={onSave}
      onSkip={onSkip}
      onOpenDetail={onOpenDetail}
    />
  );
}

function StatCard({
  label,
  value,
  sub,
  palette,
  radius,
  onPress,
}: {
  label: string;
  value: string;
  sub: string;
  palette: any;
  radius: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.statCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderRadius: radius,
        },
      ]}
    >
      <Text style={[styles.statLabel, { color: palette.muted, fontFamily: 'Inter_500Medium' }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]}>
        {value}
      </Text>
      <Text style={[styles.statSub, { color: palette.muted, fontFamily: 'Inter_400Regular' }]}>
        {sub}
      </Text>
    </Pressable>
  );
}

const SavedCard = React.memo(function SavedCard({ lead, onPress }: { lead: Lead; onPress: () => void }) {
  const { palette, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.savedCard,
        { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius },
      ]}
    >
      <Avatar uri={lead.profile_data?.profile_photo_url} name={lead.name} size={36} />
      <Text
        style={{
          color: palette.text,
          fontSize: 13,
          fontFamily: 'Inter_600SemiBold',
          marginTop: 8,
        }}
        numberOfLines={1}
      >
        {lead.name || 'Lead'}
      </Text>
      <Text
        style={{
          color: palette.muted,
          fontSize: 11,
          fontFamily: 'Inter_400Regular',
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {lead.headline || lead.company || ''}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flowerBg: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  tokenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  heroLoader: {
    minHeight: 380,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderWidth: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 18,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderWidth: 0.5,
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statSub: {
    fontSize: 11,
    marginTop: 2,
  },
  savedSection: {
    marginTop: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  savedCard: {
    width: 140,
    padding: 12,
    borderWidth: 0.5,
  },
});
