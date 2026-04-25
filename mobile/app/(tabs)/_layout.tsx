import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import {
  HomeIcon,
  BookmarkIcon,
  LeadIcon,
  SendIcon,
  ChartIcon,
  SettingsIcon,
} from '../../components/icons';

type TabIconProps = { color: string; size: number; focused: boolean };

// Hardcoded tab list — manifest used to drive this, but a manifest fetch race
// during cold start was leaving the tab bar empty. Tab structure rarely changes;
// owning it locally guarantees icons always render.
const TABS: { id: string; label: string; Icon: React.FC<{ color: string; size: number }> }[] = [
  { id: 'index', label: 'Home', Icon: HomeIcon },
  { id: 'explore', label: 'Saved', Icon: BookmarkIcon },
  { id: 'leads', label: 'Leads', Icon: LeadIcon },
  { id: 'outreach', label: 'Outreach', Icon: SendIcon },
  { id: 'insights', label: 'Insights', Icon: ChartIcon },
  { id: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function TabsLayout() {
  const { palette } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen
          key={t.id}
          name={t.id}
          options={{
            title: t.label,
            tabBarIcon: ({ color, size, focused }: TabIconProps) => (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: 2,
                  transform: [{ scale: focused ? 1.04 : 1 }],
                }}
              >
                <t.Icon color={color} size={size ?? 22} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
