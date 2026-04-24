import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  label: string;
  active?: boolean;
  color?: string;
  onPress?: () => void;
};

export function Chip({ label, active, color, onPress }: Props) {
  const { palette, radius } = useTheme();
  const bg = active ? (color ?? palette.primary) : palette.card;
  const fg = active ? (color ? '#fff' : palette.primaryFg) : palette.muted;
  const border = active ? (color ?? palette.primary) : palette.border;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        backgroundColor: bg,
        borderRadius: radius / 2,
        borderWidth: 0.5,
        borderColor: border,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color: fg,
          fontSize: 11,
          fontWeight: '500',
          fontFamily: 'Inter_500Medium',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
