import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import { CheckIcon } from '../icons';

interface ChipInputProps {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}

export function ChipInput({ options, selected, onToggle }: ChipInputProps) {
  const { palette, radius } = useTheme();
  return (
    <View style={s.wrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={[
              s.chip,
              {
                backgroundColor: active ? palette.primary + '22' : palette.card,
                borderColor: active ? palette.primary : palette.border,
                borderRadius: radius / 2,
              },
            ]}
            activeOpacity={0.8}
          >
            {active && <CheckIcon size={12} color={palette.primary} strokeWidth={2.5} />}
            <Text style={[s.chipText, { color: active ? palette.primary : palette.text }]}>
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
