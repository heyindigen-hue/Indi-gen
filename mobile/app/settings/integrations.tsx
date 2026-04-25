import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { LinkIcon, CheckIcon } from '../../components/icons';

export default function IntegrationsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [cookieInput, setCookieInput] = useState('');
  const [savingLinkedIn, setSavingLinkedIn] = useState(false);
  const [linkedInSaved, setLinkedInSaved] = useState(false);

  const saveLinkedIn = async () => {
    if (!cookieInput.trim()) return;
    setSavingLinkedIn(true);
    try {
      await api.post('/me/integrations/linkedin', { cookie: cookieInput.trim() });
      setLinkedInSaved(true);
      setCookieInput('');
      setTimeout(() => setLinkedInSaved(false), 3000);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to save LinkedIn cookie.');
    } finally {
      setSavingLinkedIn(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Integrations' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.cardHeader}>
            <LinkIcon size={20} color={palette.primary} strokeWidth={1.5} />
            <Text style={[styles.cardTitle, { color: palette.text }]}>LinkedIn</Text>
          </View>
          <Text style={[styles.cardHint, { color: palette.muted }]}>
            Paste your LinkedIn session cookie to enable automated outreach. Open LinkedIn in your browser, copy the <Text style={{ fontFamily: 'Inter_600SemiBold' }}>li_at</Text> cookie value from DevTools → Application → Cookies.
          </Text>
          <TextInput
            value={cookieInput}
            onChangeText={setCookieInput}
            placeholder="AQEDARxxxxxx..."
            placeholderTextColor={palette.muted}
            style={[styles.input, { color: palette.text, borderColor: palette.border, backgroundColor: palette.bg }]}
            multiline
            numberOfLines={4}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={saveLinkedIn}
            disabled={!cookieInput.trim() || savingLinkedIn}
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: linkedInSaved ? palette.success : palette.primary, opacity: cookieInput.trim() ? 1 : 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            {savingLinkedIn ? (
              <ActivityIndicator color="#fff" />
            ) : linkedInSaved ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckIcon size={16} color="#fff" strokeWidth={2} />
                <Text style={styles.saveBtnText}>Saved</Text>
              </View>
            ) : (
              <Text style={styles.saveBtnText}>Save Cookie</Text>
            )}
          </Pressable>
        </View>

        <ComingSoonCard title="Calendar Integration" hint="Connect Google Calendar or Outlook to schedule follow-ups." palette={palette} />
        <ComingSoonCard title="Gmail / Email Sender" hint="Connect Gmail or use Resend to send outreach emails directly." palette={palette} />
        <ComingSoonCard title="Slack Notifications" hint="Get lead alerts and replies in your Slack workspace." palette={palette} />
      </ScrollView>
    </View>
  );
}

function ComingSoonCard({ title, hint, palette }: { title: string; hint: string; palette: any }) {
  return (
    <View style={[styles.card, styles.comingSoon, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.cardTitle, { color: palette.muted }]}>{title}</Text>
      <Text style={[styles.cardHint, { color: palette.muted }]}>{hint}</Text>
      <View style={[styles.badge, { backgroundColor: palette.primary + '15', borderColor: palette.primary + '30' }]}>
        <Text style={[styles.badgeText, { color: palette.primary }]}>Coming Soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 16 },
  comingSoon: { opacity: 0.75 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  cardHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 13, fontFamily: 'Inter_400Regular', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  saveBtn: { paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
