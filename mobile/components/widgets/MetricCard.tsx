import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  label?: string;
  value?: string | number;
  delta?: string;
  onAction?: (action: string) => void;
};

export default function MetricCard({ label = '', value = 0, delta }: Props) {
  const { palette, radius } = useTheme();
  const isPositive = delta?.startsWith('+');
  return (
    <View style={{
      backgroundColor: palette.card,
      borderRadius: radius,
      borderWidth: 0.5,
      borderColor: palette.border,
      padding: 16,
    }}>
      <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 6 }}>
        {label}
      </Text>
      <Text style={{ color: palette.text, fontSize: 24, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
        {value}
      </Text>
      {delta && (
        <Text style={{ color: isPositive ? palette.success : palette.destructive, fontSize: 12, marginTop: 4 }}>
          {delta}
        </Text>
      )}
    </View>
  );
}
