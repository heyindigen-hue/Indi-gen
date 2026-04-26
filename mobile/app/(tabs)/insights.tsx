import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';
import { ArrowUpIcon } from '../../components/icons';

type RangeKey = '7d' | '30d' | '90d';

type Analytics = {
  range: RangeKey;
  leads_added: number;
  leads_added_delta_pct: number;
  intent_breakdown: Record<string, number>;
  icp_breakdown: { icp_type: string; count: number }[];
  funnel: {
    scraped: number;
    kept_after_filter: number;
    enriched: number;
    outreach_sent: number;
    replied: number;
    meeting_booked: number;
  };
  outreach_by_channel: { whatsapp: number; email: number; linkedin_dm: number };
  score_distribution: { bucket: string; count: number }[];
  phrase_performance: { phrase: string; runs: number; leads_kept: number; yield_pct: number }[];
};

const INTENT_ORDER: { key: string; label: string; isPrimary?: boolean }[] = [
  { key: 'BUYER_PROJECT', label: 'Buyer project', isPrimary: true },
  { key: 'INFORMATIONAL', label: 'Informational' },
  { key: 'JOB_POSTING_FULLTIME', label: 'Job posting' },
  { key: 'SELF_PROMO', label: 'Self promo' },
  { key: 'JOB_SEEKER', label: 'Job seeker' },
  { key: 'UNCLEAR', label: 'Unclear' },
];

const FUNNEL_ROWS: { key: keyof Analytics['funnel']; label: string }[] = [
  { key: 'scraped',           label: 'Scraped' },
  { key: 'kept_after_filter', label: 'Kept after filter' },
  { key: 'enriched',          label: 'Enriched' },
  { key: 'outreach_sent',     label: 'Outreach sent' },
  { key: 'replied',           label: 'Replied' },
  { key: 'meeting_booked',    label: 'Meeting booked' },
];

export default function StatsScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [range, setRange] = useState<RangeKey>('7d');

  const { data, isLoading, refetch, isRefetching } = useQuery<Analytics>({
    queryKey: ['analytics', range],
    queryFn: async () => {
      const res = await api.get<Analytics>(`/me/analytics`, { params: { range } });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
          ]}
        >
          Stats
        </Text>
        <Text style={[styles.headerSubtitle, { color: palette.muted }]}>
          Pipeline performance — last {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
        </Text>
      </View>

      <View style={[styles.rangeRow, { borderColor: palette.border, backgroundColor: palette.card, borderRadius: radius - 4 }]}>
        {(['7d', '30d', '90d'] as RangeKey[]).map((k) => {
          const active = range === k;
          return (
            <Pressable
              key={k}
              onPress={() => {
                haptic.light();
                setRange(k);
              }}
              style={[
                styles.rangePill,
                {
                  backgroundColor: active ? palette.primary : 'transparent',
                  borderRadius: radius - 6,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? palette.primaryFg : palette.muted,
                  fontSize: 13,
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {k.toUpperCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          }
        >
          <LeadsAddedCard data={data} palette={palette} radius={radius} />
          <IntentBreakdownCard data={data} palette={palette} radius={radius} />
          <FunnelCard data={data} palette={palette} radius={radius} />
          <IcpBreakdownCard data={data} palette={palette} radius={radius} />
          <ChannelMixCard data={data} palette={palette} radius={radius} />
          <ScoreDistributionCard data={data} palette={palette} radius={radius} />
          <TopPhrasesCard data={data} palette={palette} radius={radius} />
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <Text style={{ color: palette.muted }}>Could not load analytics.</Text>
        </View>
      )}
    </View>
  );
}

function SectionHeading({ title, palette }: { title: string; palette: any }) {
  return (
    <Text style={[styles.sectionHeading, { color: palette.muted }]}>{title.toUpperCase()}</Text>
  );
}

function Card({
  children,
  palette,
  radius,
}: {
  children: React.ReactNode;
  palette: any;
  radius: number;
}) {
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius },
      ]}
    >
      {children}
    </View>
  );
}

function LeadsAddedCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  const positive = data.leads_added_delta_pct >= 0;
  const deltaColor = positive ? palette.success : palette.destructive;
  const deltaSign = positive ? '+' : '';
  return (
    <View>
      <SectionHeading title="Leads added" palette={palette} />
      <Card palette={palette} radius={radius}>
        <View style={styles.bigRow}>
          <Text style={[styles.bigNum, { color: palette.text, fontFamily: 'Inter_700Bold' }]}>
            {data.leads_added}
          </Text>
          <View style={styles.deltaRow}>
            <ArrowUpIcon
              size={14}
              color={deltaColor}
              strokeWidth={2.5}
            />
            <Text style={{ color: deltaColor, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
              {deltaSign}
              {data.leads_added_delta_pct}% vs prev
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

function IntentBreakdownCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  const total = INTENT_ORDER.reduce(
    (sum, i) => sum + (data.intent_breakdown[i.key] ?? 0),
    0
  );
  return (
    <View>
      <SectionHeading title="Intent breakdown" palette={palette} />
      <Card palette={palette} radius={radius}>
        {total === 0 ? (
          <Text style={{ color: palette.muted, fontSize: 13 }}>
            No leads in this window yet.
          </Text>
        ) : (
          <>
            <View style={styles.stackedBarRow}>
              {INTENT_ORDER.map((i) => {
                const n = data.intent_breakdown[i.key] ?? 0;
                if (n === 0) return null;
                const pct = (n / total) * 100;
                return (
                  <View
                    key={i.key}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: i.isPrimary ? palette.primary : palette.border,
                      height: 14,
                    }}
                  />
                );
              })}
            </View>
            <View style={styles.intentLegend}>
              {INTENT_ORDER.map((i) => {
                const n = data.intent_breakdown[i.key] ?? 0;
                return (
                  <View key={i.key} style={styles.legendRow}>
                    <View
                      style={[
                        styles.legendSwatch,
                        {
                          backgroundColor: i.isPrimary ? palette.primary : palette.border,
                        },
                      ]}
                    />
                    <Text style={[styles.legendLabel, { color: palette.muted }]} numberOfLines={1}>
                      {i.label}
                    </Text>
                    <Text style={[styles.legendCount, { color: palette.text }]}>{n}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </Card>
    </View>
  );
}

function FunnelCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  return (
    <View>
      <SectionHeading title="Funnel" palette={palette} />
      <Card palette={palette} radius={radius}>
        {FUNNEL_ROWS.map((row, idx) => {
          const cur = data.funnel[row.key] ?? 0;
          const prev = idx === 0 ? cur : data.funnel[FUNNEL_ROWS[idx - 1].key] ?? 0;
          const pct = prev > 0 && idx > 0 ? Math.round((cur / prev) * 100) : null;
          return (
            <View
              key={row.key}
              style={[
                styles.funnelRow,
                idx < FUNNEL_ROWS.length - 1 && {
                  borderBottomColor: palette.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <Text style={[styles.funnelLabel, { color: palette.text }]}>{row.label}</Text>
              <View style={styles.funnelRight}>
                <Text style={[styles.funnelCount, { color: palette.text, fontFamily: 'Inter_700Bold' }]}>
                  {cur}
                </Text>
                {pct !== null ? (
                  <Text style={[styles.funnelPct, { color: palette.muted }]}>
                    {pct}% of prev
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}

function IcpBreakdownCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  if (!data.icp_breakdown.length) return null;
  return (
    <View>
      <SectionHeading title="ICP breakdown" palette={palette} />
      <Card palette={palette} radius={radius}>
        <View style={styles.icpChipStrip}>
          {data.icp_breakdown.map((row) => (
            <View
              key={row.icp_type}
              style={[
                styles.icpChip,
                { borderColor: palette.border, backgroundColor: palette.bg },
              ]}
            >
              <Text style={{ color: palette.text, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                {row.icp_type}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
                {row.count}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </View>
  );
}

function ChannelMixCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  const channels: { key: 'whatsapp' | 'email' | 'linkedin_dm'; label: string }[] = [
    { key: 'whatsapp', label: 'WhatsApp' },
    { key: 'email', label: 'Email' },
    { key: 'linkedin_dm', label: 'LinkedIn DM' },
  ];
  return (
    <View>
      <SectionHeading title="Outreach by channel" palette={palette} />
      <View style={styles.channelGrid}>
        {channels.map((c) => (
          <View
            key={c.key}
            style={[
              styles.channelCard,
              { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius },
            ]}
          >
            <Text style={[styles.channelNum, { color: palette.text, fontFamily: 'Inter_700Bold' }]}>
              {data.outreach_by_channel[c.key] ?? 0}
            </Text>
            <Text style={[styles.channelLabel, { color: palette.muted }]}>{c.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ScoreDistributionCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  const max = useMemo(
    () => Math.max(1, ...data.score_distribution.map((s) => s.count)),
    [data]
  );
  return (
    <View>
      <SectionHeading title="Score distribution" palette={palette} />
      <Card palette={palette} radius={radius}>
        {data.score_distribution.map((s, idx) => (
          <View key={s.bucket} style={styles.scoreRow}>
            <Text style={[styles.scoreBucket, { color: palette.text }]}>{s.bucket}</Text>
            <View
              style={[styles.scoreBar, { backgroundColor: palette.border }]}
            >
              <View
                style={{
                  width: `${(s.count / max) * 100}%`,
                  backgroundColor: idx === 0 ? palette.primary : palette.text,
                  height: '100%',
                  borderRadius: 4,
                }}
              />
            </View>
            <Text style={[styles.scoreCount, { color: palette.muted }]}>{s.count}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function TopPhrasesCard({
  data,
  palette,
  radius,
}: {
  data: Analytics;
  palette: any;
  radius: number;
}) {
  if (!data.phrase_performance.length) return null;
  return (
    <View>
      <SectionHeading title="Top phrases (by yield)" palette={palette} />
      <Card palette={palette} radius={radius}>
        {data.phrase_performance.map((p, idx) => (
          <View
            key={`${idx}-${p.phrase}`}
            style={[
              styles.phraseRow,
              idx < data.phrase_performance.length - 1 && {
                borderBottomColor: palette.border,
                borderBottomWidth: StyleSheet.hairlineWidth,
              },
            ]}
          >
            <View style={styles.phraseRank}>
              <Text style={[styles.phraseRankText, { color: palette.muted }]}>
                {idx + 1}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.phraseText, { color: palette.text }]} numberOfLines={2}>
                {p.phrase}
              </Text>
              <Text style={[styles.phraseMeta, { color: palette.muted }]}>
                {p.runs} runs · {p.leads_kept} leads · {p.yield_pct}% yield
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
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

  rangeRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rangePill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 4,
  },

  sectionHeading: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.7,
    paddingHorizontal: 4,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },

  bigRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 16,
  },
  bigNum: {
    fontSize: 38,
    fontWeight: '700',
    lineHeight: 44,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },

  stackedBarRow: {
    flexDirection: 'row',
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  intentLegend: { gap: 8 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Inter_500Medium',
  },
  legendCount: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  funnelLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  funnelRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  funnelCount: { fontSize: 16 },
  funnelPct: { fontSize: 11, fontFamily: 'Inter_500Medium' },

  icpChipStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  icpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },

  channelGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  channelCard: {
    flex: 1,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  channelNum: {
    fontSize: 22,
    lineHeight: 26,
  },
  channelLabel: {
    fontSize: 11.5,
    marginTop: 4,
    fontFamily: 'Inter_500Medium',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  scoreBucket: {
    width: 36,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  scoreBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreCount: {
    width: 28,
    textAlign: 'right',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },

  phraseRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'flex-start',
    gap: 10,
  },
  phraseRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phraseRankText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  phraseText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    lineHeight: 17,
  },
  phraseMeta: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
});
