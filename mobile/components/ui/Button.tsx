import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import { haptic } from '../../lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, style }: Props) {
  const { palette, radius } = useTheme();

  const bg =
    variant === 'primary' ? palette.primary
    : variant === 'secondary' ? palette.card
    : 'transparent';

  const fg =
    variant === 'primary' ? palette.primaryFg
    : variant === 'ghost' ? palette.primary
    : palette.text;

  const handlePress = () => {
    haptic.light();
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius,
          borderWidth: variant === 'secondary' ? 0.5 : 0,
          borderColor: palette.border,
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
          flexDirection: 'row',
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text
          style={{
            color: fg,
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Inter_600SemiBold',
          }}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
