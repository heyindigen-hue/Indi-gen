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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { ChipInput } from '../../components/onboarding/ChipInput';
import { PlusIcon, XIcon } from '../../components/icons';

const IDEAL_CLIENT_OPTIONS = [
  'D2C Brand', 'SaaS', 'SME', 'Healthcare', 'Logistics', 'Fintech',
  'Ecommerce', 'AgriTech', 'EduTech', 'RealEstate', 'Manufacturing', 'Startup',
];
const INDUSTRY_OPTIONS = [
  'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing',
  'Education', 'Real Estate', 'Media', 'Logistics', 'Agriculture',
];
const GEOGRAPHY_OPTIONS = [
  'India', 'USA', 'UK', 'Canada', 'Australia',
  'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'International',
];
const BUDGET_SIGNAL_OPTIONS = [
  'International clients', '$5K-$10K budget', '$10K-$50K budget',
  'USD pricing', 'INR pricing', 'Equity + cash', 'Funded startup', 'Series A+', 'Bootstrap',
];

type CompanyData = {
  name: string;
  tagline: string;
  website: string;
  description: string;
  ideal_clients: string[];
  industries: string[];
  geography: string[];
  search_phrases: string[];
  budget_signals: string[];
};

const EMPTY: CompanyData = {
  name: '', tagline: '', website: '', description: '',
  ideal_clients: [], industries: [], geography: [], search_phrases: [], budget_signals: [],
};

export default function CompanyScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CompanyData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [phraseInput, setPhraseInput] = useState('');

  useEffect(() => {
    api.get('/me/company-profile')
      .then((r) => setData({ ...EMPTY, ...r.data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof CompanyData>(key: K, value: CompanyData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleChip = (key: 'ideal_clients' | 'industries' | 'geography' | 'budget_signals', opt: string) => {
    const arr = data[key];
    const next = arr.includes(opt) ? arr.filter((v) => v !== opt) : [...arr, opt];
    set(key, next);
  };

  const addPhrase = () => {
    const v = phraseInput.trim();
    if (!v || data.search_phrases.includes(v)) return;
    set('search_phrases', [...data.search_phrases, v]);
    setPhraseInput('');
  };

  const removePhrase = (p: string) => set('search_phrases', data.search_phrases.filter((v) => v !== p));

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.post('/me/company-profile', data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const retriggerScrape = async () => {
    try {
      await api.post('/scrape/trigger', { force: true });
      Alert.alert('Scrape triggered', "We're re-scanning with your updated phrases. New leads will appear shortly.");
    } catch {
      Alert.alert('Error', 'Could not trigger scrape. Try again later.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <Stack.Screen options={{ title: 'Company Info' }} />
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Company Info' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <FormField label="Company Name" value={data.name} onChange={(v) => set('name', v)} palette={palette} placeholder="Acme Corp" />
          <FormField label="Tagline" value={data.tagline} onChange={(v) => set('tagline', v)} palette={palette} placeholder="What you do in one line" border />
          <FormField label="Website" value={data.website} onChange={(v) => set('website', v)} palette={palette} placeholder="https://example.com" keyboardType="url" border />
          <FormField label="Description" value={data.description} onChange={(v) => set('description', v)} palette={palette} placeholder="Describe your business..." multiline border />
        </View>

        <SectionLabel label="Ideal Clients" palette={palette} />
        <View style={[styles.chipCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ChipInput options={IDEAL_CLIENT_OPTIONS} selected={data.ideal_clients} onToggle={(o) => toggleChip('ideal_clients', o)} />
        </View>

        <SectionLabel label="Industries" palette={palette} />
        <View style={[styles.chipCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ChipInput options={INDUSTRY_OPTIONS} selected={data.industries} onToggle={(o) => toggleChip('industries', o)} />
        </View>

        <SectionLabel label="Geography" palette={palette} />
        <View style={[styles.chipCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ChipInput options={GEOGRAPHY_OPTIONS} selected={data.geography} onToggle={(o) => toggleChip('geography', o)} />
        </View>

        <SectionLabel label="Search Phrases" palette={palette} />
        <View style={[styles.chipCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.phraseInputRow}>
            <TextInput
              value={phraseInput}
              onChangeText={setPhraseInput}
              placeholder="e.g. looking for developer"
              placeholderTextColor={palette.muted}
              style={[styles.phraseInput, { color: palette.text, borderColor: palette.border }]}
              onSubmitEditing={addPhrase}
              returnKeyType="done"
            />
            <Pressable onPress={addPhrase} style={[styles.addBtn, { backgroundColor: palette.primary }]}>
              <PlusIcon size={16} color="#fff" strokeWidth={2} />
            </Pressable>
          </View>
          <View style={styles.phraseList}>
            {data.search_phrases.map((p) => (
              <View key={p} style={[styles.phraseChip, { backgroundColor: palette.primary + '15', borderColor: palette.primary + '30' }]}>
                <Text style={[styles.phraseChipText, { color: palette.primary }]}>{p}</Text>
                <Pressable onPress={() => removePhrase(p)}>
                  <XIcon size={12} color={palette.primary} strokeWidth={2.5} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <SectionLabel label="Budget Signals" palette={palette} />
        <View style={[styles.chipCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ChipInput options={BUDGET_SIGNAL_OPTIONS} selected={data.budget_signals} onToggle={(o) => toggleChip('budget_signals', o)} />
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: saved ? palette.success : palette.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>{saved ? 'Saved' : 'Save Changes'}</Text>
          )}
        </Pressable>

        <Pressable
          onPress={retriggerScrape}
          style={({ pressed }) => [
            styles.secondaryBtn,
            { borderColor: palette.primary },
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.secondaryBtnText, { color: palette.primary }]}>Re-trigger scrape with updated phrases</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FormField({ label, value, onChange, palette, placeholder, border, multiline, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void;
  palette: any; placeholder?: string; border?: boolean; multiline?: boolean; keyboardType?: any;
}) {
  return (
    <View style={[styles.field, border && styles.fieldBorder, border && { borderTopColor: palette.border }]}>
      <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={[styles.input, { color: palette.text, borderColor: palette.border }, multiline && { minHeight: 80, textAlignVertical: 'top' }]}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'sentences'}
      />
    </View>
  );
}

function SectionLabel({ label, palette }: { label: string; palette: any }) {
  return <Text style={[styles.sectionLabel, { color: palette.muted }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 16 },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  fieldLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, minHeight: 44 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4, marginBottom: 6, marginTop: 20 },
  chipCard: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 4 },
  phraseInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  phraseInput: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 42 },
  addBtn: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  phraseList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  phraseChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  phraseChipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 12 },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#fff' },
  secondaryBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
