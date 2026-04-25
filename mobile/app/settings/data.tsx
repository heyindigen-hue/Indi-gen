import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';
import { TrashIcon, ArrowUpIcon, ShieldIcon } from '../../components/icons';

export default function DataPrivacyScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    Alert.alert(
      'Download My Data',
      'We\'ll prepare a JSON export of all your data including profile, leads, outreach history, and transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            setExporting(true);
            try {
              const { data } = await api.get('/me/data-export');
              const json = JSON.stringify(data, null, 2);
              await Share.share({
                title: 'Indi-gen data export',
                message: json,
              });
            } catch (err: any) {
              Alert.alert('Export failed', err?.response?.data?.error ?? 'Could not export your data. Please try again.');
            } finally {
              setExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account?',
      'Per the Digital Personal Data Protection Act 2023, all your personal data will be permanently erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Account Deletion',
              'Your account and all associated data will be erased within 30 days. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    setDeleting(true);
                    try {
                      await api.post('/me/erasure-request');
                      await logout();
                      router.replace('/(auth)/login' as any);
                    } catch (err: any) {
                      if (err?.response?.status === 409) {
                        Alert.alert('Already requested', 'An erasure request is already pending. Our team will process it within 30 days.');
                        await logout();
                        router.replace('/(auth)/login' as any);
                      } else {
                        Alert.alert('Error', 'Could not submit erasure request. Please contact support@indigenservices.com.');
                      }
                    } finally {
                      setDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Data & Privacy' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.infoCard, { backgroundColor: palette.primary + '10', borderColor: palette.primary + '25' }]}>
          <ShieldIcon size={22} color={palette.primary} strokeWidth={1.5} />
          <Text style={[styles.infoText, { color: palette.text }]}>
            Your rights under the Digital Personal Data Protection Act 2023 include the right to access, correct, and erase your personal data.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: palette.primary + '15' }]}>
              <ArrowUpIcon size={20} color={palette.primary} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: palette.text }]}>Download My Data</Text>
              <Text style={[styles.actionHint, { color: palette.muted }]}>Export a JSON copy of all your data: profile, leads, outreach history, tokens, and consent records.</Text>
            </View>
          </View>
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            style={({ pressed }) => [
              styles.actionBtn,
              { borderColor: palette.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={palette.primary} />
            ) : (
              <Text style={[styles.actionBtnText, { color: palette.primary }]}>Download JSON</Text>
            )}
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.destructive + '30' }]}>
          <View style={styles.actionItem}>
            <View style={[styles.actionIcon, { backgroundColor: palette.destructive + '15' }]}>
              <TrashIcon size={20} color={palette.destructive} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: palette.destructive }]}>Delete My Account</Text>
              <Text style={[styles.actionHint, { color: palette.muted }]}>Permanently erase all your data within 30 days as per DPDP Act 2023. This cannot be undone.</Text>
            </View>
          </View>
          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.deleteBtn,
              { backgroundColor: palette.destructive },
              pressed && { opacity: 0.85 },
            ]}
          >
            {deleting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            )}
          </Pressable>
        </View>

        <Text style={[styles.footer, { color: palette.muted }]}>
          For privacy inquiries, contact: privacy@indigenservices.com{'\n'}
          Indigen Services Pvt. Ltd. — DPDP Act 2023 Compliant
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 16 },
  actionItem: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', marginBottom: 4 },
  actionHint: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  actionBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  actionBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  deleteBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  deleteBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  footer: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, textAlign: 'center', marginTop: 8 },
});
