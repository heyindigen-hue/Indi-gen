import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = { onAction?: (action: string) => void };

export default function Divider({ }: Props) {
  const { palette } = useTheme();
  return <View style={{ height: 0.5, backgroundColor: palette.border, marginVertical: 4 }} />;
}
