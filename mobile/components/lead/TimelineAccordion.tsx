import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';

type OutreachEntry = {
  id: string;
  channel: string;
  status: string;
  sentAt: string;
  preview?: string;
};

type TimelineAccordionProps = {
  leadId: string;
};

const STATUS_COLORS: Record<string, string> = {
  sent: 'muted',
  delivered: 'primary',
  opened: 'warning',
  replied: 'success',
};

const CHANNEL_EMOJI: Record<string, string> = {
  whatsapp: '💬',
  email: '✉️',
  linkedin: '🔗',
};

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

type StatusPillProps = {
  status: string;
};

function StatusPill({ status }: StatusPillProps) {
  const { palette } = useTheme();

  const colorKey = STATUS_COLORS[status] ?? 'muted';
  const colorValue = (palette as Record<string, string>)[colorKey] ?? palette.muted;

  return (
    <View style={[styles.pill, { backgroundColor: colorValue + '28', borderColor: colorValue + '50' }]}>
      <Text style={[styles.pillText, { color: colorValue }]}>{status}</Text>
    </View>
  );
}

type EntryItemProps = {
  entry: OutreachEntry;
  isLast: boolean;
};

function EntryItem({ entry, isLast }: EntryItemProps) {
  const { palette, radius } = useTheme();

  return (
    <>
      <View style={styles.entryRow}>
        {/* Channel indicator */}
        <Text style={styles.channelEmoji}>
          {CHANNEL_EMOJI[entry.channel] ?? '•'}
        </Text>

        {/* Preview */}
        <Text
          style={[styles.preview, { color: palette.muted }]}
          numberOfLines={2}
        >
          {entry.preview ?? 'No preview available'}
        </Text>

        {/* Right side */}
        <View style={styles.entryMeta}>
          <StatusPill status={entry.status} />
          <Text style={[styles.dateText, { color: palette.muted }]}>
            {formatDate(entry.sentAt)}
          </Text>
        </View>
      </View>

      {!isLast && (
        <View style={[styles.divider, { backgroundColor: palette.border }]} />
      )}
    </>
  );
}

export default function TimelineAccordion({ leadId }: TimelineAccordionProps) {
  const { palette, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const chevronAnim = useRef(new Animated.Value(0)).current;

  const { data: entries = [], isLoading } = useQuery<OutreachEntry[]>({
    queryKey: ['lead', leadId, 'outreach'],
    queryFn: async () => {
      const res = await api.get<OutreachEntry[]>(`/api/leads/${leadId}/outreach`);
      return res.data;
    },
  });

  useEffect(() => {
    Animated.spring(chevronAnim, {
      toValue: expanded ? 1 : 0,
      useNativeDriver: true,
      damping: 16,
      stiffness: 200,
    }).start();
  }, [expanded, chevronAnim]);

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const handleToggle = () => {
    haptic.light();
    setExpanded((prev) => !prev);
  };

  return (
    <View style={[styles.container, { backgroundColor: palette.card, borderRadius: radius, borderColor: palette.border }]}>
      {/* Header */}
      <Pressable
        style={({ pressed }) => [
          styles.header,
          { opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={handleToggle}
      >
        <Text style={[styles.headerTitle, { color: palette.text }]}>Timeline</Text>

        {/* Count badge */}
        {entries.length > 0 && (
          <View style={[styles.badge, { backgroundColor: palette.primary + '28' }]}>
            <Text style={[styles.badgeText, { color: palette.primary }]}>{entries.length}</Text>
          </View>
        )}

        <View style={styles.chevronContainer}>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <ChevronDown size={16} color={palette.muted} />
          </Animated.View>
        </View>
      </Pressable>

      {/* Expanded list */}
      {expanded && (
        <View style={[styles.list, { borderTopColor: palette.border }]}>
          {isLoading ? (
            <Text style={[styles.emptyText, { color: palette.muted }]}>Loading...</Text>
          ) : entries.length === 0 ? (
            <Text style={[styles.emptyText, { color: palette.muted }]}>No outreach yet</Text>
          ) : (
            entries.map((entry, index) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                isLast={index === entries.length - 1}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chevronContainer: {
    marginLeft: 'auto',
  },
  list: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  channelEmoji: {
    fontSize: 16,
    lineHeight: 20,
    width: 22,
    textAlign: 'center',
    marginTop: 1,
  },
  preview: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  entryMeta: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 70,
  },
  pill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 11,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 13,
  },
});
