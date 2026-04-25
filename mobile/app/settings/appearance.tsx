import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import type { ThemeMode } from '../../lib/theme';
import { palettes } from '../../lib/theme';
import { CheckIcon, SunIcon, MoonIcon } from '../../components/icons';

type Choice = {
  id: ThemeMode;
  label: string;
  description: string;
  swatchBg: string;
  swatchInk: string;
  swatchOrange: string;
};

const CHOICES: Choice[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Cream surfaces, ink type. Default.',
    swatchBg: palettes['warm-light'].bg,
    swatchInk: palettes['warm-light'].text,
    swatchOrange: palettes['warm-light'].primary,
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Ink surfaces, cream type. Easy on the eyes at night.',
    swatchBg: palettes['warm-dark'].bg,
    swatchInk: palettes['warm-dark'].text,
    swatchOrange: palettes['warm-dark'].primary,
  },
  {
    id: 'system',
    label: 'Match system',
    description: 'Follow the OS appearance setting.',
    swatchBg: palettes['warm-light'].bg,
    swatchInk: palettes['warm-dark'].bg,
    swatchOrange: palettes['warm-light'].primary,
  },
];

export default function AppearanceScreen() {
  const { palette, mode, setMode, effectiveScheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Appearance' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: palette.muted }]}>
          Choose how the app looks. Your choice is remembered on this device.
        </Text>

        <View style={styles.cards}>
          {CHOICES.map((c) => (
            <ThemeCard
              key={c.id}
              choice={c}
              selected={mode === c.id}
              palette={palette}
              onPress={() => setMode(c.id)}
            />
          ))}
        </View>

        <View style={[styles.previewCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.previewHead}>
            <PreviewIcon mode={effectiveScheme} color={palette.text} />
            <Text style={[styles.previewTitle, { color: palette.text }]}>Live preview</Text>
          </View>
          <Text style={[styles.previewBody, { color: palette.muted }]}>
            Wake up to better leads. Indigen is hand-rolling the storefront for a Shopify Plus brand
            in Nashik right now.
          </Text>
          <View style={styles.previewRow}>
            <View style={[styles.previewChip, { backgroundColor: palette.primary }]}>
              <Text style={[styles.previewChipText, { color: palette.primaryFg }]}>Score 9</Text>
            </View>
            <View style={[styles.previewChipOutline, { borderColor: palette.border }]}>
              <Text style={[styles.previewChipOutlineText, { color: palette.text }]}>D2C</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function PreviewIcon({ mode, color }: { mode: 'light' | 'dark'; color: string }) {
  return mode === 'dark' ? (
    <MoonIcon size={18} color={color} strokeWidth={1.6} />
  ) : (
    <SunIcon size={18} color={color} strokeWidth={1.6} />
  );
}

function ThemeCard({
  choice,
  selected,
  palette,
  onPress,
}: {
  choice: Choice;
  selected: boolean;
  palette: any;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: selected ? palette.primary : palette.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={[styles.swatch, { backgroundColor: choice.swatchBg }]}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            backgroundColor: choice.swatchInk,
            opacity: choice.id === 'system' ? 1 : 0,
            width: '50%',
          }}
        />
        <View style={[styles.swatchDot, { backgroundColor: choice.swatchOrange }]} />
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardLabel, { color: palette.text }]}>{choice.label}</Text>
        <Text style={[styles.cardDesc, { color: palette.muted }]}>{choice.description}</Text>
      </View>
      {selected ? (
        <View style={[styles.cardCheck, { backgroundColor: palette.primary }]}>
          <CheckIcon size={14} color={palette.primaryFg} strokeWidth={2} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  intro: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 18,
    paddingHorizontal: 4,
    lineHeight: 19,
  },
  cards: { gap: 10, marginBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 14,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    zIndex: 2,
  },
  cardText: { flex: 1, gap: 3 },
  cardLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  cardDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  cardCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  previewBody: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19 },
  previewRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  previewChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  previewChipText: { fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 0.4 },
  previewChipOutline: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  previewChipOutlineText: { fontSize: 11, fontFamily: 'Inter_500Medium', fontWeight: '500' },
});
