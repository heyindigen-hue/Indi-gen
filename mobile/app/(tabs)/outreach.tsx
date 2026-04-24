import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkIcon, SendIcon, SparkleIcon } from '../../components/icons';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { Avatar } from '../../components/ui/Avatar';

type OutreachTab = 'pending' | 'sent' | 'replied';

type OutreachItem = {
  id: string;
  leadId: string;
  leadName: string;
  leadAvatar?: string;
  channel: 'whatsapp' | 'email' | 'linkedin';
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied';
  sentAt?: string;
  preview?: string;
};

function formatRelativeDate(iso: string): string {
  const now = Date.now();
  const date = new Date(iso).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TABS: { key: OutreachTab; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'sent', label: 'Sent' },
  { key: 'replied', label: 'Replied' },
];

const STATUS_COLORS: Record<OutreachItem['status'], string> = {
  draft: 'muted',
  sent: 'blue',
  delivered: 'purple',
  opened: 'orange',
  replied: 'green',
};

function getStatusBg(status: OutreachItem['status']): string {
  const map: Record<OutreachItem['status'], string> = {
    draft: '#8A8F9830',
    sent: '#4F8BFF30',
    delivered: '#9B59B630',
    opened: '#F2C94C30',
    replied: '#4CB78230',
  };
  return map[status] ?? '#8A8F9830';
}

function getStatusFg(status: OutreachItem['status'], palette: any): string {
  const map: Record<OutreachItem['status'], string> = {
    draft: palette.muted,
    sent: '#4F8BFF',
    delivered: '#9B59B6',
    opened: palette.warning,
    replied: palette.success,
  };
  return map[status] ?? palette.muted;
}

function ChannelBadge({ channel, palette }: { channel: OutreachItem['channel']; palette: any }) {
  const config = {
    whatsapp: { label: 'WA', bg: '#25D36630', fg: '#25D366' },
    email: { label: 'Email', bg: '#4F8BFF30', fg: '#4F8BFF' },
    linkedin: { label: 'LI', bg: '#0A66C230', fg: '#0A66C2' },
  };
  const c = config[channel];
  return (
    <View style={[styles.channelBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.channelBadgeText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

function EmptyState({ tab, palette }: { tab: OutreachTab; palette: any }) {
  const messages: Record<OutreachTab, { icon: React.ReactNode; text: string }> = {
    pending: {
      icon: <BookmarkIcon size={40} color={palette.muted} strokeWidth={1.5} />,
      text: 'No drafts pending. Go save some leads!',
    },
    sent: {
      icon: <SendIcon size={40} color={palette.muted} strokeWidth={1.5} />,
      text: 'No messages sent yet.',
    },
    replied: {
      icon: <SparkleIcon size={40} color={palette.muted} strokeWidth={1.5} />,
      text: 'No replies yet. Keep reaching out!',
    },
  };
  const { icon, text } = messages[tab];
  return (
    <View style={styles.emptyState}>
      {icon}
      <Text style={[styles.emptyText, { color: palette.muted }]}>{text}</Text>
    </View>
  );
}

function OutreachCard({ item, palette, radius }: { item: OutreachItem; palette: any; radius: number }) {
  const statusBg = getStatusBg(item.status);
  const statusFg = getStatusFg(item.status, palette);

  return (
    <Pressable
      onPress={() => router.push(`/lead/${item.leadId}` as any)}
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
      <Avatar uri={item.leadAvatar} name={item.leadName} size={44} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={[styles.cardName, { color: palette.text }]} numberOfLines={1}>
            {item.leadName}
          </Text>
          <ChannelBadge channel={item.channel} palette={palette} />
        </View>
        {item.preview ? (
          <Text style={[styles.cardPreview, { color: palette.muted }]} numberOfLines={1}>
            {item.preview}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusFg }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
          {item.sentAt ? (
            <Text style={[styles.cardDate, { color: palette.muted }]}>
              {formatRelativeDate(item.sentAt)}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function OutreachScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [tab, setTab] = useState<OutreachTab>('pending');

  const { data, isLoading } = useQuery<OutreachItem[]>({
    queryKey: ['outreach', tab],
    queryFn: () =>
      api.get('/leads/outreach', { params: { status: tab } }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['outreach', tab] });
    }, [tab, qc])
  );

  const items = data ?? [];

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Outreach</Text>
      </View>

      {/* Segmented control */}
      <View style={[styles.segmented, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <Pressable
              key={key}
              onPress={() => setTab(key)}
              style={[
                styles.segTab,
                active && { backgroundColor: palette.primary, borderRadius: radius - 4 },
              ]}
            >
              <Text
                style={[
                  styles.segTabText,
                  { color: active ? palette.primaryFg : palette.muted },
                  active && { fontWeight: '700' },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState tab={tab} palette={palette} />}
          renderItem={({ item }) => (
            <OutreachCard item={item} palette={palette} radius={radius} />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  segTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
  },
  segTabText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  cardPreview: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  channelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
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
