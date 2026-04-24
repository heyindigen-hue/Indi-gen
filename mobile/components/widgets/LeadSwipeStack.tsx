import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  onAction?: (action: string) => void;
};

export default function LeadSwipeStack({ }: Props) {
  const { palette, radius } = useTheme();
  return (
    <View style={{
      backgroundColor: palette.card,
      borderRadius: radius,
      borderWidth: 0.5,
      borderColor: palette.border,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
    }}>
      <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular' }}>
        Swipe stack coming in M3
      </Text>
    </View>
  );
}
