import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChevronRightIcon } from '../icons';
import { useTheme } from '../../lib/themeContext';
import { haptic } from '../../lib/haptics';

type ContactRowProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
  onLongPress?: () => void;
};

export default function ContactRow({
  icon,
  label,
  value,
  onPress,
  onLongPress,
}: ContactRowProps) {
  const { palette, radius } = useTheme();
  const [copied, setCopied] = useState(false);

  const handleLongPress = () => {
    haptic.success();
    setCopied(true);
    onLongPress?.();
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? palette.border : palette.card,
          borderRadius: radius / 1.5,
          borderColor: palette.border,
        },
      ]}
      onPress={onPress}
      onLongPress={handleLongPress}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: palette.bg }]}>
        <View style={{ opacity: 0.7 }}>{icon}</View>
      </View>

      {/* Label + value */}
      <View style={styles.content}>
        <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
        <Text style={[styles.value, { color: copied ? palette.success : palette.text }]} numberOfLines={1}>
          {copied ? 'Copied!' : value}
        </Text>
      </View>

      {/* Arrow */}
      <ChevronRightIcon size={16} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
});
