import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type ActivityEvent = {
  id: string;
  type: string;
  description: string;
  created_at: string;
};

type Props = {
  limit?: number;
};

const EVENT_ICONS: Record<string, string> = {
  scrape: '🔍',
  lead_saved: '✅',
  outreach_sent: '💌',
  reply_received: '📩',
  tokens_used: '🪙',
  login: '👤',
  default: '📌',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function ActivityFeed({ limit = 10 }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<ActivityEvent[]>({
    queryKey: ['activity-feed', limit],
    queryFn: async () => {
      const res = await api.get<ActivityEvent[]>(`/activity?limit=${limit}`);
      return res.data;
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  const events = data ?? [];

  if (!events.length) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>No recent activity</Text>
      </View>
    );
  }

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
      <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          Recent Activity
        </Text>
      </View>
      {events.map((ev, i) => (
        <View
          key={ev.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderTopWidth: i === 0 ? 0.5 : 0,
            borderTopColor: palette.border,
            backgroundColor: i % 2 === 0 ? 'transparent' : palette.bg + '60',
          }}
        >
          <Text style={{ fontSize: 16, width: 24, textAlign: 'center' }}>
            {EVENT_ICONS[ev.type] ?? EVENT_ICONS.default}
          </Text>
          <Text
            style={{ flex: 1, color: palette.text, fontSize: 13, fontFamily: 'Inter_400Regular' }}
            numberOfLines={1}
          >
            {ev.description}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', flexShrink: 0 }}>
            {timeAgo(ev.created_at)}
          </Text>
        </View>
      ))}
    </View>
  );
}
