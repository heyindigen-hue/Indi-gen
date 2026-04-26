import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../../lib/themeContext';
import {
  useLead,
  useLeadDrafts,
  useUpdateLeadStatus,
  useEnrichLead,
  useMarkUnqualified,
  useTranslate,
  Lead,
  LeadContact,
} from '../../../lib/useLeads';
import { haptic } from '../../../lib/haptics';
import { Avatar } from '../../../components/ui/Avatar';
import { ProfileInsights } from '../../../components/lead/ProfileInsights';
import {
  ChevronLeftIcon,
  MailIcon,
  PhoneIcon,
  LinkIcon,
  CopyIcon,
  SparkleIcon,
  CheckIcon,
  XIcon,
} from '../../../components/icons';

type Channel = 'whatsapp' | 'email' | 'linkedin';

function pickContact(contacts: LeadContact[] = [], type: string): LeadContact | undefined {
  const verified = contacts.find((c) => c.type === type && c.rating === 'verified');
  return verified ?? contacts.find((c) => c.type === type);
}

function formatPhoneForWhatsapp(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeChannel, setActiveChannel] = useState<Channel>('whatsapp');

  const { data: lead, isLoading } = useLead(id);
  const draftsQuery = useLeadDrafts(id, lead?.drafts_cache as any);
  const statusMut = useUpdateLeadStatus();
  const enrichMut = useEnrichLead();
  const unqualMut = useMarkUnqualified();
  const translateMut = useTranslate();
  const [translatedPost, setTranslatedPost] = useState<string | null>(null);
  const [showTranslated, setShowTranslated] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!id) return;
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['lead', id] });
    setRefreshing(false);
  }, [id, qc]);

  const email = useMemo(() => pickContact(lead?.contacts, 'email'), [lead?.contacts]);
  const phone = useMemo(() => pickContact(lead?.contacts, 'phone'), [lead?.contacts]);
  const linkedin = useMemo(() => pickContact(lead?.contacts, 'linkedin'), [lead?.contacts]);
  const linkedinUrl = linkedin?.value ?? lead?.linkedin_url ?? null;

  const drafts = draftsQuery.data;
  const draftsLoading = draftsQuery.isFetching && !drafts;

  const onCopy = useCallback(async (text: string) => {
    await Clipboard.setStringAsync(text);
    haptic.success();
  }, []);

  const onMarkContacted = useCallback(() => {
    if (!id) return;
    statusMut.mutate({ id, status: 'Contacted' });
    haptic.success();
    router.back();
  }, [id, statusMut]);

  const onSave = useCallback(() => {
    if (!id) return;
    statusMut.mutate({ id, status: 'Saved' });
    haptic.success();
    router.back();
  }, [id, statusMut]);

  const onMarkUnqualified = useCallback(() => {
    if (!id) return;
    Alert.alert(
      'Mark unqualified?',
      'This trains the filter and archives the lead.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            haptic.medium();
            unqualMut.mutate(
              { id },
              {
                onSuccess: () => router.back(),
                onError: () => Alert.alert('Could not mark unqualified', 'Try again in a moment.'),
              }
            );
          },
        },
      ]
    );
  }, [id, unqualMut]);

  const onTranslate = useCallback(() => {
    if (!lead?.post_text) return;
    if (showTranslated && translatedPost) {
      setShowTranslated(false);
      return;
    }
    if (translatedPost) {
      setShowTranslated(true);
      return;
    }
    haptic.light();
    translateMut.mutate(lead.post_text, {
      onSuccess: (translated) => {
        setTranslatedPost(translated);
        setShowTranslated(true);
      },
      onError: () => Alert.alert('Translate failed', 'Try again later.'),
    });
  }, [lead?.post_text, translatedPost, showTranslated, translateMut]);

  const onShareWA = useCallback(() => {
    if (!lead) return;
    haptic.medium();
    const lines: string[] = [];
    if (lead.name) lines.push(`*${lead.name}*`);
    if (lead.headline) lines.push(lead.headline);
    if (lead.company) lines.push(`@ ${lead.company}`);
    if (typeof lead.score === 'number') lines.push(`Score: ${lead.score.toFixed(0)}/10`);
    if (lead.linkedin_url) lines.push(lead.linkedin_url);
    if (lead.post_url) lines.push(lead.post_url);
    const text = encodeURIComponent(lines.join('\n'));
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() =>
      Linking.openURL(`https://wa.me/?text=${text}`).catch(() => {})
    );
  }, [lead]);

  const onOpenDrafts = useCallback(() => {
    if (!id) return;
    haptic.medium();
    router.push(`/lead/${id}/drafts` as any);
  }, [id]);

  const onOpenPitch = useCallback(() => {
    if (!id) return;
    haptic.medium();
    router.push(`/lead/${id}/pitch` as any);
  }, [id]);

  const onSendChannel = useCallback(
    async (channel: Channel) => {
      const text = channel === 'whatsapp' ? drafts?.whatsapp : channel === 'email' ? drafts?.email : drafts?.linkedin;
      if (text) await Clipboard.setStringAsync(text);
      haptic.medium();

      if (channel === 'whatsapp' && phone?.value) {
        const num = formatPhoneForWhatsapp(phone.value);
        const msg = encodeURIComponent(text || '');
        Linking.openURL(`whatsapp://send?phone=${num}&text=${msg}`).catch(() =>
          Linking.openURL(`https://wa.me/${num}?text=${msg}`)
        );
      } else if (channel === 'email' && email?.value) {
        const subject = encodeURIComponent('Quick note');
        const body = encodeURIComponent(text || '');
        Linking.openURL(`mailto:${email.value}?subject=${subject}&body=${body}`);
      } else if (channel === 'linkedin' && linkedinUrl) {
        Linking.openURL(linkedinUrl);
      } else if (text) {
        // No destination — drop the draft on the clipboard so the user can paste it manually.
        await Clipboard.setStringAsync(text);
      }
    },
    [drafts, phone, email, linkedinUrl]
  );

  if (isLoading) {
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

  const score = lead.score ?? 0;
  const scoreColor = score >= 8 ? palette.success : score >= 6 ? palette.warning : palette.muted;
  const photo = lead.profile_data?.profile_photo_url;

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      {/* Sticky header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 6,
            backgroundColor: palette.bg,
            borderBottomColor: palette.border,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            haptic.light();
            router.back();
          }}
          hitSlop={12}
          style={styles.headerBtn}
        >
          <ChevronLeftIcon size={22} color={palette.text} />
        </Pressable>
        <Text
          style={[styles.headerTitle, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]}
          numberOfLines={1}
        >
          {lead.name || 'Lead'}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.primary} />
        }
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Avatar uri={photo} name={lead.name} size={88} />
          <Text
            style={[styles.heroName, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]}
            numberOfLines={2}
          >
            {lead.name || 'Unknown lead'}
          </Text>
          {!!lead.headline && (
            <Text style={[styles.heroHeadline, { color: palette.muted }]} numberOfLines={3}>
              {lead.headline}
            </Text>
          )}
          {!!lead.company && (
            <View
              style={[
                styles.companyChip,
                { backgroundColor: palette.primary + '12', borderColor: palette.primary + '40' },
              ]}
            >
              <Text style={{ color: palette.primary, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                {lead.company}
              </Text>
            </View>
          )}
        </View>

        {/* Score + intent */}
        <View style={styles.scoreRow}>
          <View
            style={[
              styles.scoreCircle,
              { borderColor: scoreColor, backgroundColor: scoreColor + '14' },
            ]}
          >
            <Text style={[styles.scoreNum, { color: scoreColor }]}>{score.toFixed(0)}</Text>
            <Text style={[styles.scoreOf, { color: scoreColor }]}>/10</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text
              style={{
                color: palette.text,
                fontSize: 13,
                fontFamily: 'Inter_600SemiBold',
                textTransform: 'uppercase',
                letterSpacing: 0.6,
              }}
            >
              Match score
            </Text>
            {lead.intent_label ? (
              <Text style={{ color: palette.muted, fontSize: 13, marginTop: 4, lineHeight: 18 }}>
                Intent: <Text style={{ color: palette.text }}>{lead.intent_label.replace(/_/g, ' ')}</Text>
                {lead.intent_confidence != null && (
                  <Text style={{ color: palette.muted }}> · {Math.round((lead.intent_confidence ?? 0) * 100)}% confident</Text>
                )}
              </Text>
            ) : null}
            {lead.notes ? (
              <Text style={{ color: palette.muted, fontSize: 13, marginTop: 4, lineHeight: 18 }} numberOfLines={3}>
                {lead.notes}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Verified contact section — the hero of this screen */}
        <SectionTitle palette={palette}>Verified contact</SectionTitle>
        <View style={[styles.contactBox, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          {email || phone || linkedinUrl ? (
            <>
              {email && (
                <ContactRow
                  icon={<MailIcon size={18} color={palette.muted} />}
                  label="Email"
                  value={email.value}
                  verified={email.rating === 'verified'}
                  onPress={() => Linking.openURL(`mailto:${email.value}`)}
                  onCopy={() => onCopy(email.value)}
                />
              )}
              {phone && (
                <ContactRow
                  icon={<PhoneIcon size={18} color={palette.muted} />}
                  label="Phone"
                  value={phone.value}
                  verified={phone.rating === 'verified'}
                  onPress={() =>
                    Linking.openURL(`whatsapp://send?phone=${formatPhoneForWhatsapp(phone.value)}`).catch(() =>
                      Linking.openURL(`tel:${phone.value}`)
                    )
                  }
                  onCopy={() => onCopy(phone.value)}
                  ctaLabel={phone ? 'WA' : undefined}
                />
              )}
              {linkedinUrl && (
                <ContactRow
                  icon={<LinkIcon size={18} color={palette.muted} />}
                  label="LinkedIn"
                  value={linkedinUrl.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '')}
                  verified={false}
                  onPress={() => Linking.openURL(linkedinUrl)}
                  onCopy={() => onCopy(linkedinUrl)}
                />
              )}
            </>
          ) : (
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                No verified contacts yet.
              </Text>
              <Text style={{ color: palette.muted, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
                Spend 1 token to enrich this lead via SignalHire and unlock email + phone.
              </Text>
              <Pressable
                onPress={() => {
                  if (!id) return;
                  haptic.medium();
                  enrichMut.mutate(id);
                }}
                disabled={enrichMut.isPending || lead.enrichment_status === 'queued'}
                style={[
                  styles.enrichBtn,
                  {
                    backgroundColor: palette.primary,
                    opacity: enrichMut.isPending || lead.enrichment_status === 'queued' ? 0.6 : 1,
                  },
                ]}
              >
                <SparkleIcon size={16} color={palette.primaryFg} />
                <Text style={{ color: palette.primaryFg, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
                  {lead.enrichment_status === 'queued' ? 'Enriching…' : 'Enrich · 1 credit'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Action row — mark unqualified / translate / share-on-whatsapp */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={onMarkUnqualified}
            disabled={unqualMut.isPending}
            style={[
              styles.actionPill,
              { borderColor: palette.muted, opacity: unqualMut.isPending ? 0.5 : 1 },
            ]}
          >
            <XIcon size={14} color={palette.muted} />
            <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
              Unqualified
            </Text>
          </Pressable>
          {lead.post_text ? (
            <Pressable
              onPress={onTranslate}
              disabled={translateMut.isPending}
              style={[
                styles.actionPill,
                { borderColor: palette.border, opacity: translateMut.isPending ? 0.5 : 1 },
              ]}
            >
              <Text
                style={{
                  color: palette.text,
                  fontSize: 10,
                  fontFamily: 'Inter_700Bold',
                  letterSpacing: 1,
                }}
              >
                {translateMut.isPending ? '...' : showTranslated ? 'ORIGINAL' : 'TRANSLATE'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onShareWA}
            style={[styles.actionPill, { backgroundColor: '#25D366', borderColor: '#25D366' }]}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
              Share on WhatsApp
            </Text>
          </Pressable>
        </View>

        {/* Profile Insights — only renders if lead.profile_data has content */}
        {lead.profile_data ? <ProfileInsights profile={lead.profile_data as any} /> : null}

        {/* Post text */}
        {lead.post_text ? (
          <>
            <SectionTitle palette={palette}>The post</SectionTitle>
            <View style={[styles.postBox, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
              <Text style={{ color: palette.text, fontSize: 14, lineHeight: 21 }}>
                {showTranslated && translatedPost ? translatedPost : lead.post_text}
              </Text>
              {lead.post_url ? (
                <Pressable
                  onPress={() => Linking.openURL(lead.post_url!)}
                  style={{ marginTop: 12 }}
                  hitSlop={6}
                >
                  <Text style={{ color: palette.primary, fontSize: 13, fontFamily: 'Inter_600SemiBold' }}>
                    Open original ↗
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </>
        ) : null}

        {/* AI Drafts + Generate proposal entry — twin CTAs */}
        <View style={{ paddingHorizontal: 16, marginTop: 24, flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={onOpenDrafts}
            style={[styles.draftsCta, { backgroundColor: palette.primary, flex: 1 }]}
          >
            <SparkleIcon size={16} color={palette.primaryFg} />
            <Text style={{ color: palette.primaryFg, fontSize: 13.5, fontFamily: 'Inter_700Bold' }}>
              AI Drafts
            </Text>
          </Pressable>
          <Pressable
            onPress={onOpenPitch}
            style={[
              styles.draftsCta,
              {
                backgroundColor: 'transparent',
                borderColor: palette.text,
                borderWidth: 1.5,
                flex: 1,
              },
            ]}
          >
            <SparkleIcon size={16} color={palette.text} />
            <Text style={{ color: palette.text, fontSize: 13.5, fontFamily: 'Inter_700Bold' }}>
              Generate proposal
            </Text>
          </Pressable>
        </View>

        {/* Drafts */}
        <SectionTitle palette={palette}>AI drafts</SectionTitle>
        <View style={styles.channelTabs}>
          {(['whatsapp', 'email', 'linkedin'] as Channel[]).map((ch) => {
            const active = ch === activeChannel;
            return (
              <Pressable
                key={ch}
                onPress={() => {
                  haptic.light();
                  setActiveChannel(ch);
                }}
                style={[
                  styles.channelPill,
                  {
                    backgroundColor: active ? palette.primary : 'transparent',
                    borderColor: active ? palette.primary : palette.border,
                  },
                ]}
              >
                <Text
                  style={{
                    color: active ? palette.primaryFg : palette.muted,
                    fontSize: 12,
                    fontFamily: 'Inter_600SemiBold',
                    textTransform: 'capitalize',
                  }}
                >
                  {ch}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={[styles.draftBox, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
          {draftsLoading ? (
            <View style={{ padding: 8 }}>
              <ActivityIndicator color={palette.primary} />
              <Text style={{ color: palette.muted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
                Drafting…
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ color: palette.text, fontSize: 14, lineHeight: 22 }}>
                {drafts?.[activeChannel] || 'No draft yet — tap below to generate.'}
              </Text>
              <View style={styles.draftActions}>
                <Pressable
                  onPress={() => {
                    const text = drafts?.[activeChannel];
                    if (text) onCopy(text);
                  }}
                  style={[styles.draftActionBtn, { borderColor: palette.border }]}
                  hitSlop={6}
                >
                  <CopyIcon size={14} color={palette.muted} />
                  <Text style={{ color: palette.muted, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Copy</Text>
                </Pressable>
                <Pressable
                  onPress={() => onSendChannel(activeChannel)}
                  style={[styles.draftActionBtn, { backgroundColor: palette.primary, borderWidth: 0 }]}
                  hitSlop={6}
                >
                  <Text style={{ color: palette.primaryFg, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
                    Send via {activeChannel}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom CTAs */}
      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 10,
            borderTopColor: palette.border,
            backgroundColor: palette.bg,
          },
        ]}
      >
        <Pressable
          onPress={onMarkContacted}
          style={[
            styles.bottomBtn,
            { borderColor: palette.text, borderWidth: 1, flex: 1 },
          ]}
        >
          <CheckIcon size={16} color={palette.text} />
          <Text style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
            Mark contacted
          </Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          style={[
            styles.bottomBtn,
            { backgroundColor: palette.primary, flex: 1, borderWidth: 0 },
          ]}
        >
          <Text style={{ color: palette.primaryFg, fontSize: 14, fontFamily: 'Inter_600SemiBold' }}>
            Save lead
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function SectionTitle({ children, palette }: { children: React.ReactNode; palette: any }) {
  return (
    <Text
      style={{
        color: palette.muted,
        fontSize: 11,
        fontFamily: 'Inter_600SemiBold',
        textTransform: 'uppercase',
        letterSpacing: 0.7,
        marginTop: 26,
        marginBottom: 10,
        paddingHorizontal: 18,
      }}
    >
      {children}
    </Text>
  );
}

function ContactRow({
  icon,
  label,
  value,
  verified,
  onPress,
  onCopy,
  ctaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified: boolean;
  onPress: () => void;
  onCopy: () => void;
  ctaLabel?: string;
}) {
  const { palette } = useTheme();
  return (
    <View style={styles.contactRow}>
      <View style={{ width: 28, alignItems: 'center' }}>{icon}</View>
      <View style={{ flex: 1, marginLeft: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: palette.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Inter_500Medium' }}>
            {label}
          </Text>
          {verified && (
            <View style={[styles.verifiedTick, { backgroundColor: palette.success + '22' }]}>
              <Text style={{ color: palette.success, fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.4 }}>
                ✓ VERIFIED
              </Text>
            </View>
          )}
        </View>
        <Text
          style={{ color: palette.text, fontSize: 14, fontFamily: 'Inter_600SemiBold', marginTop: 2 }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      <Pressable
        onPress={onCopy}
        hitSlop={6}
        style={[styles.contactBtn, { borderColor: palette.border }]}
      >
        <CopyIcon size={14} color={palette.muted} />
      </Pressable>
      <Pressable
        onPress={onPress}
        hitSlop={6}
        style={[styles.contactBtn, { backgroundColor: palette.primary, borderWidth: 0, paddingHorizontal: 12 }]}
      >
        <Text style={{ color: palette.primaryFg, fontSize: 12, fontFamily: 'Inter_600SemiBold' }}>
          {ctaLabel || 'Open'}
        </Text>
      </Pressable>
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
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700' },

  hero: {
    alignItems: 'center',
    paddingTop: 22,
    paddingHorizontal: 18,
    gap: 10,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 32,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  heroHeadline: { fontSize: 14, lineHeight: 20, textAlign: 'center', maxWidth: 320 },
  companyChip: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 26,
  },
  scoreCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  scoreNum: { fontSize: 28, fontWeight: '800', fontFamily: 'Inter_700Bold' },
  scoreOf: { fontSize: 13, fontFamily: 'Inter_500Medium', marginLeft: 1, marginBottom: 2, alignSelf: 'flex-end' },

  contactBox: {
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 0.5,
    gap: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedTick: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contactBtn: {
    height: 32,
    minWidth: 32,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enrichBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 12,
  },

  postBox: {
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 0.5,
  },

  channelTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  channelPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  draftBox: {
    marginHorizontal: 16,
    padding: 14,
    borderWidth: 0.5,
    gap: 14,
  },
  draftActions: {
    flexDirection: 'row',
    gap: 8,
  },
  draftActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 999,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  draftsCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 999,
  },
});
