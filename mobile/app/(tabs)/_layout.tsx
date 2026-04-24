import { Tabs } from 'expo-router';
import { useManifest } from '../../lib/useManifest';
import { useTheme } from '../../lib/themeContext';
import * as Icons from '../../components/icons';

function toPascalCase(s: string): string {
  return s.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

type IconComponent = React.FC<{ color: string; size: number }>;

const ICON_FALLBACK_MAP: Record<string, string> = {
  Circle: 'SparkleIcon',
  Home: 'HomeIcon',
  Search: 'SearchIcon',
  Bell: 'BellIcon',
  Settings: 'SettingsIcon',
  Cog: 'SettingsIcon',
  User: 'UserIcon',
  Users: 'UsersIcon',
  Bookmark: 'BookmarkIcon',
  Send: 'SendIcon',
  BarChart: 'ChartIcon',
  BarChart2: 'ChartIcon',
  Activity: 'ChartIcon',
  TrendingUp: 'ChartIcon',
  Sparkles: 'SparkleIcon',
  Sparkle: 'SparkleIcon',
  Zap: 'ZapIcon',
  Star: 'StarIcon',
  Mail: 'MailIcon',
  Tag: 'TagIcon',
  Filter: 'FilterIcon',
  Plus: 'PlusIcon',
  Check: 'CheckIcon',
  X: 'XIcon',
  Globe: 'SearchIcon',
  Target: 'SearchIcon',
  Inbox: 'BookmarkIcon',
  MessageSquare: 'SparkleIcon',
  Wand2: 'SparkleIcon',
};

function resolveIcon(name: string): IconComponent {
  const pascalName = toPascalCase(name);
  const withSuffix = pascalName.endsWith('Icon') ? pascalName : `${pascalName}Icon`;
  const direct = (Icons as any)[withSuffix];
  if (direct) return direct as IconComponent;
  const mapped = ICON_FALLBACK_MAP[pascalName];
  if (mapped) {
    const fallback = (Icons as any)[mapped];
    if (fallback) return fallback as IconComponent;
  }
  return (Icons as any)['SparkleIcon'] as IconComponent;
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
        const Icon = resolveIcon(t.icon || 'circle');
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
