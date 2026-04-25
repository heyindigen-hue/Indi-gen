import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Pressable,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../../lib/themeContext';
import { InfoIcon, LinkIcon } from '../../components/icons';

export default function AboutScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();

  const version = Constants.expoConfig?.version ?? '—';
  const buildNumber = Constants.expoConfig?.ios?.buildNumber
    ?? (Constants.expoConfig as any)?.android?.versionCode?.toString()
    ?? '—';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'About' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={styles.logoSection}>
          <View style={[styles.logoBox, { backgroundColor: palette.primary + '15', borderColor: palette.primary + '30' }]}>
            <Text style={[styles.logoText, { color: palette.primary }]}>IG</Text>
          </View>
          <Text style={[styles.appName, { color: palette.text }]}>Indi-gen</Text>
          <Text style={[styles.tagline, { color: palette.muted }]}>Find your next client on LinkedIn</Text>
          <View style={[styles.madeBadge, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '25' }]}>
            <Text style={[styles.madeText, { color: palette.primary }]}>Made in India 🇮🇳</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <InfoRow label="App Version" value={`v${version}`} palette={palette} />
          <InfoRow label="Build Number" value={buildNumber} palette={palette} border />
          <InfoRow label="Legal Entity" value="Indigen Services Pvt. Ltd." palette={palette} border />
          <InfoRow label="GSTIN" value="27XXXXXXXXXXXXXXX" palette={palette} border />
          <InfoRow label="Registered Office" value="Mumbai, Maharashtra, India" palette={palette} border isLast />
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <LinkRow label="Website" url="https://indigenservices.com" palette={palette} />
          <LinkRow label="Privacy Policy" url="https://leadgen.indigenservices.com/legal/privacy" palette={palette} border />
          <LinkRow label="Terms of Service" url="https://leadgen.indigenservices.com/legal/terms" palette={palette} border isLast />
        </View>

        <Text style={[styles.copyright, { color: palette.muted }]}>
          © {new Date().getFullYear()} Indigen Services Pvt. Ltd.{'\n'}All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, palette, border, isLast }: { label: string; value: string; palette: any; border?: boolean; isLast?: boolean }) {
  return (
    <View style={[
      styles.row,
      border && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
    ]}>
      <Text style={[styles.rowLabel, { color: palette.muted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: palette.text }]}>{value}</Text>
    </View>
  );
}

function LinkRow({ label, url, palette, border, isLast }: { label: string; url: string; palette: any; border?: boolean; isLast?: boolean }) {
  return (
    <Pressable
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={({ pressed }) => [
        styles.row,
        border && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
      <LinkIcon size={14} color={palette.primary} strokeWidth={1.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  logoSection: { alignItems: 'center', marginBottom: 28 },
  logoBox: { width: 72, height: 72, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 28, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  appName: { fontSize: 22, fontFamily: 'Inter_700Bold', fontWeight: '700', marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  madeBadge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  madeText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 14, fontFamily: 'Inter_400Regular', maxWidth: 200, textAlign: 'right' },
  copyright: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 8 },
});
