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
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  UserIcon,
  MailIcon,
  CreditCardIcon,
  LogOutIcon,
  ZapIcon,
  StarIcon,
  BellIcon,
  VibrateIcon,
  FileTextIcon,
  ShieldIcon,
  BookIcon,
  HelpCircleIcon,
  InfoIcon,
  TrashIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  SparkleIcon,
  CheckIcon,
  ArrowUpIcon,
  EditIcon,
  CashIcon,
  ChartIcon,
  LinkIcon,
} from '../../components/icons';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useManifest } from '../../lib/useManifest';

const APP_VERSION: string = require('../../package.json').version;

type SectionProps = { title: string; children: React.ReactNode; titleColor?: string };

function Section({ title, children, titleColor }: SectionProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: titleColor ?? palette.muted }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: palette.card, borderColor: titleColor ? titleColor + '40' : palette.border }]}>
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
  loading?: boolean;
};

function Row({ icon, label, value, onPress, showChevron = false, labelColor, isLast = false, right, loading }: RowProps) {
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
      {loading ? (
        <ActivityIndicator size="small" color={palette.muted} style={{ marginRight: 8 }} />
      ) : value ? (
        <Text style={[styles.rowValue, { color: palette.muted }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {right ?? null}
      {showChevron ? (
        <ChevronRightIcon size={16} color={palette.muted} strokeWidth={1.5} />
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
  const { palette, radius, mode, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { data: manifest } = useManifest();

  const [notificationsOn, setNotificationsOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [exportingData, setExportingData] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { data: tokenData } = useQuery({
    queryKey: ['billing', 'tokens'],
    queryFn: () => api.get('/billing/tokens/balance').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const legal = manifest?.settings?.legal ?? {
    terms: 'https://indigenservices.com/terms',
    privacy: 'https://indigenservices.com/privacy',
    dpdp: 'https://indigenservices.com/dpdp',
  };

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

  const handleExportData = () => {
    Alert.alert(
      'Export my data',
      'We will prepare a copy of all your data as a JSON file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setExportingData(true);
            try {
              const { data } = await api.get('/me/data-export');
              const json = JSON.stringify(data, null, 2);
              await Share.share({
                title: 'LeadHangover data export',
                message: json,
              });
            } catch {
              Alert.alert('Export failed', 'Could not export your data. Please try again.');
            } finally {
              setExportingData(false);
            }
          },
        },
      ]
    );
  };

  const handleErasureRequest = () => {
    Alert.alert(
      'Delete Account?',
      'Per DPDP regulations, all your personal data will be permanently erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete my account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm deletion',
              'Type "DELETE" to confirm. Your account and all data will be erased within 30 days as per DPDP Act 2023.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Confirm',
                  style: 'destructive',
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await api.post('/me/erasure-request');
                    } catch {
                      // proceed with logout even if request fails
                    }
                    try {
                      await api.delete('/account');
                    } catch {
                      // ignore
                    }
                    await logout();
                    router.replace('/login' as any);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const openLegalWebView = (url: string) => {
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account ── */}
        <Section title="Account">
          <Row
            icon={<UserIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Name"
            value={user?.name ?? '—'}
          />
          <Row
            icon={<MailIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Email"
            value={user?.email ?? '—'}
          />
          <Row
            icon={<CreditCardIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Plan"
            value={tokenData?.plan ?? 'Free Plan'}
          />
          <Row
            icon={<EditIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Edit Profile"
            onPress={() => {}}
            showChevron
          />
          <Row
            icon={<LogOutIcon size={iconSize} color={palette.destructive} strokeWidth={1.5} />}
            label="Sign Out"
            labelColor={palette.destructive}
            onPress={handleSignOut}
            isLast
          />
        </Section>

        {/* ── Billing ── */}
        <Section title="Billing">
          <Row
            icon={<ZapIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Token Balance"
            value={`${tokenData?.balance ?? 0} tokens`}
          />
          <Row
            icon={<ChartIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Token History"
            onPress={() => {}}
            showChevron
          />
          <Row
            icon={<ArrowUpIcon size={iconSize} color={palette.primary} strokeWidth={1.5} />}
            label="Top Up Tokens"
            labelColor={palette.primary}
            onPress={() => router.push('/paywall' as any)}
            showChevron
          />
          <Row
            icon={<StarIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Upgrade Plan"
            onPress={() => router.push('/paywall' as any)}
            showChevron
            isLast
          />
        </Section>

        {/* ── Preferences ── */}
        <Section title="Preferences">
          <ToggleRow
            icon={<BellIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Push Notifications"
            value={notificationsOn}
            onChange={setNotificationsOn}
          />
          <ToggleRow
            icon={<VibrateIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Haptic Feedback"
            value={hapticsOn}
            onChange={setHapticsOn}
            isLast
          />
        </Section>

        {/* ── Appearance ── */}
        <Section title="Appearance">
          {(['light', 'dark', 'system'] as const).map((m, i, arr) => (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[
                styles.row,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: palette.border },
              ]}
            >
              <View style={styles.rowIcon}>
                {m === 'light' ? <SunIcon size={iconSize} color={iconColor} /> :
                 m === 'dark' ? <MoonIcon size={iconSize} color={iconColor} /> :
                 <SparkleIcon size={iconSize} color={iconColor} />}
              </View>
              <Text style={[styles.rowLabel, { color: palette.text }]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
              {mode === m && <CheckIcon size={16} color={palette.primary} />}
            </Pressable>
          ))}
        </Section>

        {/* ── Legal ── */}
        <Section title="Legal">
          <Row
            icon={<FileTextIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Terms of Service"
            onPress={() => openLegalWebView(legal.terms)}
            showChevron
          />
          <Row
            icon={<ShieldIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Privacy Policy"
            onPress={() => openLegalWebView(legal.privacy)}
            showChevron
          />
          <Row
            icon={<BookIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="DPDP Compliance"
            onPress={() => openLegalWebView(legal.dpdp)}
            showChevron
            isLast
          />
        </Section>

        {/* ── Support ── */}
        <Section title="Support">
          <Row
            icon={<HelpCircleIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="Get Help"
            onPress={() => openUrl('mailto:support@indigenservices.com')}
            showChevron
          />
          <Row
            icon={<LinkIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="LinkedIn Browser"
            onPress={() => router.push('/webview-linkedin' as any)}
            showChevron
          />
          <Row
            icon={<InfoIcon size={iconSize} color={iconColor} strokeWidth={1.5} />}
            label="App Version"
            value={APP_VERSION}
            isLast
          />
        </Section>

        {/* ── Danger Zone ── */}
        <Section title="Danger Zone" titleColor={palette.destructive}>
          <Row
            icon={<CashIcon size={iconSize} color={palette.destructive} strokeWidth={1.5} />}
            label="Export my data"
            labelColor={palette.destructive}
            onPress={handleExportData}
            showChevron={!exportingData}
            loading={exportingData}
          />
          <Row
            icon={<TrashIcon size={iconSize} color={palette.destructive} strokeWidth={1.5} />}
            label="Delete Account"
            labelColor={palette.destructive}
            onPress={deletingAccount ? undefined : handleErasureRequest}
            loading={deletingAccount}
            isLast
          />
        </Section>
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
});
