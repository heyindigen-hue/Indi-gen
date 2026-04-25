import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type PhraseEntry = { phrase: string; leads_count: number; delta?: number };

type Props = {
  limit?: number;
  onAction?: (action: string, phrase: string) => void;
};

export default function TrendingPhrases({ limit = 5, onAction }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<PhraseEntry[]>({
    queryKey: ['trending-phrases', limit],
    queryFn: async () => {
      const res = await api.get<PhraseEntry[]>(`/stats/trending-phrases?limit=${limit}`);
      return res.data;
    },
    staleTime: 300_000,
  });

  const phrases = data ?? [];

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
      <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: palette.border }}>
        <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          🔥 Trending Phrases
        </Text>
        <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 1 }}>
          Top by lead yield this week
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator color={palette.primary} />
        </View>
      ) : phrases.length === 0 ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
            Run a scrape to see trends
          </Text>
        </View>
      ) : (
        phrases.slice(0, limit).map((p, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onAction?.('select_phrase', p.phrase)}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 14,
              paddingVertical: 11,
              borderTopWidth: 0.5,
              borderTopColor: palette.border,
            }}
          >
            <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_500Medium', width: 16, textAlign: 'right' }}>
              {i + 1}
            </Text>
            <Text
              style={{ flex: 1, color: palette.text, fontSize: 13, fontFamily: 'Inter_400Regular' }}
              numberOfLines={1}
            >
              {p.phrase}
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: palette.success, fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
                +{p.leads_count}
              </Text>
              {p.delta !== undefined && p.delta !== 0 && (
                <Text style={{ color: p.delta > 0 ? palette.success : palette.destructive, fontSize: 10 }}>
                  {p.delta > 0 ? '↑' : '↓'}{Math.abs(p.delta)}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}
