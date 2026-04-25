import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';
import { StarIcon } from '../../components/icons';

const PRESET_COLORS = [
  '#FF4716', '#6366F1', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#3B82F6',
];

type BrandingData = {
  logo_url?: string;
  accent_color?: string;
  app_name?: string;
  tagline?: string;
};

export default function BrandingScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [data, setData] = useState<BrandingData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPro = ['pro', 'enterprise'].includes((user as any)?.plan ?? '');

  useEffect(() => {
    api.get('/me/branding')
      .then((r) => { if (r.data) setData(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.post('/me/branding', data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not save branding.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <Stack.Screen options={{ title: 'Branding' }} />
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!isPro) {
    return (
      <View style={{ flex: 1, backgroundColor: palette.bg }}>
        <Stack.Screen options={{ title: 'Branding' }} />
        <View style={styles.upgradeWrap}>
          <StarIcon size={48} color={palette.primary} strokeWidth={1.5} />
          <Text style={[styles.upgradeTitle, { color: palette.text }]}>Pro Feature</Text>
          <Text style={[styles.upgradeHint, { color: palette.muted }]}>Upgrade to Pro or Enterprise to customize your white-label branding.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Branding' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <BrandField label="App Display Name" value={data.app_name ?? ''} onChange={(v) => setData((d) => ({ ...d, app_name: v }))} palette={palette} placeholder="My App" />
          <BrandField label="Tagline" value={data.tagline ?? ''} onChange={(v) => setData((d) => ({ ...d, tagline: v }))} palette={palette} placeholder="Your one-line pitch" border />
          <BrandField label="Logo URL" value={data.logo_url ?? ''} onChange={(v) => setData((d) => ({ ...d, logo_url: v }))} palette={palette} placeholder="https://cdn.example.com/logo.png" keyboardType="url" border />
        </View>

        <Text style={[styles.sectionLabel, { color: palette.muted }]}>Accent Color</Text>
        <View style={styles.colorGrid}>
          {PRESET_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => setData((d) => ({ ...d, accent_color: color }))}
              style={[
                styles.colorSwatch,
                { backgroundColor: color },
                data.accent_color === color && styles.colorSwatchSelected,
              ]}
            />
          ))}
        </View>
        <TextInput
          value={data.accent_color ?? ''}
          onChangeText={(v) => setData((d) => ({ ...d, accent_color: v }))}
          placeholder="#FF4716"
          placeholderTextColor={palette.muted}
          style={[styles.hexInput, { color: palette.text, borderColor: palette.border, backgroundColor: palette.card }]}
          autoCapitalize="none"
          maxLength={7}
        />

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? palette.success : palette.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Branding'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function BrandField({ label, value, onChange, palette, placeholder, border, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  palette: any; placeholder?: string; border?: boolean; keyboardType?: any;
}) {
  return (
    <View style={[styles.field, border && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border }]}>
      <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, borderColor: palette.border }]}
        keyboardType={keyboardType}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 20 },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, minHeight: 44 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4, marginBottom: 12 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  colorSwatch: { width: 40, height: 40, borderRadius: 20 },
  colorSwatchSelected: { borderWidth: 3, borderColor: '#fff', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  hexInput: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  upgradeWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  upgradeTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', marginTop: 20, marginBottom: 10 },
  upgradeHint: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22 },
});
