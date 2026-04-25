import { Tabs } from 'expo-router';
import { useManifest } from '../../lib/useManifest';
import { useTheme } from '../../lib/themeContext';
import * as CustomIcons from '../../components/icons';

type IconComponent = React.FC<{ color: string; size: number }>;

const ICON_MAP: Record<string, keyof typeof CustomIcons> = {
  home: 'HomeIcon',
  house: 'HomeIcon',
  bookmark: 'BookmarkIcon',
  explore: 'BookmarkIcon',
  inbox: 'BookmarkIcon',
  send: 'SendIcon',
  outreach: 'SendIcon',
  mail: 'MailIcon',
  'bar-chart': 'ChartIcon',
  'bar-chart-2': 'ChartIcon',
  'chart-line': 'ChartIcon',
  insights: 'ChartIcon',
  chart: 'ChartIcon',
  activity: 'ChartIcon',
  settings: 'SettingsIcon',
  cog: 'SettingsIcon',
  gear: 'SettingsIcon',
  search: 'SearchIcon',
  magnifier: 'SearchIcon',
  bell: 'BellIcon',
  notifications: 'BellIcon',
  user: 'UserIcon',
  profile: 'UserIcon',
  users: 'UsersIcon',
  star: 'StarIcon',
  zap: 'ZapIcon',
  sparkle: 'SparkleIcon',
  sparkles: 'SparkleIcon',
  tag: 'TagIcon',
  filter: 'FilterIcon',
  lead: 'LeadIcon',
  leads: 'LeadIcon',
  leaf: 'LeadIcon',
};

function IconFor({ name, color, size }: { name: string; color: string; size: number }) {
  const key = ICON_MAP[name?.toLowerCase()] || 'HomeIcon';
  const Cmp = (CustomIcons as any)[key] as IconComponent | undefined;
  return Cmp ? <Cmp color={color} size={size} /> : null;
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
      {tabs.map((t: any) => (
        <Tabs.Screen
          key={t.id}
          name={t.id}
          options={{
            title: t.label,
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <IconFor name={t.icon || 'home'} color={color} size={size} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
