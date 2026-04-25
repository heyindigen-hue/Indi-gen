import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type Prefs = {
  push: boolean;
  email: boolean;
  whatsapp: boolean;
  events: {
    lead: boolean;
    reply: boolean;
    scrape: boolean;
    low_tokens: boolean;
    trial: boolean;
  };
};

const DEFAULT_PREFS: Prefs = {
  push: true, email: true, whatsapp: false,
  events: { lead: true, reply: true, scrape: true, low_tokens: true, trial: true },
};

export default function NotificationsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);

  useEffect(() => {
    api.get('/me/notification-prefs')
      .then((r) => setPrefs({ ...DEFAULT_PREFS, ...r.data, events: { ...DEFAULT_PREFS.events, ...r.data.events } }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = async (patch: Partial<Prefs>) => {
    const merged: Prefs = { ...prefs, ...patch };
    setPrefs(merged);
    setSaving(true);
    try {
      await api.post('/me/notification-prefs', patch);
    } catch {
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const updateEvent = async (key: keyof Prefs['events'], value: boolean) => {
    const newEvents = { ...prefs.events, [key]: value };
    await update({ events: newEvents });
  };

  const sendTestPush = async () => {
    setTestSending(true);
    try {
      await api.post('/me/test-push');
      Alert.alert('Test sent', 'Check your notification tray.');
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.error ?? 'Could not send test notification. Make sure notifications are enabled on your device.');
    } finally {
      setTestSending(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <SectionLabel label="Channels" palette={palette} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ToggleRow label="Push Notifications" value={prefs.push} onChange={(v) => update({ push: v })} palette={palette} />
          <ToggleRow label="Email Notifications" value={prefs.email} onChange={(v) => update({ email: v })} palette={palette} border />
          <ToggleRow label="WhatsApp" value={prefs.whatsapp} onChange={(v) => update({ whatsapp: v })} palette={palette} border isLast />
        </View>

        <SectionLabel label="Events" palette={palette} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <ToggleRow label="New lead found" value={prefs.events.lead} onChange={(v) => updateEvent('lead', v)} palette={palette} />
          <ToggleRow label="Reply received" value={prefs.events.reply} onChange={(v) => updateEvent('reply', v)} palette={palette} border />
          <ToggleRow label="Scrape complete" value={prefs.events.scrape} onChange={(v) => updateEvent('scrape', v)} palette={palette} border />
          <ToggleRow label="Tokens low (< 50)" value={prefs.events.low_tokens} onChange={(v) => updateEvent('low_tokens', v)} palette={palette} border />
          <ToggleRow label="Trial ending" value={prefs.events.trial} onChange={(v) => updateEvent('trial', v)} palette={palette} border isLast />
        </View>

        <Pressable
          onPress={sendTestPush}
          disabled={testSending}
          style={({ pressed }) => [
            styles.testBtn,
            { borderColor: palette.primary },
            pressed && { opacity: 0.7 },
          ]}
        >
          {testSending ? (
            <ActivityIndicator size="small" color={palette.primary} />
          ) : (
            <Text style={[styles.testBtnText, { color: palette.primary }]}>Send Test Notification</Text>
          )}
        </Pressable>

        {saving && (
          <Text style={[styles.saving, { color: palette.muted }]}>Saving...</Text>
        )}
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, palette }: { label: string; palette: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: palette.muted }]}>{label}</Text>
  );
}

function ToggleRow({ label, value, onChange, palette, border, isLast }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
  palette: any; border?: boolean; isLast?: boolean;
}) {
  return (
    <View style={[
      styles.row,
      border && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
    ]}>
      <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.border, true: palette.primary }}
        thumbColor={palette.primaryFg}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4, marginBottom: 8, marginTop: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  testBtn: { marginTop: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  testBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  saving: { textAlign: 'center', marginTop: 12, fontSize: 12, fontFamily: 'Inter_400Regular' },
});
