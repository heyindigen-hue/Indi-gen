import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { FileTextIcon, ShieldIcon, BookIcon, ChevronRightIcon } from '../../components/icons';

type LegalDoc = {
  id: string;
  title: string;
  icon: React.ReactNode;
  url: string;
};

function buildDocs(iconColor: string): LegalDoc[] {
  const base = 'https://leadgen.indigenservices.com/legal';
  return [
    { id: 'terms', title: 'Terms of Service', icon: <FileTextIcon size={20} color={iconColor} strokeWidth={1.5} />, url: `${base}/terms` },
    { id: 'privacy', title: 'Privacy Policy', icon: <ShieldIcon size={20} color={iconColor} strokeWidth={1.5} />, url: `${base}/privacy` },
    { id: 'dpdp', title: 'DPDP Notice', icon: <BookIcon size={20} color={iconColor} strokeWidth={1.5} />, url: `${base}/dpdp` },
    { id: 'refund', title: 'Refund Policy', icon: <FileTextIcon size={20} color={iconColor} strokeWidth={1.5} />, url: `${base}/refund` },
  ];
}

export default function LegalScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const docs = buildDocs(palette.muted);

  const open = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Legal' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <Text style={[styles.intro, { color: palette.muted }]}>
          View our legal documents below. All documents are available on our website.
        </Text>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {docs.map((doc, i) => (
            <Pressable
              key={doc.id}
              onPress={() => open(doc.url)}
              style={({ pressed }) => [
                styles.row,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={styles.rowIcon}>{doc.icon}</View>
              <Text style={[styles.rowLabel, { color: palette.text }]}>{doc.title}</Text>
              <ChevronRightIcon size={16} color={palette.muted} strokeWidth={1.5} />
            </Pressable>
          ))}
        </View>

        <Text style={[styles.footer, { color: palette.muted }]}>
          Indigen Services Pvt. Ltd.{'\n'}
          All documents comply with Indian law including the Information Technology Act 2000 and the Digital Personal Data Protection Act 2023.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  intro: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
  footer: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, textAlign: 'center' },
});
