import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../lib/themeContext';
import {
  useLead,
  useFullDraftSet,
  useRegenerateDrafts,
  type DraftSet,
  type LeadContact,
} from '../../../lib/useLeads';
import { haptic } from '../../../lib/haptics';
import { ChevronLeftIcon, CopyIcon, SparkleIcon, MailIcon, PhoneIcon, LinkIcon } from '../../../components/icons';

type Channel = 'whatsapp' | 'email' | 'linkedin';

function pickContact(contacts: LeadContact[] = [], type: string): LeadContact | undefined {
  return contacts.find((c) => c.type === type && c.rating === 'verified') ?? contacts.find((c) => c.type === type);
}

function digitsOnly(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export default function LeadDraftsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<Channel>('whatsapp');

  const { data: lead, isLoading: leadLoading } = useLead(id);
  const draftQuery = useFullDraftSet(id, (lead?.drafts_cache as DraftSet) ?? null);
  const regen = useRegenerateDrafts();

  const drafts: DraftSet | undefined = draftQuery.data ?? (lead?.drafts_cache as DraftSet | undefined);
  const fetching = draftQuery.isFetching && !drafts;

  const email = useMemo(() => pickContact(lead?.contacts, 'email'), [lead?.contacts]);
  const phone = useMemo(() => pickContact(lead?.contacts, 'phone'), [lead?.contacts]);
  const linkedinUrl = lead?.linkedin_url ?? null;
  const linkedinUrn = lead?.linkedin_urn ?? null;

  const onCopy = useCallback(async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    haptic.success();
  }, []);

  const onRegenerate = useCallback(() => {
    if (!id || regen.isPending) return;
    haptic.medium();
    regen.mutate(id, {
      onError: () => Alert.alert('Could not regenerate', 'Please try again in a moment.'),
    });
  }, [id, regen]);

  const onOpenInApp = useCallback(
    async (channel: Channel) => {
      if (!drafts) return;
      const text =
        channel === 'whatsapp'
          ? drafts.whatsapp ?? ''
          : channel === 'email'
            ? drafts.email_body ?? ''
            : drafts.linkedin_dm ?? '';
      const subject = drafts.email_subject ?? 'Quick note';
      if (text) await Clipboard.setStringAsync(text);
      haptic.medium();

      if (channel === 'whatsapp') {
        if (!phone?.value) return Alert.alert('No phone on file', 'Enrich the lead to unlock WhatsApp.');
        const num = digitsOnly(phone.value);
        const msg = encodeURIComponent(text);
        Linking.openURL(`whatsapp://send?phone=${num}&text=${msg}`).catch(() =>
          Linking.openURL(`https://wa.me/${num}?text=${msg}`).catch(() => {})
        );
      } else if (channel === 'email') {
        if (!email?.value) return Alert.alert('No email on file', 'Enrich the lead to unlock email.');
        const sub = encodeURIComponent(subject);
        const body = encodeURIComponent(text);
        Linking.openURL(`mailto:${email.value}?subject=${sub}&body=${body}`).catch(() => {});
      } else if (channel === 'linkedin') {
        if (linkedinUrn) {
          Linking.openURL(`linkedin://messaging/compose?recipient=${linkedinUrn}`).catch(() => {
            if (linkedinUrl) Linking.openURL(linkedinUrl).catch(() => {});
          });
        } else if (linkedinUrl) {
          Linking.openURL(linkedinUrl).catch(() => {});
        } else {
          Alert.alert('No LinkedIn link', 'No LinkedIn URL on file for this lead.');
        }
      }
    },
    [drafts, phone, email, linkedinUrl, linkedinUrn]
  );

  if (leadLoading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  if (!lead) {
    return (
      <View style={[styles.center, { backgroundColor: palette.bg }]}>
        <Text style={{ color: palette.muted }}>Lead not found.</Text>
      </View>
    );
  }

  const activeText =
    active === 'whatsapp'
      ? drafts?.whatsapp ?? ''
      : active === 'email'
        ? drafts?.email_body ?? ''
        : drafts?.linkedin_dm ?? '';
  const activeSubject = drafts?.email_subject ?? '';

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 6, borderBottomColor: palette.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} color={palette.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]} numberOfLines={1}>
          AI Message Drafts
        </Text>
        <Pressable
          onPress={onRegenerate}
          hitSlop={12}
          style={styles.iconBtn}
          disabled={regen.isPending}
        >
          {regen.isPending ? (
            <ActivityIndicator color={palette.primary} size="small" />
          ) : (
            <SparkleIcon size={20} color={palette.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.recipient, { color: palette.muted }]}>To</Text>
        <Text style={[styles.recipientName, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]} numberOfLines={1}>
          {lead.name || 'Unknown lead'}
        </Text>
        {lead.headline ? (
          <Text style={[styles.recipientHeadline, { color: palette.muted }]} numberOfLines={2}>
            {lead.headline}
          </Text>
        ) : null}

        <View style={[styles.tabsRow, { borderColor: palette.border }]}>
          {(['whatsapp', 'email', 'linkedin'] as Channel[]).map((ch) => {
            const isActive = ch === active;
            return (
              <Pressable
                key={ch}
                onPress={() => {
                  haptic.light();
                  setActive(ch);
                }}
                style={[
                  styles.tab,
                  isActive && { backgroundColor: palette.primary, borderRadius: radius - 4 },
                ]}
              >
                <Text
                  style={{
                    color: isActive ? palette.primaryFg : palette.muted,
                    fontSize: 13,
                    fontFamily: 'Inter_600SemiBold',
                    textTransform: 'capitalize',
                  }}
                >
                  {ch === 'linkedin' ? 'LinkedIn DM' : ch === 'email' ? 'Email' : 'WhatsApp'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.draftBox, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          {active === 'email' && activeSubject ? (
            <View style={{ marginBottom: 12, borderBottomColor: palette.border, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 10 }}>
              <Text style={[styles.label, { color: palette.muted }]}>SUBJECT</Text>
              <Text style={{ color: palette.text, fontSize: 14, marginTop: 4, fontFamily: 'Inter_600SemiBold' }}>
                {activeSubject}
              </Text>
            </View>
          ) : null}
          {fetching ? (
            <View style={{ padding: 18, alignItems: 'center', gap: 8 }}>
              <ActivityIndicator color={palette.primary} />
              <Text style={{ color: palette.muted, fontSize: 12 }}>Drafting personalised message…</Text>
            </View>
          ) : (
            <Text style={{ color: palette.text, fontSize: 14, lineHeight: 22 }}>
              {activeText || 'No draft yet — try Force regenerate above.'}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => onCopy(active === 'email' && activeSubject ? `${activeSubject}\n\n${activeText}` : activeText)}
            disabled={!activeText}
            style={[styles.actionBtn, { borderColor: palette.border, opacity: activeText ? 1 : 0.5 }]}
          >
            <CopyIcon size={16} color={palette.text} />
            <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>Copy</Text>
          </Pressable>
          <Pressable
            onPress={() => onOpenInApp(active)}
            disabled={!activeText}
            style={[styles.actionBtn, { backgroundColor: palette.primary, borderWidth: 0, flex: 1, opacity: activeText ? 1 : 0.5 }]}
          >
            {active === 'whatsapp' && <PhoneIcon size={16} color={palette.primaryFg} />}
            {active === 'email' && <MailIcon size={16} color={palette.primaryFg} />}
            {active === 'linkedin' && <LinkIcon size={16} color={palette.primaryFg} />}
            <Text style={{ color: palette.primaryFg, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
              Open in {active === 'whatsapp' ? 'WhatsApp' : active === 'email' ? 'Mail' : 'LinkedIn'}
            </Text>
          </Pressable>
        </View>

        {drafts?.cached_at ? (
          <Text style={[styles.cachedNote, { color: palette.muted }]}>
            Cached {new Date(drafts.cached_at).toLocaleString()} · tap ✦ to force regenerate
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  recipient: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    paddingHorizontal: 18,
    marginTop: 6,
  },
  recipientName: { fontSize: 24, paddingHorizontal: 18, marginTop: 4, lineHeight: 28 },
  recipientHeadline: { fontSize: 13, paddingHorizontal: 18, marginTop: 4, lineHeight: 18 },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  draftBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: 0.5,
    minHeight: 120,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  cachedNote: {
    fontSize: 11,
    paddingHorizontal: 18,
    marginTop: 18,
    lineHeight: 16,
  },
});
