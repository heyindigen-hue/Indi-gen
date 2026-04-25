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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';

export default function ChangePasswordScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = current.length > 0 && next.length >= 8 && next === confirm;

  const save = async () => {
    if (!valid || saving) return;
    if (next !== confirm) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/me/change-password', { current, next });
      Alert.alert(
        'Password changed',
        'Your password has been updated. You will be signed out.',
        [{ text: 'OK', onPress: async () => { await logout(); router.replace('/(auth)/login' as any); } }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Change Password' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <PasswordField label="Current Password" value={current} onChange={setCurrent} palette={palette} />
          <PasswordField label="New Password" value={next} onChange={setNext} palette={palette} hint="Minimum 8 characters" border />
          <PasswordField label="Confirm New Password" value={confirm} onChange={setConfirm} palette={palette} border error={confirm.length > 0 && next !== confirm ? 'Passwords do not match' : undefined} />
        </View>

        <Pressable
          onPress={save}
          disabled={!valid || saving}
          style={({ pressed }) => [
            styles.btn,
            { backgroundColor: valid ? palette.primary : palette.border },
            pressed && valid && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={[styles.btnText, { color: valid ? '#fff' : palette.muted }]}>Update Password</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({ label, value, onChange, palette, hint, border, error }: {
  label: string; value: string; onChange: (v: string) => void;
  palette: any; hint?: string; border?: boolean; error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={[styles.field, border && styles.fieldBorder, border && { borderTopColor: palette.border }]}>
      <Text style={[styles.label, { color: palette.muted }]}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={palette.muted}
          style={[styles.input, { color: palette.text, borderColor: error ? palette.destructive : palette.border, flex: 1 }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable onPress={() => setShow((v) => !v)} style={styles.showBtn}>
          <Text style={[styles.showBtnText, { color: palette.primary }]}>{show ? 'Hide' : 'Show'}</Text>
        </Pressable>
      </View>
      {hint ? <Text style={[styles.hint, { color: palette.muted }]}>{hint}</Text> : null}
      {error ? <Text style={[styles.hint, { color: palette.destructive }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 24 },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, minHeight: 44 },
  showBtn: { paddingHorizontal: 4 },
  showBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  btn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
});
