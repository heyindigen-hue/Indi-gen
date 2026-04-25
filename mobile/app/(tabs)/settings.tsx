import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import {
  UserIcon,
  ShieldIcon,
  BookIcon,
  ZapIcon,
  CreditCardIcon,
  BellIcon,
  LinkIcon,
  StarIcon,
  HelpCircleIcon,
  FileTextIcon,
  InfoIcon,
  TrashIcon,
  LogOutIcon,
  SunIcon,
} from '../../components/icons';
import { ProfileCard } from '../../components/settings/ProfileCard';
import { SettingsRow } from '../../components/settings/SettingsRow';

type SectionItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
};

type Section = {
  title: string;
  items: SectionItem[];
};

function buildSections(iconColor: string, iconSize: number): Section[] {
  return [
    {
      title: 'Account',
      items: [
        { id: 'profile', label: 'Edit Profile', icon: <UserIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'password', label: 'Change Password', icon: <ShieldIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'company', label: 'Company Info', icon: <BookIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'sessions', label: 'Active Sessions', icon: <ZapIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: '2fa', label: 'Two-Factor Auth', icon: <ShieldIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
      ],
    },
    {
      title: 'Billing & Tokens',
      items: [
        { id: 'billing', label: 'Billing & Plans', icon: <CreditCardIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { id: 'appearance', label: 'Appearance', icon: <SunIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'notifications', label: 'Notifications', icon: <BellIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'integrations', label: 'Integrations', icon: <LinkIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'branding', label: 'Branding', icon: <StarIcon size={iconSize} color={iconColor} strokeWidth={1.5} />, badge: 'Pro' },
      ],
    },
    {
      title: 'Support',
      items: [
        { id: 'help', label: 'Help & Support', icon: <HelpCircleIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'legal', label: 'Legal', icon: <FileTextIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
        { id: 'about', label: 'About', icon: <InfoIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
      ],
    },
    {
      title: 'Privacy',
      items: [
        { id: 'data', label: 'Data & Privacy', icon: <TrashIcon size={iconSize} color={iconColor} strokeWidth={1.5} /> },
      ],
    },
  ];
}

export default function SettingsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const iconColor = palette.muted;
  const iconSize = 20;
  const sections = buildSections(iconColor, iconSize);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login' as any);
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.push('/settings/profile' as any)}
          style={styles.profileSection}
        >
          <ProfileCard user={user as any} />
        </Pressable>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: palette.muted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
              {section.items.map((item, i) => (
                <SettingsRow
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  value={item.badge}
                  onPress={() => router.push(`/settings/${item.id}` as any)}
                  showChevron
                  isLast={i === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}

        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            { borderColor: palette.destructive + '40', backgroundColor: palette.destructive + '08' },
            pressed && { opacity: 0.7 },
          ]}
        >
          <LogOutIcon size={18} color={palette.destructive} strokeWidth={1.5} />
          <Text style={[styles.logoutText, { color: palette.destructive }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  profileSection: {
    marginBottom: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
    marginBottom: 8,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButton: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
