import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Mail,
  CreditCard,
  LogOut,
  Zap,
  Star,
  Bell,
  Vibrate,
  FileText,
  Shield,
  BookOpen,
  HelpCircle,
  Info,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { useAuth } from '../../store/auth';

const APP_VERSION: string = require('../../package.json').version;

type SectionProps = { title: string; children: React.ReactNode };

function Section({ title, children }: SectionProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.muted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {children}
      </View>
    </View>
  );
}

type RowProps = {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  labelColor?: string;
  isLast?: boolean;
  right?: React.ReactNode;
};

function Row({ icon, label, value, onPress, showChevron = false, labelColor, isLast = false, right }: RowProps) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border },
        pressed && onPress ? { opacity: 0.7 } : null,
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, { color: labelColor ?? palette.text }]}>{label}</Text>
      {value ? (
        <Text style={[styles.rowValue, { color: palette.muted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right ?? null}
      {showChevron ? (
        <ChevronRight size={16} color={palette.muted} strokeWidth={1.5} />
      ) : null}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onChange,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: palette.border },
      ]}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowLabel, { color: palette.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: palette.border, true: palette.primary }}
        thumbColor={palette.primaryFg}
      />
    </View>
  );
}

export default function SettingsScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);

  const { data: tokenData } = useQuery({
    queryKey: ['billing', 'tokens'],
    queryFn: () => api.get('/billing/tokens/balance').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This action is irreversible. All your data will be permanently deleted per DPDP regulations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/account');
            } catch {
              // proceed with logout regardless
            }
            await logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const iconColor = palette.muted;
  const iconSize = 20;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: palette.text }]}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Account">
          <Row
            icon={<User size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Name"
            value={user?.name ?? '—'}
            isLast={false}
          />
          <Row
            icon={<Mail size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Email"
            value={user?.email ?? '—'}
            isLast={false}
          />
          <Row
            icon={<CreditCard size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Plan"
            value="Free Plan"
            isLast={false}
          />
          <Row
            icon={<LogOut size={iconSize} color={palette.destructive} strokeWidth={1.5} />}
            label="Sign Out"
            labelColor={palette.destructive}
            onPress={handleSignOut}
            showChevron={false}
            isLast
          />
        </Section>

        <Section title="Billing">
          <Row
            icon={<Zap size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Token Balance"
            value={`${tokenData?.balance ?? 0} tokens`}
            isLast={false}
          />
          <Row
            icon={<Star size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Upgrade Plan"
            onPress={() => router.push('/paywall' as any)}
            showChevron
            isLast
          />
        </Section>

        <Section title="Preferences">
          <ToggleRow
            icon={<Bell size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Push Notifications"
            value={notificationsOn}
            onChange={setNotificationsOn}
            isLast={false}
          />
          <ToggleRow
            icon={<Vibrate size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Haptic Feedback"
            value={hapticsOn}
            onChange={setHapticsOn}
            isLast
          />
        </Section>

        <Section title="Branding">
          <Row
            icon={<Star size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="White Label"
            value="Contact sales to enable"
            isLast
          />
        </Section>

        <Section title="Legal">
          <Row
            icon={<FileText size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Terms of Service"
            onPress={() => openUrl('https://indigenservices.com/terms')}
            showChevron
            isLast={false}
          />
          <Row
            icon={<Shield size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Privacy Policy"
            onPress={() => openUrl('https://indigenservices.com/privacy')}
            showChevron
            isLast={false}
          />
          <Row
            icon={<BookOpen size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="DPDP Compliance"
            onPress={() => openUrl('https://indigenservices.com/dpdp')}
            showChevron
            isLast
          />
        </Section>

        <Section title="Support">
          <Row
            icon={<HelpCircle size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Get Help"
            onPress={() => openUrl('mailto:support@indigenservices.com')}
            showChevron
            isLast={false}
          />
          <Row
            icon={<Info size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="App Version"
            value={APP_VERSION}
            isLast
          />
        </Section>

        <View
          style={[
            styles.dangerSection,
            { borderColor: palette.destructive + '40', borderRadius: radius },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: palette.destructive }]}>Danger Zone</Text>
          <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: palette.destructive + '40' }]}>
            <Row
              icon={<Trash2 size={iconSize} color={palette.destructive} strokeWidth={1.5} />}
              label="Delete Account"
              labelColor={palette.destructive}
              onPress={handleDeleteAccount}
              isLast
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    maxWidth: 160,
    textAlign: 'right',
    marginRight: 8,
  },
  dangerSection: {
    marginTop: 24,
    borderWidth: 1,
    padding: 0,
  },
});
