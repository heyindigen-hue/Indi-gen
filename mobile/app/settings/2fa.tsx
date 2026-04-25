import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { ShieldIcon, CheckIcon, CopyIcon } from '../../components/icons';
import * as Clipboard from 'expo-clipboard';

type TwoFAStatus = { enabled: boolean; enabledAt: string | null };

export default function TwoFAScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'idle' | 'setup' | 'verify' | 'disable'>('idle');
  const [setupData, setSetupData] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  const { data: status, isLoading } = useQuery<TwoFAStatus>({
    queryKey: ['2fa', 'status'],
    queryFn: () => api.get('/me/2fa/status').then((r) => r.data),
  });

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/me/2fa/setup');
      setSetupData(data);
      setStep('setup');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to start 2FA setup.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const { data } = await api.post('/me/2fa/verify', { code });
      setRecoveryCodes(data.recoveryCodes);
      setStep('idle');
      queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] });
    } catch (err: any) {
      Alert.alert('Invalid code', err?.response?.data?.error ?? 'The code is incorrect. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const disableFA = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      await api.post('/me/2fa/disable', { code });
      setStep('idle');
      setCode('');
      queryClient.invalidateQueries({ queryKey: ['2fa', 'status'] });
      Alert.alert('2FA disabled', 'Two-factor authentication has been turned off.');
    } catch (err: any) {
      Alert.alert('Invalid code', err?.response?.data?.error ?? 'The code is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.bg }}>
        <Stack.Screen options={{ title: 'Two-Factor Auth' }} />
        <ActivityIndicator color={palette.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Two-Factor Auth' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>

        <View style={[styles.statusCard, { backgroundColor: status?.enabled ? palette.success + '12' : palette.card, borderColor: status?.enabled ? palette.success + '30' : palette.border }]}>
          <ShieldIcon size={24} color={status?.enabled ? palette.success : palette.muted} strokeWidth={1.5} />
          <View style={{ marginLeft: 12 }}>
            <Text style={[styles.statusText, { color: palette.text }]}>{status?.enabled ? '2FA is enabled' : '2FA is disabled'}</Text>
            {status?.enabledAt ? (
              <Text style={[styles.statusSub, { color: palette.muted }]}>
                Enabled {new Date(status.enabledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            ) : (
              <Text style={[styles.statusSub, { color: palette.muted }]}>Add extra security to your account</Text>
            )}
          </View>
        </View>

        {recoveryCodes ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Recovery Codes</Text>
            <Text style={[styles.cardHint, { color: palette.muted }]}>Save these codes somewhere safe. Each can be used once if you lose access to your authenticator app.</Text>
            <View style={styles.codes}>
              {recoveryCodes.map((c) => (
                <View key={c} style={[styles.codeChip, { backgroundColor: palette.primary + '12', borderColor: palette.primary + '30' }]}>
                  <Text style={[styles.codeText, { color: palette.text }]}>{c}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={() => Clipboard.setStringAsync(recoveryCodes.join('\n')).then(() => Alert.alert('Copied', 'Recovery codes copied to clipboard.'))}
              style={({ pressed }) => [styles.copyBtn, { borderColor: palette.primary }, pressed && { opacity: 0.7 }]}
            >
              <CopyIcon size={14} color={palette.primary} strokeWidth={1.5} />
              <Text style={[styles.copyBtnText, { color: palette.primary }]}>Copy all codes</Text>
            </Pressable>
          </View>
        ) : null}

        {step === 'setup' && setupData ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Scan QR Code</Text>
            <Text style={[styles.cardHint, { color: palette.muted }]}>Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code.</Text>
            <View style={styles.qrWrap}>
              <Image source={{ uri: setupData.qrDataUrl }} style={styles.qr} />
            </View>
            <Text style={[styles.secretLabel, { color: palette.muted }]}>Manual entry key</Text>
            <Text style={[styles.secret, { color: palette.text, backgroundColor: palette.bg, borderColor: palette.border }]}>{setupData.secret}</Text>
            <Text style={[styles.cardHint, { color: palette.muted, marginTop: 16 }]}>Enter the 6-digit code from your app:</Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              style={[styles.codeInput, { color: palette.text, borderColor: palette.border }]}
              maxLength={6}
            />
            <Pressable
              onPress={verifyCode}
              disabled={code.length !== 6 || loading}
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: palette.primary, opacity: code.length === 6 && !loading ? 1 : 0.5 }, pressed && { opacity: 0.8 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Verify & Enable</Text>}
            </Pressable>
          </View>
        ) : step === 'disable' ? (
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={[styles.cardTitle, { color: palette.text }]}>Disable 2FA</Text>
            <Text style={[styles.cardHint, { color: palette.muted }]}>Enter your current 6-digit authenticator code to confirm.</Text>
            <TextInput
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={palette.muted}
              keyboardType="number-pad"
              style={[styles.codeInput, { color: palette.text, borderColor: palette.border }]}
              maxLength={6}
            />
            <Pressable
              onPress={disableFA}
              disabled={code.length !== 6 || loading}
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: palette.destructive, opacity: code.length === 6 && !loading ? 1 : 0.5 }, pressed && { opacity: 0.8 }]}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Disable 2FA</Text>}
            </Pressable>
          </View>
        ) : null}

        {step === 'idle' && (
          <>
            {!status?.enabled ? (
              <Pressable
                onPress={startSetup}
                disabled={loading}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: palette.primary, marginTop: 16 }, pressed && { opacity: 0.85 }]}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>Enable 2FA</Text>}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => { setCode(''); setStep('disable'); }}
                style={({ pressed }) => [styles.disableLink, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.disableLinkText, { color: palette.destructive }]}>Disable 2FA</Text>
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  statusCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 16, marginBottom: 20 },
  statusText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  statusSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  cardHint: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  qrWrap: { alignItems: 'center', marginVertical: 20 },
  qr: { width: 180, height: 180, borderRadius: 8 },
  secretLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12 },
  secret: { fontSize: 13, fontFamily: 'Inter_400Regular', borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 6, letterSpacing: 2 },
  codeInput: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center', borderWidth: 1, borderRadius: 10, paddingVertical: 14, marginTop: 10, letterSpacing: 6 },
  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  codeChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  codeText: { fontSize: 13, fontFamily: 'Inter_400Regular', letterSpacing: 1 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  copyBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  actionBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  actionBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  disableLink: { marginTop: 20, alignItems: 'center', paddingVertical: 10 },
  disableLinkText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
