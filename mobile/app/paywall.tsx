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
import { useManifest } from '../lib/useManifest';
import { useTheme } from '../lib/themeContext';
import { XIcon, ZapIcon, StarIcon } from '../components/icons';
import { startTokenTopup, startSubscription } from '../lib/payments';

type TokenBundle = {
  id: string;
  tokens: number;
  amount: number;
  label: string;
  badge: string | null;
};

type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  badge: string | null;
  popular: boolean;
};

type Selection =
  | { type: 'bundle'; item: TokenBundle }
  | { type: 'plan'; item: SubscriptionPlan };

export default function PaywallScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: manifest } = useManifest();

  const paywall = manifest?.paywall ?? {};
  const tokenBundles: TokenBundle[] = paywall.token_bundles ?? [];
  const plans: SubscriptionPlan[] = paywall.subscription_plans ?? [];

  const defaultBundle = tokenBundles.find((b) => b.badge === 'POP') ?? tokenBundles[1] ?? tokenBundles[0];
  const [selected, setSelected] = useState<Selection | null>(
    defaultBundle ? { type: 'bundle', item: defaultBundle } : null
  );
  const [loading, setLoading] = useState(false);

  const ctaLabel = (): string => {
    if (!selected) return 'Select a plan';
    if (selected.type === 'bundle') return `Buy ${selected.item.tokens} tokens`;
    return `Subscribe — ${selected.item.price}`;
  };

  const handleCta = async () => {
    if (!selected || loading) return;
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

  const isPlanSelected = (p: SubscriptionPlan) =>
    selected?.type === 'plan' && selected.item.id === p.id;

  return (
    <View style={[s.root, { backgroundColor: palette.bg, paddingBottom: insets.bottom + 16 }]}>
      {/* drag handle */}
      <View style={[s.handle, { backgroundColor: palette.border }]} />

      {/* close */}
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

        {/* ── token bundles ── */}
        <Text style={[s.sectionLabel, { color: palette.muted }]}>TOKEN BUNDLES</Text>
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

        {/* ── subscription ── */}
        {plans.length > 0 ? (
          <>
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: palette.border }]} />
              <Text style={[s.dividerText, { color: palette.muted }]}>OR SUBSCRIBE</Text>
              <View style={[s.dividerLine, { backgroundColor: palette.border }]} />
            </View>
            <View style={s.planRow}>
              {plans.map((p) => {
                const active = isPlanSelected(p);
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setSelected({ type: 'plan', item: p })}
                    style={[
                      s.planCard,
                      {
                        backgroundColor: active ? palette.primary + '1A' : palette.card,
                        borderColor: active ? palette.primary : palette.border,
                        borderRadius: radius,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {p.popular ? (
                      <View style={[s.badge, { backgroundColor: palette.primary }]}>
                        <Text style={[s.badgeText, { color: palette.primaryFg }]}>
                          {p.badge ?? '★'}
                        </Text>
                      </View>
                    ) : null}
                    <StarIcon size={20} color={active ? palette.primary : palette.muted} strokeWidth={1.5} />
                    <Text style={[s.planName, { color: palette.text }]}>{p.name}</Text>
                    <Text style={[s.planPrice, { color: active ? palette.primary : palette.muted }]}>
                      {p.price}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
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

      {/* footer */}
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
    marginBottom: 28,
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
  bundleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
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
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    position: 'relative',
    gap: 6,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  planPrice: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
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
  footerDot: {
    fontSize: 12,
  },
});
