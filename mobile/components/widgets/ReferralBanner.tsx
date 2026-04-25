import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type ReferralInfo = { code: string; earned_tokens?: number };

type Props = {
  reward?: number;
  onAction?: (action: string) => void;
};

export default function ReferralBanner({ reward = 50, onAction }: Props) {
  const { palette, radius } = useTheme();
  const [copied, setCopied] = useState(false);

  const { data } = useQuery<ReferralInfo>({
    queryKey: ['referral-code'],
    queryFn: async () => {
      const res = await api.get<ReferralInfo>('/referral/code');
      return res.data;
    },
    staleTime: 3_600_000,
  });

  const code = data?.code ?? 'EARN50';

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    onAction?.('copy_referral');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={{
        backgroundColor: '#FFF7ED',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: '#FED7AA',
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 28 }}>🎁</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#92400E', fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          Invite friends, earn {reward} tokens
        </Text>
        <Text style={{ color: '#B45309', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 }}>
          They get {reward} too — everyone wins
        </Text>
        <TouchableOpacity
          onPress={handleCopy}
          activeOpacity={0.8}
          style={{
            marginTop: 10,
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: '#FFFBEB',
            borderWidth: 1,
            borderColor: '#FCD34D',
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 5,
            gap: 6,
          }}
        >
          <Text style={{ color: '#92400E', fontSize: 13, fontFamily: 'Inter_600SemiBold', letterSpacing: 1 }}>
            {code}
          </Text>
          <Text style={{ fontSize: 11, color: '#B45309' }}>{copied ? '✓ Copied' : '📋'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
