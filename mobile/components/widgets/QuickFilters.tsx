import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  filters?: string[];
  onAction?: (action: string) => void;
};

export default function QuickFilters({ filters = [], onAction }: Props) {
  const { palette, radius } = useTheme();
  const [active, setActive] = useState(0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
      {filters.map((f, i) => {
        const isActive = i === active;
        return (
          <TouchableOpacity
            key={f}
            onPress={() => { setActive(i); onAction?.(`filter:${f}`); }}
            style={{
              backgroundColor: isActive ? palette.primary : palette.card,
              borderRadius: radius / 2,
              borderWidth: 0.5,
              borderColor: isActive ? palette.primary : palette.border,
              paddingHorizontal: 14,
              paddingVertical: 7,
              marginHorizontal: 4,
            }}
          >
            <Text style={{
              color: isActive ? palette.primaryFg : palette.text,
              fontSize: 13,
              fontWeight: isActive ? '600' : '400',
              fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
            }}>
              {f}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
