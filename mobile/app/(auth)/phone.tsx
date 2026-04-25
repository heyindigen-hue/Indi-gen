import { useState } from 'react';
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
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { sendOTP } from '../../lib/firebaseAuth';

const COUNTRY_CODES: Array<{ code: string; flag: string; label: string }> = [
  { code: '+91', flag: '🇮🇳', label: 'India' },
  { code: '+1', flag: '🇺🇸', label: 'USA' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
  { code: '+971', flag: '🇦🇪', label: 'UAE' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore' },
];

const CREAM = '#F7F1E5';
const INK = '#0E0E0C';
const ASH = '#54524C';
const ORANGE = '#FF5A1F';
const FRAUNCES = 'Fraunces_400Regular';

export default function PhoneLoginScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanedPhone = phone.replace(/[^0-9]/g, '');
  const valid = cleanedPhone.length >= 7;

  const onSend = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    const fullPhone = `${country.code}${cleanedPhone}`;
    try {
      await sendOTP(fullPhone);
      router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
    } catch (err: any) {
      const msg =
        err?.message ||
        err?.userInfo?.message ||
        'Could not send code. Check the number and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const bg = palette?.bg || CREAM;
  const text = palette?.text || INK;
  const muted = palette?.muted || ASH;
  const primary = palette?.primary || ORANGE;
  const primaryFg = palette?.primaryFg || '#FFFFFF';
  const card = palette?.card || '#FFFFFF';
  const border = palette?.border || 'rgba(14,14,12,0.18)';
  const destructive = palette?.destructive || '#C8301A';

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
          Sign in
        </Text>
        <Text
          style={{
            fontSize: 17,
            color: muted,
            fontFamily: FRAUNCES,
            fontStyle: 'italic',
            marginBottom: 32,
          }}
        >
          Wake up to better leads.
        </Text>

        <Text
          style={{
            color: muted,
            fontSize: 11,
            fontFamily: 'GeistMono_400Regular',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Phone number
        </Text>

        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            marginBottom: 12,
          }}
        >
          <TouchableOpacity
            onPress={() => setShowCountryList((s) => !s)}
            style={{
              backgroundColor: card,
              borderWidth: 0.5,
              borderColor: border,
              borderRadius: radius || 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              minWidth: 96,
            }}
          >
            <Text style={{ fontSize: 18 }}>{country.flag}</Text>
            <Text
              style={{
                color: text,
                fontFamily: 'Inter_500Medium',
                fontSize: 15,
              }}
            >
              {country.code}
            </Text>
          </TouchableOpacity>

          <TextInput
            style={{
              flex: 1,
              backgroundColor: card,
              borderWidth: 0.5,
              borderColor: error ? destructive : border,
              borderRadius: radius || 8,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: text,
              fontSize: 16,
              fontFamily: 'Inter_500Medium',
            }}
            placeholder="98765 43210"
            placeholderTextColor={muted}
            keyboardType="phone-pad"
            autoFocus
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              if (error) setError(null);
            }}
          />
        </View>

        {showCountryList && (
          <View
            style={{
              backgroundColor: card,
              borderWidth: 0.5,
              borderColor: border,
              borderRadius: radius || 8,
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            {COUNTRY_CODES.map((c) => (
              <TouchableOpacity
                key={c.code}
                onPress={() => {
                  setCountry(c);
                  setShowCountryList(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  gap: 12,
                  borderBottomWidth: 0.5,
                  borderBottomColor: border,
                }}
              >
                <Text style={{ fontSize: 18 }}>{c.flag}</Text>
                <Text
                  style={{
                    color: text,
                    fontFamily: 'Inter_500Medium',
                    fontSize: 14,
                    minWidth: 56,
                  }}
                >
                  {c.code}
                </Text>
                <Text
                  style={{
                    color: muted,
                    fontFamily: 'Inter_400Regular',
                    fontSize: 13,
                  }}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text
          style={{
            color: muted,
            fontFamily: 'GeistMono_400Regular',
            fontSize: 11,
            letterSpacing: 0.6,
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          We'll send a 6-digit code via SMS. Standard rates apply.
        </Text>

        {error && (
          <Text
            style={{
              color: destructive,
              fontSize: 13,
              fontFamily: 'Inter_400Regular',
              marginBottom: 12,
              marginTop: 4,
            }}
          >
            {error}
          </Text>
        )}

        <TouchableOpacity
          onPress={onSend}
          disabled={!valid || submitting}
          style={{
            backgroundColor: primary,
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            opacity: !valid || submitting ? 0.55 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color={primaryFg} />
          ) : (
            <Text
              style={{
                color: primaryFg,
                fontSize: 15,
                fontWeight: '700',
                fontFamily: 'Inter_600SemiBold',
              }}
            >
              Send code
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text
            style={{
              color: muted,
              fontSize: 13,
              fontFamily: 'Inter_500Medium',
            }}
          >
            Sign in with email instead
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
