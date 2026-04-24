import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useManifest } from '../lib/useManifest';
import { useTheme } from '../lib/themeContext';

type Bundle = { id: string; name: string; price: string; features: string[] };

export default function PaywallScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: manifest } = useManifest();

  const paywall = manifest?.paywall || {};
  const bundles: Bundle[] = paywall.bundles || [];

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 12,
      }}>
        <Text style={{ color: palette.text, fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
          {paywall.title || 'Upgrade'}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular' }}>Close</Text>
        </TouchableOpacity>
      </View>

      {paywall.subtitle && (
        <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular', paddingHorizontal: 16, marginBottom: 16 }}>
          {paywall.subtitle}
        </Text>
      )}

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}>
        {bundles.map((bundle) => (
          <View
            key={bundle.id}
            style={{
              backgroundColor: palette.card,
              borderRadius: radius,
              borderWidth: 0.5,
              borderColor: palette.border,
              padding: 20,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: palette.text, fontSize: 17, fontWeight: '700', fontFamily: 'Inter_700Bold' }}>
                {bundle.name}
              </Text>
              <Text style={{ color: palette.primary, fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                {bundle.price}
              </Text>
            </View>
            {bundle.features.map((f) => (
              <Text key={f} style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 4 }}>
                {'✓  '}{f}
              </Text>
            ))}
            <TouchableOpacity
              style={{
                backgroundColor: palette.primary,
                borderRadius: radius / 1.5,
                paddingVertical: 11,
                alignItems: 'center',
                marginTop: 14,
              }}
            >
              <Text style={{ color: palette.primaryFg, fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
                Choose {bundle.name}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 14 }}>
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
            Restore Purchases
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
