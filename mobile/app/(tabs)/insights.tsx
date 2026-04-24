import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Send,
  MessageSquare,
  Target,
  Calendar,
} from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

type HeatmapDay = { date: string; count: number };

type InsightsData = {
  totalLeadsSaved: number;
  sentThisWeek: number;
  replyRate: number;
  topIcp?: string;
  activityHeatmap: HeatmapDay[];
};

const EMPTY_DATA: InsightsData = {
  totalLeadsSaved: 0,
  sentThisWeek: 0,
  replyRate: 0,
  topIcp: undefined,
  activityHeatmap: Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return { date: d.toISOString().slice(0, 10), count: 0 };
  }),
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getHeatColor(count: number, primary: string, border: string): string {
  if (count === 0) return border;
  if (count <= 2) return primary + '40';
  if (count <= 5) return primary + '80';
  return primary;
}

function getReplyRateColor(rate: number, palette: any): string {
  if (rate > 30) return palette.success;
  if (rate >= 10) return palette.warning;
  return palette.destructive;
}

function KpiCard({
  icon,
  value,
  subtitle,
  valueColor,
  palette,
  radius,
}: {
  icon: React.ReactNode;
  value: string;
  subtitle: string;
  valueColor?: string;
  palette: any;
  radius: number;
}) {
  return (
    <View
      style={[
        styles.kpiCard,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderRadius: radius,
          width: CARD_WIDTH,
        },
      ]}
    >
      <View style={styles.kpiIconRow}>{icon}</View>
      <Text style={[styles.kpiValue, { color: valueColor ?? palette.text }]}>
        {value}
      </Text>
      <Text style={[styles.kpiSubtitle, { color: palette.muted }]}>{subtitle}</Text>
    </View>
  );
}

function ActivityHeatmap({
  data,
  palette,
  radius,
}: {
  data: HeatmapDay[];
  palette: any;
  radius: number;
}) {
  const [pressedDate, setPressedDate] = useState<string | null>(null);

  const days = data.slice(0, 30);

  return (
    <View
      style={[
        styles.heatmapSection,
        { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius },
      ]}
    >
      <View style={styles.heatmapHeader}>
        <Calendar size={16} color={palette.muted} strokeWidth={1.5} />
        <Text style={[styles.heatmapTitle, { color: palette.text }]}>
          Activity (last 30 days)
        </Text>
      </View>

      <View style={styles.dayLabelRow}>
        {DAY_LABELS.map((label, idx) => (
          <Text
            key={idx}
            style={[styles.dayLabel, { color: palette.muted, width: 28, textAlign: 'center' }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.heatGrid}>
        {days.map((day) => (
          <Pressable
            key={day.date}
            onPress={() => {
              setPressedDate(day.date === pressedDate ? null : day.date);
            }}
            style={[
              styles.heatCell,
              {
                backgroundColor: getHeatColor(day.count, palette.primary, palette.border),
                borderRadius: 4,
              },
            ]}
          />
        ))}
      </View>

      {pressedDate ? (
        <Text style={[styles.heatTooltip, { color: palette.muted }]}>
          {pressedDate}
          {' — '}
          {days.find((d) => d.date === pressedDate)?.count ?? 0} actions
        </Text>
      ) : null}
    </View>
  );
}

export default function InsightsScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery<InsightsData>({
    queryKey: ['insights'],
    queryFn: () => api.get('/leads/insights').then((r) => r.data),
    staleTime: 10 * 60 * 1000,
  });

  const d = data ?? EMPTY_DATA;
  const heatmap = d.activityHeatmap?.length ? d.activityHeatmap : EMPTY_DATA.activityHeatmap;
  const replyColor = getReplyRateColor(d.replyRate, palette);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Your KPIs</Text>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.kpiGrid}>
            <KpiCard
              icon={<TrendingUp size={24} color={palette.muted} strokeWidth={1.5} />}
              value={String(d.totalLeadsSaved)}
              subtitle="Total leads saved"
              palette={palette}
              radius={radius}
            />
            <KpiCard
              icon={<Send size={24} color={palette.muted} strokeWidth={1.5} />}
              value={String(d.sentThisWeek)}
              subtitle="Messages sent this week"
              palette={palette}
              radius={radius}
            />
            <KpiCard
              icon={<MessageSquare size={24} color={palette.muted} strokeWidth={1.5} />}
              value={`${d.replyRate}%`}
              subtitle="Reply rate"
              valueColor={replyColor}
              palette={palette}
              radius={radius}
            />
            <KpiCard
              icon={<Target size={24} color={palette.muted} strokeWidth={1.5} />}
              value={d.topIcp ?? '—'}
              subtitle="Top ICP segment"
              palette={palette}
              radius={radius}
            />
          </View>

          <ActivityHeatmap data={heatmap} palette={palette} radius={radius} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  kpiCard: {
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  kpiIconRow: {
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    lineHeight: 34,
  },
  kpiSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  heatmapSection: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  heatmapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heatmapTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  dayLabelRow: {
    flexDirection: 'row',
    gap: 3,
    paddingLeft: 0,
  },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  heatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  heatCell: {
    width: 28,
    height: 28,
  },
  heatTooltip: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
});
