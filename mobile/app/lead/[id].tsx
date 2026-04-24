import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ color: palette.primary, fontSize: 16, fontFamily: 'Inter_500Medium' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: palette.text, fontSize: 18, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
          Lead Detail
        </Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{
          backgroundColor: palette.card,
          borderRadius: radius,
          borderWidth: 0.5,
          borderColor: palette.border,
          padding: 24,
          width: '100%',
          alignItems: 'center',
        }}>
          <Text style={{ color: palette.text, fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 8 }}>
            Lead #{id}
          </Text>
          <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular' }}>
            Full details coming in M3
          </Text>
        </View>
      </View>
    </View>
  );
}
