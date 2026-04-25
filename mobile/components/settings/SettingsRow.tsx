import React from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { ChevronRightIcon } from '../icons';
import { useTheme } from '../../lib/themeContext';

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  labelColor?: string;
  isLast?: boolean;
  right?: React.ReactNode;
  loading?: boolean;
  destructive?: boolean;
}

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = false,
  labelColor,
  isLast = false,
  right,
  loading = false,
  destructive = false,
}: SettingsRowProps) {
  const { palette } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || loading}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.label,
          { color: labelColor ?? (destructive ? palette.destructive : palette.text) },
          { flex: 1 },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={palette.muted} style={{ marginRight: 4 }} />
      ) : value ? (
        <Text style={[styles.value, { color: palette.muted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right ?? null}
      {showChevron && !loading ? (
        <ChevronRightIcon size={16} color={palette.muted} strokeWidth={1.5} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  icon: {
    marginRight: 12,
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    maxWidth: 160,
    textAlign: 'right',
    marginRight: 6,
  },
});
