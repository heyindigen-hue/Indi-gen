import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import { useFilterStore } from '../../store/filters';
import { haptic } from '../../lib/haptics';

type Props = {
  filters?: string[];
  onAction?: (action: string) => void;
};

export default function QuickFilters({ filters = [], onAction }: Props) {
  const { palette, radius } = useTheme();
  const { activeFilter, setFilter } = useFilterStore();

  const handlePress = (f: string) => {
    haptic.light();
    const next = activeFilter === f ? null : f;
    setFilter(next);
    onAction?.(next ? `filter:${next}` : 'filter:clear');
  };

  if (!filters.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
    >
      {filters.map((f) => {
        const isActive = activeFilter === f;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => handlePress(f)}
            activeOpacity={0.75}
            style={{
              backgroundColor: isActive ? palette.primary : palette.card,
              borderRadius: radius / 2,
              borderWidth: 0.5,
              borderColor: isActive ? palette.primary : palette.border,
              paddingHorizontal: 14,
              paddingVertical: 7,
            }}
          >
            <Text
              style={{
                color: isActive ? palette.primaryFg : palette.text,
                fontSize: 13,
                fontWeight: isActive ? '600' : '400',
                fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }}
            >
              {f}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
