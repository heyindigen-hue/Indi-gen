import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = { score: number };

function getBadgeColor(score: number, palette: { success: string; warning: string; destructive: string }): string {
  if (score >= 7.5) return palette.success;
  if (score >= 5) return palette.warning;
  return palette.destructive;
}

export function ScoreBadge({ score }: Props) {
  const { palette } = useTheme();
  const color = getBadgeColor(score, palette);
  return (
    <View
      style={{
        backgroundColor: color + '28',
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color,
          fontSize: 11,
          fontWeight: '700',
          fontFamily: 'Inter_700Bold',
          letterSpacing: 0.3,
        }}
      >
        {score % 1 === 0 ? score.toFixed(0) : score.toFixed(1)}
      </Text>
    </View>
  );
}
