import React from 'react';
import { View } from 'react-native';

type Props = { size?: number; onAction?: (action: string) => void };

export default function Spacer({ size = 16 }: Props) {
  return <View style={{ height: size }} />;
}
