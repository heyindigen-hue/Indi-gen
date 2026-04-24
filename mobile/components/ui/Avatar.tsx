import React from 'react';
import { View, Text, Image } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  name?: string;
  uri?: string;
  size?: number;
};

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((w) => w[0]).join('').toUpperCase();
}

export function Avatar({ name, uri, size = 40 }: Props) {
  const { palette } = useTheme();
  const br = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: br }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: br,
        backgroundColor: palette.primary + '30',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: palette.primary,
          fontSize: size * 0.36,
          fontWeight: '700',
          fontFamily: 'Inter_700Bold',
        }}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}
