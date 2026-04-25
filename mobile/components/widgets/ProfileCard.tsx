import React from 'react';
import { View, Text, Image, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type UserProfile = {
  name?: string;
  email?: string;
  avatar_url?: string;
  plan?: string;
  token_balance?: number;
};

type Props = {
  showAvatar?: boolean;
  showPlan?: boolean;
  showTokens?: boolean;
};

export default function ProfileCard({ showAvatar = true, showPlan = true, showTokens = true }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile-card'],
    queryFn: async () => {
      const res = await api.get<UserProfile>('/me');
      return res.data;
    },
    staleTime: 120_000,
  });

  const initials = (data?.name ?? 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {showAvatar && (
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: palette.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {data?.avatar_url ? (
            <Image
              source={{ uri: data.avatar_url }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <Text style={{ color: palette.primary, fontWeight: '700', fontSize: 16 }}>
              {isLoading ? '…' : initials}
            </Text>
          )}
        </View>
      )}

      <View style={{ flex: 1 }}>
        {isLoading ? (
          <ActivityIndicator size="small" color={palette.primary} />
        ) : (
          <>
            <Text style={{ color: palette.text, fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
              {data?.name ?? 'Your Name'}
            </Text>
            {showPlan && data?.plan ? (
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 3,
                  backgroundColor: palette.primary + '18',
                  borderRadius: 4,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: palette.primary, fontSize: 10, fontFamily: 'Inter_500Medium', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {data.plan}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {showTokens && !isLoading && data?.token_balance !== undefined && (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: palette.primary, fontSize: 18, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: -0.5 }}>
            {data.token_balance.toLocaleString()}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 10, fontFamily: 'Inter_400Regular' }}>tokens</Text>
        </View>
      )}
    </View>
  );
}
