import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { haptic } from '../../lib/haptics';

const ACTION_META: Record<string, { label: string; icon: string }> = {
  scrape: { label: 'Scrape Leads', icon: '🔍' },
  import_manual: { label: 'Import via LinkedIn', icon: '🔗' },
  invite: { label: 'Invite & Earn', icon: '🎁' },
};

type ActionConfig = { label: string; action: string; variant?: 'primary' | 'secondary' };

type Props = {
  actions?: (string | ActionConfig)[];
  onAction?: (action: string) => void;
};

export default function ActionButtons({ actions = [], onAction }: Props) {
  const { palette, radius } = useTheme();
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleScrape = async () => {
    setLoading('scrape');
    try {
      await api.post('/scrape');
      haptic.success();
      showFeedback('Scraping started…');
    } catch {
      haptic.error();
      showFeedback('Scrape failed — try again');
    } finally {
      setLoading(null);
    }
  };

  const handleImport = () => {
    haptic.light();
    router.push('/webview-linkedin' as any);
  };

  const handleInvite = async () => {
    haptic.light();
    try {
      await Share.share({
        message: 'Check out Indi-gen — AI-powered lead generation for modern founders. Use my link to get started!',
        url: 'https://indigenservices.com/ref',
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const handleAction = async (action: string) => {
    onAction?.(action);
    if (action === 'scrape') await handleScrape();
    else if (action === 'import_manual') handleImport();
    else if (action === 'invite') await handleInvite();
  };

  const normalised: ActionConfig[] = actions.map((a) =>
    typeof a === 'string' ? { label: ACTION_META[a]?.label ?? a, action: a } : a
  );

  if (!normalised.length) return null;

  return (
    <View style={{ gap: 8 }}>
      {feedback && (
        <View
          style={{
            backgroundColor: palette.card,
            borderRadius: radius / 2,
            borderWidth: 0.5,
            borderColor: palette.border,
            paddingHorizontal: 12,
            paddingVertical: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
            {feedback}
          </Text>
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {normalised.map((a) => {
          const isPrimary = a.variant !== 'secondary';
          const isLoading = loading === a.action;
          const meta = ACTION_META[a.action];

          return (
            <TouchableOpacity
              key={a.action}
              onPress={() => handleAction(a.action)}
              disabled={!!loading}
              activeOpacity={0.75}
              style={{
                flex: 1,
                height: 48,
                flexDirection: 'row',
                gap: 6,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isPrimary ? palette.primary : palette.card,
                borderRadius: radius,
                borderWidth: isPrimary ? 0 : 0.5,
                borderColor: palette.border,
                opacity: loading && !isLoading ? 0.5 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={isPrimary ? palette.primaryFg : palette.text} />
              ) : (
                <>
                  {meta?.icon ? (
                    <Text style={{ fontSize: 14 }}>{meta.icon}</Text>
                  ) : null}
                  <Text
                    style={{
                      color: isPrimary ? palette.primaryFg : palette.text,
                      fontSize: 13,
                      fontWeight: '600',
                      fontFamily: 'Inter_600SemiBold',
                    }}
                  >
                    {a.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
