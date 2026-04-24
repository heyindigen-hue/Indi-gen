import { Tabs } from 'expo-router';
import { useManifest } from '../../lib/useManifest';
import { useTheme } from '../../lib/themeContext';
import * as Icons from 'lucide-react-native';

function pascalCase(s: string): string {
  return s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

export default function TabsLayout() {
  const { data: manifest } = useManifest();
  const { palette } = useTheme();
  const tabs: any[] = (manifest?.tabs || []).filter((t: any) => t.enabled);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          borderTopWidth: 0.5,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
      }}
    >
      {tabs.map((t: any) => {
        const iconName = pascalCase(t.icon || 'circle');
        const Icon = ((Icons as any)[iconName] || Icons.Circle) as React.FC<{ color: string; size: number }>;
        return (
          <Tabs.Screen
            key={t.id}
            name={t.id}
            options={{
              title: t.label,
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Icon color={color} size={size} />
              ),
            }}
          />
        );
      })}
    </Tabs>
  );
}
