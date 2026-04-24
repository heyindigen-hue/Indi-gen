import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';

export default function OutreachScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center', paddingTop: insets.top }}>
      <Text style={{ fontSize: 20, fontWeight: '700', fontFamily: 'Inter_700Bold', color: palette.text }}>
        Outreach
      </Text>
      <Text style={{ color: palette.muted, marginTop: 8, fontFamily: 'Inter_400Regular' }}>
        Coming soon
      </Text>
    </View>
  );
}
