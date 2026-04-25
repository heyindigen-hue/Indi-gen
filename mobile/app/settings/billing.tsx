import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { ZapIcon, ArrowUpIcon, StarIcon, CreditCardIcon } from '../../components/icons';

type TokenTx = { id: string; delta: number; kind: string; reason: string; created_at: string };
type BalanceData = { balance: number; plan?: string; renewal_date?: string; recent: TokenTx[] };

export default function BillingScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data, isLoading, refetch } = useQuery<BalanceData>({
    queryKey: ['billing', 'balance'],
    queryFn: () => api.get('/billing/tokens/balance').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const { data: txData, isLoading: txLoading } = useQuery<TokenTx[]>({
    queryKey: ['billing', 'transactions'],
    queryFn: () => api.get('/billing/tokens/transactions?limit=20').then((r) => r.data),
    staleTime: 60 * 1000,
  });

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Billing & Plans' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={[styles.planCard, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '30' }]}>
              <View style={styles.planRow}>
                <StarIcon size={22} color={palette.primary} strokeWidth={1.5} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.planName, { color: palette.text }]}>{data?.plan ?? 'Free Plan'}</Text>
                  {data?.renewal_date ? (
                    <Text style={[styles.planSub, { color: palette.muted }]}>
                      Renews {new Date(data.renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => router.push('/paywall' as any)}
                  style={({ pressed }) => [styles.upgradeBtn, { borderColor: palette.primary }, pressed && { opacity: 0.7 }]}
                >
                  <Text style={[styles.upgradeBtnText, { color: palette.primary }]}>Upgrade</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <View style={styles.balanceRow}>
                <ZapIcon size={22} color={palette.primary} strokeWidth={1.5} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[styles.balanceValue, { color: palette.text }]}>{data?.balance ?? 0}</Text>
                  <Text style={[styles.balanceLabel, { color: palette.muted }]}>tokens remaining</Text>
                </View>
                <Pressable
                  onPress={() => router.push('/paywall' as any)}
                  style={({ pressed }) => [styles.topUpBtn, { backgroundColor: palette.primary }, pressed && { opacity: 0.85 }]}
                >
                  <ArrowUpIcon size={14} color="#fff" strokeWidth={2} />
                  <Text style={styles.topUpText}>Top Up</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: palette.muted }]}>Transaction History</Text>
            </View>

            {txLoading ? (
              <ActivityIndicator color={palette.primary} style={{ marginTop: 16 }} />
            ) : (txData?.length ?? 0) === 0 ? (
              <Text style={[styles.empty, { color: palette.muted }]}>No transactions yet.</Text>
            ) : (
              <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
                {(txData ?? []).map((tx, i) => (
                  <View
                    key={tx.id}
                    style={[
                      styles.txRow,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.txReason, { color: palette.text }]}>{tx.reason ?? tx.kind}</Text>
                      <Text style={[styles.txDate, { color: palette.muted }]}>
                        {new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                    <Text style={[styles.txDelta, { color: tx.delta > 0 ? palette.success : palette.destructive }]}>
                      {tx.delta > 0 ? '+' : ''}{tx.delta}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={() => router.push('/paywall' as any)}
              style={({ pressed }) => [
                styles.changeBtn,
                { borderColor: palette.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <CreditCardIcon size={16} color={palette.muted} strokeWidth={1.5} />
              <Text style={[styles.changeBtnText, { color: palette.text }]}>Change Plan</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  planCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 17, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
  planSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  upgradeBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  upgradeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  balanceValue: { fontSize: 26, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  balanceLabel: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  topUpBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  topUpText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  sectionHeader: { marginBottom: 8 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, paddingLeft: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  txReason: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  txDate: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  txDelta: { fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14, fontFamily: 'Inter_400Regular' },
  changeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  changeBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
