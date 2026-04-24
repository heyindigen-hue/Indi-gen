import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  balance?: number;
  showTopUp?: boolean;
  onAction?: (action: string) => void;
};

export default function TokenBalance({ balance = 0, showTopUp = false, onAction }: Props) {
  const { palette, radius } = useTheme();
  return (
    <View style={{
      backgroundColor: palette.card,
      borderRadius: radius,
      borderWidth: 0.5,
      borderColor: palette.border,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <View>
        <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular' }}>
          Token Balance
        </Text>
        <Text style={{ color: palette.text, fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
          {balance.toLocaleString()}
        </Text>
      </View>
      {showTopUp && (
        <TouchableOpacity
          onPress={() => onAction?.('top_up')}
          style={{
            backgroundColor: palette.primary,
            borderRadius: radius / 2,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: palette.primaryFg, fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
            Top up
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
