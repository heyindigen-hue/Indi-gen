import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { HelpCircleIcon, ChevronDownIcon, ChevronUpIcon, MailIcon, PhoneIcon } from '../../components/icons';

const FAQ = [
  {
    q: 'How are leads found?',
    a: 'We continuously scan LinkedIn for posts that match your search phrases and ideal client profile. Leads are scored by relevance before appearing in your feed.',
  },
  {
    q: 'What are tokens used for?',
    a: 'Tokens are consumed when you view AI-drafted outreach messages, export leads, or trigger manual scrapes. Your plan includes a monthly allocation.',
  },
  {
    q: 'How do I set up LinkedIn outreach?',
    a: 'Go to Settings → Integrations and paste your LinkedIn session cookie. This allows us to send connection requests and messages on your behalf.',
  },
  {
    q: 'Can I export my leads?',
    a: 'Yes. Tap the export icon on the Leads tab to download a CSV, or go to Settings → Data & Privacy to download all your data as JSON.',
  },
  {
    q: 'How do I cancel or change my plan?',
    a: 'Go to Settings → Billing & Plans to change your subscription. Cancellations take effect at the end of the current billing period.',
  },
  {
    q: 'Is my data safe?',
    a: 'All data is encrypted in transit and at rest. We comply with India\'s Digital Personal Data Protection Act 2023. You can request deletion at any time.',
  },
];

export default function HelpScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const version = Constants.expoConfig?.version ?? '—';

  const submitFeedback = async () => {
    if (!feedback.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/me/feedback', { body: feedback.trim(), rating: rating ?? undefined });
      setFeedback('');
      setRating(null);
      Alert.alert('Thanks!', 'Your feedback has been submitted.');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Could not submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Help & Support' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <SectionLabel label="FAQ" palette={palette} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          {FAQ.map((item, i) => (
            <Pressable
              key={i}
              onPress={() => setExpanded(expanded === i ? null : i)}
              style={[styles.faqRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border }]}
            >
              <Text style={[styles.faqQ, { color: palette.text, flex: 1 }]}>{item.q}</Text>
              {expanded === i
                ? <ChevronUpIcon size={16} color={palette.muted} strokeWidth={1.5} />
                : <ChevronDownIcon size={16} color={palette.muted} strokeWidth={1.5} />}
              {expanded === i ? (
                <Text style={[styles.faqA, { color: palette.muted }]}>{item.a}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <SectionLabel label="Contact Support" palette={palette} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@indigenservices.com')}
            style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}
          >
            <MailIcon size={20} color={palette.muted} strokeWidth={1.5} />
            <Text style={[styles.contactText, { color: palette.text }]}>support@indigenservices.com</Text>
          </Pressable>
          <View style={[styles.separator, { backgroundColor: palette.border }]} />
          <Pressable
            onPress={() => Linking.openURL('https://wa.me/919999999999?text=Hi, I need help with Indi-gen app')}
            style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.7 }]}
          >
            <PhoneIcon size={20} color={palette.success} strokeWidth={1.5} />
            <Text style={[styles.contactText, { color: palette.text }]}>WhatsApp Support</Text>
          </Pressable>
        </View>

        <SectionLabel label="Send Feedback" palette={palette} />
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((r) => (
              <Pressable
                key={r}
                onPress={() => setRating(rating === r ? null : r)}
                style={({ pressed }) => [
                  styles.ratingStar,
                  { backgroundColor: r <= (rating ?? 0) ? palette.primary + '20' : palette.bg, borderColor: palette.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.ratingStarText, { color: r <= (rating ?? 0) ? palette.primary : palette.muted }]}>★</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Tell us what you think..."
            placeholderTextColor={palette.muted}
            style={[styles.feedbackInput, { color: palette.text, borderColor: palette.border, backgroundColor: palette.bg }]}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Pressable
            onPress={submitFeedback}
            disabled={!feedback.trim() || submitting}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: palette.primary, opacity: feedback.trim() ? 1 : 0.5 },
              pressed && { opacity: 0.85 },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Feedback</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.version, { color: palette.muted }]}>
          Indi-gen v{version}
        </Text>
      </ScrollView>
    </View>
  );
}

function SectionLabel({ label, palette }: { label: string; palette: any }) {
  return (
    <Text style={[styles.sectionLabel, { color: palette.muted }]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4, marginBottom: 8, marginTop: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 8 },
  faqRow: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  faqQ: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 0, paddingRight: 8 },
  faqA: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20, marginTop: 8, width: '100%' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
  contactText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  separator: { height: StyleSheet.hairlineWidth },
  ratingRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  ratingStar: { width: 44, height: 44, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ratingStarText: { fontSize: 22 },
  feedbackInput: { marginHorizontal: 16, borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 100, marginBottom: 14 },
  submitBtn: { marginHorizontal: 16, marginBottom: 14, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  version: { textAlign: 'center', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 16 },
});
