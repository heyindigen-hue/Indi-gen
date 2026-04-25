import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import { sendOTP, verifyOTP, linkBackend } from '../../lib/firebaseAuth';

const RESEND_COOLDOWN = 30;
const FRAUNCES = 'Fraunces_400Regular';

export default function OtpScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string }>();
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const setAuth = useAuth((s: any) => s.setAuth);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const verifyOnceRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const submit = async (digits: string) => {
    if (verifyOnceRef.current) return;
    if (digits.length !== 6) return;
    verifyOnceRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const idToken = await verifyOTP(digits);
      const data = await linkBackend(idToken);
      const user = data.user;
      const role = user?.role;
      const needsOnboarding = data.needs_onboarding ?? user?.needs_onboarding ?? false;

      try {
        if (typeof setAuth === 'function') {
          await setAuth(data.token, {
            id: user.id,
            email: user.email || '',
            name: user.name || null,
          });
        } else {
          await SecureStore.setItemAsync('leadhangover_token', data.token);
        }
      } catch {
        await SecureStore.setItemAsync('leadhangover_token', data.token);
      }

      if (role === 'admin' || role === 'super_admin') {
        router.replace('/(tabs)');
        return;
      }
      if (needsOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      verifyOnceRef.current = false;
      setError(err?.message || 'Invalid code. Please try again.');
      setCode('');
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeCode = (v: string) => {
    const digits = v.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError(null);
    if (digits.length === 6) submit(digits);
  };

  const onResend = async () => {
    if (cooldown > 0 || resending) return;
    if (!phone) {
      setError('Phone number missing. Go back and try again.');
      return;
    }
    setResending(true);
    setError(null);
    try {
      await sendOTP(phone);
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setError(err?.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  const text = palette?.text || '#0E0E0C';
  const muted = palette?.muted || '#54524C';
  const primary = palette?.primary || '#FF5A1F';
  const primaryFg = palette?.primaryFg || '#FFFFFF';
  const card = palette?.card || '#FBF7EE';
  const border = palette?.border || 'rgba(14,14,12,0.18)';
  const destructive = palette?.destructive || '#C8301A';
  const bg = palette?.bg || '#F7F1E5';

  const cells = Array.from({ length: 6 }, (_, i) => code[i] ?? '');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: 'Inter_700Bold',
            color: text,
            marginBottom: 6,
          }}
        >
          Enter code
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: muted,
            fontFamily: FRAUNCES,
            fontStyle: 'italic',
            marginBottom: 6,
          }}
        >
          Six digits, one moment.
        </Text>
        {phone ? (
          <Text
            style={{
              color: muted,
              fontFamily: 'GeistMono_400Regular',
              fontSize: 12,
              letterSpacing: 0.6,
              marginBottom: 24,
            }}
          >
            Sent to {phone}
          </Text>
        ) : null}

        <TouchableOpacity
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 12,
          }}
        >
          {cells.map((digit, idx) => {
            const focused = code.length === idx;
            return (
              <View
                key={idx}
                style={{
                  flex: 1,
                  height: 56,
                  backgroundColor: card,
                  borderWidth: 1,
                  borderColor: error
                    ? destructive
                    : focused
                    ? primary
                    : border,
                  borderRadius: radius || 8,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 22,
                    color: text,
                    fontFamily: 'GeistMono_400Regular',
                    letterSpacing: 2,
                  }}
                >
                  {digit}
                </Text>
              </View>
            );
          })}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
          }}
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={onChangeCode}
          autoFocus
          editable={!submitting}
        />

        {error && (
          <Text
            style={{
              color: destructive,
              fontSize: 13,
              fontFamily: 'Inter_400Regular',
              marginBottom: 8,
              marginTop: 4,
            }}
          >
            {error}
          </Text>
        )}

        {submitting && (
          <View style={{ alignItems: 'center', marginTop: 8 }}>
            <ActivityIndicator color={primary} />
          </View>
        )}

        <View
          style={{
            marginTop: 24,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              color: muted,
              fontSize: 13,
              fontFamily: 'Inter_400Regular',
            }}
          >
            Didn't get it?
          </Text>
          <TouchableOpacity
            onPress={onResend}
            disabled={cooldown > 0 || resending}
          >
            <Text
              style={{
                color: cooldown > 0 ? muted : primary,
                fontSize: 13,
                fontFamily: 'Inter_600SemiBold',
                opacity: cooldown > 0 ? 0.6 : 1,
              }}
            >
              {resending
                ? 'Sending…'
                : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend code'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 18, alignItems: 'center' }}
        >
          <Text
            style={{
              color: muted,
              fontSize: 13,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Use a different number
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
