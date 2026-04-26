import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../lib/themeContext';
import { useLead } from '../../../lib/useLeads';
import { api } from '../../../lib/api';
import { haptic } from '../../../lib/haptics';
import { ChevronLeftIcon, SparkleIcon, FileTextIcon } from '../../../components/icons';

type Tier = {
  name: string;
  price_inr: number;
  timeline: string;
  scope: string[];
  deliverables: string[];
};

type ProposalPayload = {
  tiers: Tier[];
  cached?: boolean;
  cached_at?: string;
};

function formatINR(n: number): string {
  if (!n) return '₹0';
  // Indian numbering — 1,00,000 etc.
  const s = String(Math.round(n));
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  if (!rest) return `₹${lastThree}`;
  const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `₹${restFormatted},${lastThree}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHtml(leadName: string | null | undefined, leadCompany: string | null | undefined, payload: ProposalPayload): string {
  const tierBlocks = payload.tiers
    .map((t, idx) => {
      const featured = idx === 1;
      return `
        <div class="tier ${featured ? 'tier-featured' : ''}">
          <div class="tier-head">
            <h2>${escapeHtml(t.name)}</h2>
            ${featured ? '<span class="badge">Recommended</span>' : ''}
          </div>
          <div class="tier-price">${formatINR(t.price_inr)}</div>
          <div class="tier-timeline">${escapeHtml(t.timeline)}</div>
          <h3>Scope</h3>
          <ul>${t.scope.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          <h3>Deliverables</h3>
          <ul>${t.deliverables.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Proposal — ${escapeHtml(leadCompany || leadName || 'Lead')}</title>
<style>
  @page { margin: 28mm 22mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    background: #F7F1E5;
    color: #0E0E0C;
    padding: 0;
    margin: 0;
    line-height: 1.4;
  }
  .header { padding: 0 0 18px 0; border-bottom: 1.5px solid rgba(14,14,12,0.12); margin-bottom: 26px; }
  .eyebrow { color: #FF5A1F; font-size: 11px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; }
  h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-size: 32px;
    margin: 6px 0 6px 0;
    font-weight: 600;
  }
  .lead-meta { color: rgba(14,14,12,0.6); font-size: 13px; }
  .tier {
    border: 1px solid rgba(14,14,12,0.12);
    border-radius: 14px;
    padding: 18px 22px;
    margin-bottom: 16px;
    background: #FBF7EE;
    page-break-inside: avoid;
  }
  .tier-featured { border-color: #FF5A1F; border-width: 2px; }
  .tier-head { display: flex; align-items: baseline; justify-content: space-between; }
  .tier h2 { font-size: 18px; margin: 0; font-weight: 700; }
  .tier h3 { font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(14,14,12,0.5); margin: 14px 0 6px 0; }
  .tier-price { font-size: 24px; font-weight: 700; margin: 8px 0 2px 0; }
  .tier-timeline { font-size: 12px; color: rgba(14,14,12,0.6); margin-bottom: 4px; }
  .badge {
    background: #FF5A1F; color: white; font-size: 10px; font-weight: 700;
    padding: 4px 10px; border-radius: 999px; letter-spacing: 0.6px;
  }
  ul { margin: 4px 0 0 18px; padding: 0; }
  li { font-size: 12.5px; margin: 4px 0; line-height: 1.45; }
  .footer { margin-top: 30px; font-size: 11px; color: rgba(14,14,12,0.5); border-top: 1px solid rgba(14,14,12,0.10); padding-top: 14px; }
</style>
</head>
<body>
  <div class="header">
    <div class="eyebrow">Proposal · Indigen Services</div>
    <h1>For ${escapeHtml(leadCompany || leadName || 'You')}</h1>
    <div class="lead-meta">${escapeHtml(leadName ?? '')}${leadCompany && leadName ? ' · ' : ''}${escapeHtml(leadCompany ?? '')}</div>
  </div>
  ${tierBlocks}
  <div class="footer">
    Valid for 14 days from issue. All amounts in INR, exclusive of GST.<br/>
    Reply to this proposal to lock the tier and we'll issue the agreement within one business day.
  </div>
</body>
</html>`;
}

export default function PitchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: lead, isLoading: leadLoading } = useLead(id);
  const [payload, setPayload] = useState<ProposalPayload | null>(null);
  const [generating, setGenerating] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [sharing, setSharing] = useState(false);

  const generateMutation = useMutation({
    mutationFn: async (force: boolean) => {
      const res = await api.post<ProposalPayload>(`/leads/${id}/proposal`, { force });
      return res.data;
    },
    onSuccess: (data) => {
      setPayload(data);
    },
    onError: () => {
      Alert.alert('Could not generate proposal', 'Try again in a moment.');
    },
    onSettled: () => {
      setGenerating(false);
    },
  });

  // Fetch on mount.
  React.useEffect(() => {
    if (!id || hasFetched) return;
    setHasFetched(true);
    setGenerating(true);
    generateMutation.mutate(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hasFetched]);

  const onRegenerate = useCallback(() => {
    if (!id || generating) return;
    haptic.medium();
    setGenerating(true);
    setPayload(null);
    generateMutation.mutate(true);
  }, [id, generating, generateMutation]);

  const onShare = useCallback(async () => {
    if (!payload?.tiers?.length || !lead) return;
    haptic.light();
    setSharing(true);
    try {
      const html = buildHtml(lead.name, lead.company, payload);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('Sharing not available', 'PDF saved but device can\'t open share sheet.');
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share proposal',
        UTI: 'com.adobe.pdf',
      });
    } catch (err: any) {
      Alert.alert('Could not share', err?.message ?? 'Please try again.');
    } finally {
      setSharing(false);
    }
  }, [payload, lead]);

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

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 6, borderBottomColor: palette.border },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.iconBtn}>
          <ChevronLeftIcon size={22} color={palette.text} />
        </Pressable>
        <Text
          style={[
            styles.headerTitle,
            { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
          ]}
          numberOfLines={1}
        >
          Proposal
        </Text>
        <Pressable
          onPress={onRegenerate}
          hitSlop={12}
          style={styles.iconBtn}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator color={palette.primary} size="small" />
          ) : (
            <SparkleIcon size={20} color={palette.primary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.recipient}>
          <Text style={[styles.recipientEyebrow, { color: palette.muted }]}>For</Text>
          <Text
            style={[
              styles.recipientName,
              { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
            ]}
            numberOfLines={2}
          >
            {lead.name || 'Lead'}
          </Text>
          {lead.company ? (
            <Text style={[styles.recipientCompany, { color: palette.muted }]} numberOfLines={1}>
              {lead.company}
            </Text>
          ) : null}
          {lead.intent_reason ? (
            <View
              style={[
                styles.intentChip,
                { backgroundColor: palette.primary + '12', borderColor: palette.primary + '40' },
              ]}
            >
              <Text style={{ color: palette.primary, fontSize: 11, fontFamily: 'Inter_600SemiBold' }} numberOfLines={2}>
                {lead.intent_reason}
              </Text>
            </View>
          ) : null}
        </View>

        {generating && !payload ? (
          <View style={[styles.center, { paddingVertical: 60 }]}>
            <ActivityIndicator color={palette.primary} />
            <Text style={{ color: palette.muted, marginTop: 10, fontSize: 13 }}>
              Drafting tailored 3-tier proposal…
            </Text>
          </View>
        ) : payload?.tiers?.length ? (
          payload.tiers.slice(0, 3).map((tier, idx) => (
            <TierCard
              key={`${idx}-${tier.name}`}
              tier={tier}
              featured={idx === 1}
              palette={palette}
              radius={radius}
            />
          ))
        ) : (
          <View style={[styles.center, { paddingVertical: 60 }]}>
            <Text style={{ color: palette.muted }}>No proposal yet.</Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + 10,
            backgroundColor: palette.bg,
            borderTopColor: palette.border,
          },
        ]}
      >
        <Pressable
          onPress={onShare}
          disabled={!payload?.tiers?.length || sharing}
          style={[
            styles.shareBtn,
            {
              backgroundColor: palette.primary,
              opacity: !payload?.tiers?.length || sharing ? 0.5 : 1,
            },
          ]}
        >
          {sharing ? (
            <ActivityIndicator color={palette.primaryFg} size="small" />
          ) : (
            <FileTextIcon size={16} color={palette.primaryFg} />
          )}
          <Text
            style={{
              color: palette.primaryFg,
              fontSize: 14,
              fontFamily: 'Inter_700Bold',
            }}
          >
            {sharing ? 'Preparing PDF…' : 'Share as PDF'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function TierCard({
  tier,
  featured,
  palette,
  radius,
}: {
  tier: Tier;
  featured: boolean;
  palette: any;
  radius: number;
}) {
  return (
    <View
      style={[
        styles.tierCard,
        {
          backgroundColor: palette.card,
          borderRadius: radius,
          borderColor: featured ? palette.primary : palette.border,
          borderWidth: featured ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.tierHead}>
        <Text
          style={[
            styles.tierName,
            { color: palette.text, fontFamily: 'Fraunces_600SemiBold' },
          ]}
        >
          {tier.name}
        </Text>
        {featured ? (
          <View style={[styles.badge, { backgroundColor: palette.primary }]}>
            <Text
              style={{
                color: palette.primaryFg,
                fontSize: 10,
                fontFamily: 'Inter_700Bold',
                letterSpacing: 0.5,
              }}
            >
              RECOMMENDED
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.tierPrice, { color: palette.text, fontFamily: 'Inter_700Bold' }]}>
        ₹{indianFormat(tier.price_inr)}
      </Text>
      <Text style={[styles.tierTimeline, { color: palette.muted }]}>{tier.timeline}</Text>

      <Text style={[styles.subhead, { color: palette.muted }]}>SCOPE</Text>
      {tier.scope.map((s, i) => (
        <View key={`s-${i}`} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: palette.primary }]} />
          <Text style={[styles.bulletText, { color: palette.text }]}>{s}</Text>
        </View>
      ))}

      <Text style={[styles.subhead, { color: palette.muted, marginTop: 14 }]}>DELIVERABLES</Text>
      {tier.deliverables.map((d, i) => (
        <View key={`d-${i}`} style={styles.bulletRow}>
          <View style={[styles.bullet, { backgroundColor: palette.text }]} />
          <Text style={[styles.bulletText, { color: palette.text }]}>{d}</Text>
        </View>
      ))}
    </View>
  );
}

function indianFormat(n: number): string {
  const s = String(Math.round(n));
  const lastThree = s.slice(-3);
  const rest = s.slice(0, -3);
  if (!rest) return lastThree;
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
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
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 4,
  },
  recipientEyebrow: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  recipientName: {
    fontSize: 26,
    lineHeight: 30,
  },
  recipientCompany: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  intentChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 10,
    maxWidth: '95%',
  },

  tierCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
  },
  tierHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tierName: {
    fontSize: 22,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tierPrice: {
    fontSize: 28,
    marginTop: 8,
  },
  tierTimeline: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
    marginBottom: 4,
  },
  subhead: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 999,
  },
});
