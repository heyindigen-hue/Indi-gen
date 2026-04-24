import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Linking,
  Animated,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';

type DraftChannel = 'whatsapp' | 'email' | 'linkedin';

type Draft = {
  channel: DraftChannel;
  content: string;
};

type DraftEditorProps = {
  leadId: string;
  phone?: string;
  email?: string;
  linkedinUrl?: string;
};

type DraftsResponse = Draft[];

const CHANNELS: { key: DraftChannel; label: string; color: string }[] = [
  { key: 'whatsapp', label: 'WhatsApp', color: '#25D366' },
  { key: 'email', label: 'Email', color: '#4F8BFF' },
  { key: 'linkedin', label: 'LinkedIn', color: '#5568AE' },
];

const STALE_TIME = 24 * 60 * 60 * 1000;

export default function DraftEditor({ leadId, phone, email, linkedinUrl }: DraftEditorProps) {
  const { palette, radius } = useTheme();
  const queryClient = useQueryClient();

  const [selectedChannel, setSelectedChannel] = useState<DraftChannel>('whatsapp');
  const [editedText, setEditedText] = useState('');
  const [textHeight, setTextHeight] = useState(120);

  const tabAnim = useRef(new Animated.Value(0)).current;

  const { data: drafts, isLoading } = useQuery<DraftsResponse>({
    queryKey: ['lead', leadId, 'drafts'],
    queryFn: async () => {
      const res = await api.get<DraftsResponse>(`/api/leads/${leadId}/drafts`);
      return res.data;
    },
    staleTime: STALE_TIME,
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<DraftsResponse>(`/api/leads/${leadId}/drafts`, { force: true });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['lead', leadId, 'drafts'], data);
      haptic.success();
    },
    onError: () => {
      haptic.error();
    },
  });

  // Seed editedText when drafts load or channel changes
  useEffect(() => {
    if (!drafts) return;
    const draft = drafts.find((d) => d.channel === selectedChannel);
    setEditedText(draft?.content ?? '');
  }, [drafts, selectedChannel]);

  // Animate tab indicator
  const channelIndex = CHANNELS.findIndex((c) => c.key === selectedChannel);
  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: channelIndex,
      useNativeDriver: false,
      damping: 16,
      stiffness: 200,
    }).start();
  }, [channelIndex, tabAnim]);

  const handleChannelSelect = (channel: DraftChannel) => {
    haptic.light();
    setSelectedChannel(channel);
  };

  const handleSend = () => {
    haptic.medium();
    const encodedText = encodeURIComponent(editedText);

    switch (selectedChannel) {
      case 'whatsapp': {
        const phoneNum = phone?.replace(/\D/g, '') ?? '';
        Linking.openURL(`whatsapp://send?text=${encodedText}&phone=${phoneNum}`);
        break;
      }
      case 'email':
        Linking.openURL(`mailto:${email ?? ''}?body=${encodedText}`);
        break;
      case 'linkedin':
        Linking.openURL(linkedinUrl ?? 'https://www.linkedin.com');
        break;
    }
  };

  const handleRegenerate = () => {
    haptic.medium();
    regenerateMutation.mutate();
  };

  const activeChannelColor =
    CHANNELS.find((c) => c.key === selectedChannel)?.color ?? palette.primary;

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0%', '33.33%', '66.66%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: palette.card, borderRadius: radius, borderColor: palette.border }]}>
      {/* Segmented control */}
      <View style={[styles.tabBar, { borderBottomColor: palette.border }]}>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: activeChannelColor + '28',
              left: indicatorLeft,
              borderRadius: radius,
            },
          ]}
        />
        {CHANNELS.map((ch) => {
          const isActive = ch.key === selectedChannel;
          return (
            <Pressable
              key={ch.key}
              style={styles.tab}
              onPress={() => handleChannelSelect(ch.key)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: isActive ? ch.color : palette.muted },
                ]}
              >
                {ch.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Text area */}
      <View style={[styles.textAreaContainer, { borderColor: palette.border }]}>
        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={styles.loader} />
        ) : (
          <TextInput
            value={editedText}
            onChangeText={setEditedText}
            multiline
            scrollEnabled={false}
            style={[
              styles.textArea,
              {
                color: palette.text,
                backgroundColor: palette.bg,
                height: Math.max(120, textHeight),
                borderRadius: radius / 2,
              },
            ]}
            placeholderTextColor={palette.muted}
            placeholder="Draft will appear here..."
            onContentSizeChange={(e) => {
              setTextHeight(e.nativeEvent.contentSize.height + 24);
            }}
          />
        )}
      </View>

      {/* Action row */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, { borderColor: palette.border, backgroundColor: palette.card }]}
          onPress={handleRegenerate}
          disabled={regenerateMutation.isPending}
        >
          {regenerateMutation.isPending ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Text style={[styles.actionButtonText, { color: palette.muted }]}>Regenerate</Text>
          )}
        </Pressable>

        <Pressable
          style={[styles.actionButton, { borderColor: palette.border, backgroundColor: palette.card }]}
          onPress={() => {
            haptic.light();
            // expo-clipboard not available; no-op copy
          }}
        >
          <Text style={[styles.actionButtonText, { color: palette.muted }]}>Copy</Text>
        </Pressable>

        <Pressable
          style={[styles.sendButton, { backgroundColor: activeChannelColor, borderRadius: radius / 2 }]}
          onPress={handleSend}
          disabled={!editedText}
        >
          <Text style={[styles.sendButtonText, { color: '#FFFFFF' }]}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    height: 44,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    width: '33.33%',
    top: 4,
    bottom: 4,
    zIndex: 0,
  },
  textAreaContainer: {
    padding: 12,
  },
  loader: {
    height: 120,
  },
  textArea: {
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  sendButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
