import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useManifest } from '../lib/useManifest';
import { useTheme } from '../lib/themeContext';
import { XIcon, ZapIcon, StarIcon, CheckIcon } from '../components/icons';
import { startTokenTopup, startSubscription } from '../lib/payments';
import { api } from '../lib/api';

type TokenBundle = {
  id: string;
  tokens: number;
  amount: number;
  label: string;
  badge: string | null;
};

type ApiPlan = {
  id: string;
  name: string;
  description: string | null;
  price_inr: number;
  tokens_included: number;
  features: string[] | null;
  enabled: boolean;
};

type ManifestPlan = {
  id: string;
  name: string;
  price: string;
  price_inr?: number;
  tokens?: number;
  badge: string | null;
  popular: boolean;
  features?: string[];
};

const FALLBACK_PLANS: ManifestPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    price_inr: 0,
    tokens: 0,
    badge: null,
    popular: false,
    features: ['10 leads/day', 'Basic lead feed', 'Mobile app'],
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    price: '₹1,499/mo',
    price_inr: 1499,
    tokens: 500,
    badge: null,
    popular: false,
    features: ['500 tokens/month', 'AI draft messages', 'Export leads', 'Email support'],
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    price: '₹4,999/mo',
    price_inr: 4999,
    tokens: 2500,
    badge: '★ Popular',
    popular: true,
    features: ['2,500 tokens/month', 'Unlimited queries', 'Priority scraping', 'Analytics dashboard'],
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    price: 'Custom',
    price_inr: 0,
    tokens: 0,
    badge: null,
    popular: false,
    features: ['Custom tokens', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
  },
];

type Selection =
  | { type: 'bundle'; item: TokenBundle }
  | { type: 'plan'; item: ManifestPlan };

function apiPlanToManifest(p: ApiPlan): ManifestPlan {
  const feats: string[] = Array.isArray(p.features) ? p.features : [];
  return {
    id: p.id,
    name: p.name,
    price: p.price_inr === 0 ? '₹0' : `₹${p.price_inr.toLocaleString('en-IN')}/mo`,
    price_inr: p.price_inr,
    tokens: p.tokens_included,
    badge: null,
    popular: p.name?.toLowerCase().includes('pro'),
    features: feats,
  };
}

export default function PaywallScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: manifest } = useManifest();

  const paywall = manifest?.paywall ?? {};
  const tokenBundles: TokenBundle[] = paywall.token_bundles ?? [];

  const { data: apiPlans } = useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const res = await api.get('/billing/plans');
      return (res.data as ApiPlan[]).map(apiPlanToManifest);
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const plans: ManifestPlan[] =
    apiPlans && apiPlans.length > 0
      ? apiPlans
      : (paywall.subscription_plans ?? []).length > 0
        ? paywall.subscription_plans
        : FALLBACK_PLANS;

  const defaultBundle = tokenBundles.find((b) => b.badge === 'POP') ?? tokenBundles[1] ?? tokenBundles[0];
  const [selected, setSelected] = useState<Selection | null>(
    defaultBundle ? { type: 'bundle', item: defaultBundle } : null
  );
  const [loading, setLoading] = useState(false);

  const ctaLabel = (): string => {
    if (!selected) return 'Select a plan';
    if (selected.type === 'bundle') return `Buy ${selected.item.tokens} tokens`;
    if (selected.item.id === 'free') return 'Continue with Free';
    if (selected.item.id === 'plan_enterprise') return 'Contact us';
    return `Subscribe — ${selected.item.price}`;
  };

  const handleCta = async () => {
    if (!selected || loading) return;
    if (selected.type === 'plan' && selected.item.id === 'free') {
      router.back();
      return;
    }
    if (selected.type === 'plan' && selected.item.id === 'plan_enterprise') {
      Linking.openURL('mailto:hello@indigenservices.com?subject=Enterprise%20Plan').catch(() => {});
      return;
    }
    setLoading(true);
    try {
      if (selected.type === 'bundle') {
        await startTokenTopup(
          selected.item.id,
          (orderId) => {
            setLoading(false);
            Alert.alert('Payment verified', `Order ${orderId} confirmed.`);
            router.back();
          },
          (error) => {
            setLoading(false);
            Alert.alert('Payment failed', error);
          }
        );
      } else {
        const result = await startSubscription(selected.item.id);
        setLoading(false);
        if (result.authorization_link) {
          Linking.openURL(result.authorization_link).catch(() => {});
        }
        router.back();
      }
    } catch {
      setLoading(false);
      Alert.alert('Error', 'Could not initiate payment. Please try again.');
    }
  };

  const isBundleSelected = (b: TokenBundle) =>
    selected?.type === 'bundle' && selected.item.id === b.id;

  const isPlanSelected = (p: ManifestPlan) =>
    selected?.type === 'plan' && selected.item.id === p.id;

  return (
    <View style={[s.root, { backgroundColor: palette.bg, paddingBottom: insets.bottom + 16 }]}>
      <View style={[s.handle, { backgroundColor: palette.border }]} />

      <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
        <XIcon size={20} color={palette.muted} strokeWidth={1.5} />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* header */}
        <View style={s.headerBlock}>
          <View style={[s.iconCircle, { backgroundColor: palette.primary + '22' }]}>
            <ZapIcon size={28} color={palette.primary} strokeWidth={1.5} />
          </View>
          <Text style={[s.title, { color: palette.text }]}>
            {paywall.title ?? 'Get more leads'}
          </Text>
          {paywall.subtitle ? (
            <Text style={[s.subtitle, { color: palette.muted }]}>{paywall.subtitle}</Text>
          ) : null}
        </View>

        {/* ── subscription plans ── */}
        <Text style={[s.sectionLabel, { color: palette.muted }]}>SUBSCRIPTION PLANS</Text>
        <View style={s.planList}>
          {plans.map((p) => {
            const active = isPlanSelected(p);
            const feats: string[] = Array.isArray(p.features) ? p.features.slice(0, 3) : [];
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelected({ type: 'plan', item: p })}
                style={[
                  s.planCard,
                  {
                    backgroundColor: active ? palette.primary + '15' : palette.card,
                    borderColor: active ? palette.primary : palette.border,
                    borderRadius: radius,
                  },
                ]}
                activeOpacity={0.8}
              >
                {p.popular && (
                  <View style={[s.planBadge, { backgroundColor: palette.primary }]}>
                    <Text style={[s.planBadgeText, { color: palette.primaryFg }]}>
                      {p.badge ?? '★ Popular'}
                    </Text>
                  </View>
                )}
                <View style={s.planRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.planName, { color: palette.text }]}>{p.name}</Text>
                    {feats.length > 0 && (
                      <View style={{ marginTop: 6, gap: 3 }}>
                        {feats.map((f, i) => (
                          <View key={i} style={s.featRow}>
                            <CheckIcon size={11} color={active ? palette.primary : palette.muted} strokeWidth={2.5} />
                            <Text style={[s.featText, { color: palette.muted }]}>{f}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  <View style={s.planPriceCol}>
                    <Text style={[s.planPrice, { color: active ? palette.primary : palette.text }]}>
                      {p.price}
                    </Text>
                    {active && (
                      <View style={[s.selectedDot, { backgroundColor: palette.primary }]} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── token bundles ── */}
        {tokenBundles.length > 0 && (
          <>
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: palette.border }]} />
              <Text style={[s.dividerText, { color: palette.muted }]}>OR TOP UP TOKENS</Text>
              <View style={[s.dividerLine, { backgroundColor: palette.border }]} />
            </View>
            <View style={s.bundleRow}>
              {tokenBundles.map((b) => {
                const active = isBundleSelected(b);
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setSelected({ type: 'bundle', item: b })}
                    style={[
                      s.bundleCard,
                      {
                        backgroundColor: active ? palette.primary + '1A' : palette.card,
                        borderColor: active ? palette.primary : palette.border,
                        borderRadius: radius,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {b.badge ? (
                      <View style={[s.badge, { backgroundColor: palette.primary }]}>
                        <Text style={[s.badgeText, { color: palette.primaryFg }]}>{b.badge}</Text>
                      </View>
                    ) : null}
                    <Text style={[s.bundleTokens, { color: palette.text }]}>{b.tokens}</Text>
                    <Text style={[s.bundleTokenLabel, { color: palette.muted }]}>tokens</Text>
                    <Text style={[s.bundlePrice, { color: active ? palette.primary : palette.text }]}>
                      {b.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[s.ctaWrap, { paddingHorizontal: 20 }]}>
        <TouchableOpacity
          onPress={handleCta}
          disabled={!selected || loading}
          style={[
            s.ctaBtn,
            {
              backgroundColor: selected ? palette.primary : palette.border,
              borderRadius: radius,
            },
          ]}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={palette.primaryFg} />
          ) : (
            <Text style={[s.ctaText, { color: selected ? palette.primaryFg : palette.muted }]}>
              {ctaLabel()}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={s.footer}>
        <TouchableOpacity onPress={() => Linking.openURL('https://indigenservices.com/terms').catch(() => {})}>
          <Text style={[s.footerLink, { color: palette.muted }]}>Terms</Text>
        </TouchableOpacity>
        <Text style={[s.footerDot, { color: palette.border }]}>·</Text>
        <TouchableOpacity onPress={() => Linking.openURL('https://indigenservices.com/privacy').catch(() => {})}>
          <Text style={[s.footerLink, { color: palette.muted }]}>Privacy</Text>
        </TouchableOpacity>
        <Text style={[s.footerDot, { color: palette.border }]}>·</Text>
        <TouchableOpacity>
          <Text style={[s.footerLink, { color: palette.muted }]}>Restore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 18,
    padding: 6,
    zIndex: 10,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  planList: {
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  planPriceCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'flex-end',
  },
  featRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  planBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  bundleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bundleCard: {
    flex: 1,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    position: 'relative',
  },
  bundleTokens: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  bundleTokenLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  bundlePrice: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  ctaWrap: {
    paddingTop: 8,
  },
  ctaBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    gap: 6,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  footerDot: { fontSize: 12 },
});
