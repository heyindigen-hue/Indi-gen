import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Linking,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { useUpdateLeadStatus } from '../../lib/useLeads';
import { Avatar } from '../../components/ui/Avatar';
import { haptic } from '../../lib/haptics';
import { BookmarkIcon, MailIcon, PhoneIcon, XIcon, SparkleIcon } from '../../components/icons';

type BucketKey = 'act_today' | 'hot' | 'follow_up';

type BucketLead = {
  id: string;
  name: string;
  headline?: string | null;
  company?: string | null;
  score?: number;
  status?: string;
  intent_label?: string | null;
  intent_confidence?: number | null;
  last_outreach_at?: string | null;
  profile_photo_url?: string | null;
  contact_count?: number;
};

type BucketsResponse = {
  act_today: BucketLead[];
  hot: BucketLead[];
  follow_up: BucketLead[];
};

const BUCKET_META: Record<BucketKey, { title: string; subtitle: string; tint: 'success' | 'warning' | 'primary' }> = {
  act_today: { title: 'Act today', subtitle: 'Hot prospects with verified contact info', tint: 'success' },
  hot: { title: 'Hot', subtitle: 'Score ≥ 7 — strike while the post is fresh', tint: 'primary' },
  follow_up: { title: 'Follow up', subtitle: 'Contacted 3+ days ago, no reply yet', tint: 'warning' },
};

function relTime(iso?: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function loadContact(leadId: string, type: 'email' | 'phone'): Promise<string | null> {
  try {
    const res = await api.get<{ contacts?: Array<{ type: string; value: string; rating?: string | null }> }>(
      `/leads/${leadId}`
    );
    const contacts = res.data?.contacts ?? [];
    const verified = contacts.find((c) => c.type === type && c.rating === 'verified');
    return (verified ?? contacts.find((c) => c.type === type))?.value ?? null;
  } catch {
    return null;
  }
}

export default function OutreachScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const statusMut = useUpdateLeadStatus();

  const { data, isLoading, isRefetching, refetch } = useQuery<BucketsResponse>({
    queryKey: ['outreach', 'buckets'],
    queryFn: () => api.get<BucketsResponse>('/leads/outreach-buckets').then((r) => r.data),
    staleTime: 60_000,
  });

  useFocusEffect(
    useCallback(() => {
      qc.invalidateQueries({ queryKey: ['outreach', 'buckets'] });
    }, [qc])
  );

  const onWhatsApp = useCallback(async (leadId: string) => {
    haptic.medium();
    const phone = await loadContact(leadId, 'phone');
    if (!phone) return Alert.alert('No phone', 'Enrich the lead to unlock WhatsApp.');
    const num = phone.replace(/[^\d]/g, '');
    Linking.openURL(`whatsapp://send?phone=${num}`).catch(() =>
      Linking.openURL(`https://wa.me/${num}`).catch(() => {})
    );
  }, []);

  const onEmail = useCallback(async (leadId: string) => {
    haptic.medium();
    const email = await loadContact(leadId, 'email');
    if (!email) return Alert.alert('No email', 'Enrich the lead to unlock email.');
    Linking.openURL(`mailto:${email}`).catch(() => {});
  }, []);

  const onSave = useCallback(
    (leadId: string) => {
      haptic.success();
      statusMut.mutate({ id: leadId, status: 'Saved' });
    },
    [statusMut]
  );

  const onSkip = useCallback(
    (leadId: string) => {
      haptic.light();
      statusMut.mutate({ id: leadId, status: 'Skip' });
    },
    [statusMut]
  );

  const totals = useMemo(() => {
    return {
      act_today: data?.act_today?.length ?? 0,
      hot: data?.hot?.length ?? 0,
      follow_up: data?.follow_up?.length ?? 0,
    };
  }, [data]);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text, fontFamily: 'Fraunces_600SemiBold' }]}>
          Outreach Hub
        </Text>
        <Text style={[styles.headerSubtitle, { color: palette.muted }]}>
          {totals.act_today + totals.hot + totals.follow_up} prospects waiting
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={palette.primary}
              colors={[palette.primary]}
            />
          }
        >
          {(['act_today', 'hot', 'follow_up'] as BucketKey[]).map((key) => {
            const leads = data?.[key] ?? [];
            const meta = BUCKET_META[key];
            const tintColor =
              meta.tint === 'success' ? palette.success : meta.tint === 'warning' ? palette.warning : palette.primary;
            return (
              <View key={key} style={{ marginTop: 18 }}>
                <View style={styles.bucketHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bucketTitle, { color: palette.text }]}>{meta.title}</Text>
                    <Text style={[styles.bucketSubtitle, { color: palette.muted }]}>{meta.subtitle}</Text>
                  </View>
                  <View style={[styles.bucketCount, { backgroundColor: tintColor + '22', borderColor: tintColor + '55' }]}>
                    <Text style={[styles.bucketCountText, { color: tintColor }]}>{leads.length}</Text>
                  </View>
                </View>

                {leads.length === 0 ? (
                  <View style={[styles.empty, { backgroundColor: palette.card, borderColor: palette.border, borderRadius: radius }]}>
                    <SparkleIcon size={28} color={palette.muted} strokeWidth={1.4} />
                    <Text style={{ color: palette.muted, fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                      Nothing here yet — fresh leads land overnight.
                    </Text>
                  </View>
                ) : (
                  leads.map((lead) => (
                    <BucketCard
                      key={lead.id}
                      lead={lead}
                      tint={tintColor}
                      onTap={() => router.push(`/lead/${lead.id}` as any)}
                      onWhatsApp={() => onWhatsApp(lead.id)}
                      onEmail={() => onEmail(lead.id)}
                      onSave={() => onSave(lead.id)}
                      onSkip={() => onSkip(lead.id)}
                    />
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function BucketCard({
  lead,
  tint,
  onTap,
  onWhatsApp,
  onEmail,
  onSave,
  onSkip,
}: {
  lead: BucketLead;
  tint: string;
  onTap: () => void;
  onWhatsApp: () => void;
  onEmail: () => void;
  onSave: () => void;
  onSkip: () => void;
}) {
  const { palette, radius } = useTheme();
  const score = lead.score ?? 0;

  return (
    <Pressable
      onPress={onTap}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderRadius: radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <Avatar uri={lead.profile_photo_url ?? undefined} name={lead.name} size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardName, { color: palette.text }]} numberOfLines={1}>
              {lead.name || 'Unknown'}
            </Text>
            <View style={[styles.scorePill, { backgroundColor: tint + '20', borderColor: tint + '55' }]}>
              <Text style={[styles.scoreText, { color: tint }]}>{score.toFixed(0)}</Text>
            </View>
          </View>
          {lead.headline ? (
            <Text style={[styles.cardHeadline, { color: palette.muted }]} numberOfLines={1}>
              {lead.headline}
            </Text>
          ) : null}
          <View style={styles.cardMeta}>
            {lead.company ? (
              <Text style={[styles.metaText, { color: palette.text }]} numberOfLines={1}>
                {lead.company}
              </Text>
            ) : null}
            {lead.last_outreach_at ? (
              <Text style={[styles.metaText, { color: palette.muted }]} numberOfLines={1}>
                · last reached {relTime(lead.last_outreach_at)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        <Pressable
          onPress={onWhatsApp}
          hitSlop={6}
          style={[styles.iconBtn, { backgroundColor: '#25D366' }]}
        >
          <PhoneIcon size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>WA</Text>
        </Pressable>
        <Pressable
          onPress={onEmail}
          hitSlop={6}
          style={[styles.iconBtn, { backgroundColor: '#4F8BFF' }]}
        >
          <MailIcon size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Email</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          hitSlop={6}
          style={[styles.iconBtn, { borderColor: palette.text, borderWidth: 1, backgroundColor: 'transparent' }]}
        >
          <BookmarkIcon size={14} color={palette.text} />
          <Text style={{ color: palette.text, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Save</Text>
        </Pressable>
        <Pressable
          onPress={onSkip}
          hitSlop={6}
          style={[styles.iconBtn, { borderColor: palette.muted, borderWidth: 1, backgroundColor: 'transparent' }]}
        >
          <XIcon size={14} color={palette.muted} />
          <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_600SemiBold' }}>Skip</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 12,
  },
  bucketTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.2,
  },
  bucketSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
    lineHeight: 16,
  },
  bucketCount: {
    minWidth: 32,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bucketCountText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  empty: {
    marginHorizontal: 16,
    paddingVertical: 28,
    paddingHorizontal: 22,
    alignItems: 'center',
    borderWidth: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderWidth: 0.5,
    gap: 12,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardName: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: 'Inter_600SemiBold',
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  scoreText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
  },
  cardHeadline: {
    fontSize: 12,
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
