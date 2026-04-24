import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  children: React.ReactNode;
  padding?: number;
  tight?: boolean;
  style?: ViewStyle;
};

export function Card({ children, padding, tight, style }: Props) {
  const { palette, radius } = useTheme();
  const pad = tight ? 8 : (padding ?? 16);
  return (
    <View
      style={[
        {
          backgroundColor: palette.card,
          borderRadius: radius,
          borderWidth: 0.5,
          borderColor: palette.border,
          padding: pad,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
