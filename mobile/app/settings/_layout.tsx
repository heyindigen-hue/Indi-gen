import { Stack } from 'expo-router';
import { useTheme } from '../../lib/themeContext';

export default function SettingsLayout() {
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.bg },
        headerTintColor: palette.primary,
        headerTitleStyle: { fontFamily: 'InterTight_600SemiBold', fontWeight: '600', color: palette.text } as any,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: palette.bg },
        headerShadowVisible: false,
      }}
    />
  );
}
