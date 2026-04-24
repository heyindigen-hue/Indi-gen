import { ScrollView, View, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useManifest } from '../../lib/useManifest';
import { useTheme } from '../../lib/themeContext';
import { renderWidget } from '../../components/widgets';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { router } from 'expo-router';
import { api } from '../../lib/api';

type BalanceResponse = { balance: number };

export default function Home() {
  const { palette } = useTheme();
  const { data: manifest, refetch: refetchManifest } = useManifest();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const widgets: any[] = manifest?.home_widgets ?? [];
  const brand = manifest?.brand;

  // Check if TokenBalance widget is in the manifest
  const hasTokenWidget = widgets.some((w) => w.type === 'TokenBalance');

  // Lightweight balance fetch for sticky header chip
  const { data: balanceData } = useQuery<BalanceResponse>({
    queryKey: ['token-balance'],
    queryFn: async () => {
      const res = await api.get<BalanceResponse>('/billing/tokens/balance');
      return res.data;
    },
    enabled: hasTokenWidget,
    staleTime: 60_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchManifest(),
      qc.invalidateQueries({ queryKey: ['token-balance'] }),
      qc.invalidateQueries({ queryKey: ['leads-swipe'] }),
      qc.invalidateQueries({ queryKey: ['leads-carousel'] }),
      qc.invalidateQueries({ queryKey: ['announcement'] }),
    ]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: palette.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={palette.primary}
          colors={[palette.primary]}
        />
      }
    >
      <View style={{ paddingHorizontal: 16 }}>
        {/* Brand header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '700',
                fontFamily: 'Inter_700Bold',
                color: palette.text,
                letterSpacing: -0.5,
              }}
            >
              {brand?.name ?? 'Indi-gen'}
            </Text>
            {brand?.tagline ? (
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 13,
                  fontFamily: 'Inter_400Regular',
                  marginTop: 2,
                }}
              >
                {brand.tagline}
              </Text>
            ) : null}
          </View>

          {/* Sticky token balance chip */}
          {hasTokenWidget && balanceData !== undefined && (
            <TouchableOpacity
              onPress={() => router.push('/paywall')}
              activeOpacity={0.8}
              style={{
                backgroundColor: palette.primary + '18',
                borderRadius: 20,
                borderWidth: 0.5,
                borderColor: palette.primary + '50',
                paddingHorizontal: 12,
                paddingVertical: 6,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                marginTop: 2,
              }}
            >
              <Text style={{ fontSize: 12 }}>⚡</Text>
              <Text
                style={{
                  color: palette.primary,
                  fontSize: 13,
                  fontWeight: '600',
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {(balanceData.balance ?? 0).toLocaleString()}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Widget layout */}
        {widgets.map((w: any, i: number) => (
          <View key={`${w.type}-${i}`} style={{ marginBottom: 12 }}>
            {renderWidget(w, String(i))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
