import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Action = { label: string; action: string; variant?: 'primary' | 'secondary' };

type Props = {
  actions?: Action[];
  onAction?: (action: string) => void;
};

export default function ActionButtons({ actions = [], onAction }: Props) {
  const { palette, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {actions.map((a) => {
        const isPrimary = a.variant !== 'secondary';
        return (
          <TouchableOpacity
            key={a.action}
            onPress={() => onAction?.(a.action)}
            style={{
              flex: 1,
              backgroundColor: isPrimary ? palette.primary : palette.card,
              borderRadius: radius,
              borderWidth: isPrimary ? 0 : 0.5,
              borderColor: palette.border,
              paddingVertical: 12,
              alignItems: 'center',
            }}
          >
            <Text style={{
              color: isPrimary ? palette.primaryFg : palette.text,
              fontSize: 14,
              fontWeight: '600',
              fontFamily: 'Inter_600SemiBold',
            }}>
              {a.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
