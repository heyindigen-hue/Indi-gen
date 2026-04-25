import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../store/auth';
import { api } from '../../lib/api';
import { EditIcon } from '../../components/icons';

export default function ProfileScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, setAuth } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState((user as any)?.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const body: Record<string, string> = {};
      if (name.trim()) body.name = name.trim();
      if (phone.trim()) body.phone = phone.trim();
      const { data } = await api.patch('/auth/me', body);
      const token = await SecureStore.getItemAsync('leadhangover_token');
      await setAuth(token as string, {
        ...user!,
        name: data.name ?? user?.name ?? null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      Alert.alert('Save failed', err?.response?.data?.error ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name ?? user?.email ?? '?')
    .split(' ')
    .map((w: string) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: palette.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: 'Edit Profile' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Pressable onPress={pickAvatar} style={styles.avatarWrap}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: palette.primary + '20' }]}>
                <Text style={[styles.initials, { color: palette.primary }]}>{initials}</Text>
              </View>
            )}
            <View style={[styles.avatarEdit, { backgroundColor: palette.primary }]}>
              <EditIcon size={14} color="#fff" strokeWidth={2} />
            </View>
          </Pressable>
          <Text style={[styles.avatarHint, { color: palette.muted }]}>Tap to change photo</Text>
        </View>

        <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: palette.muted }]}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={[styles.field, styles.fieldBorder, { borderTopColor: palette.border }]}>
            <Text style={[styles.label, { color: palette.muted }]}>Email</Text>
            <TextInput
              value={user?.email ?? ''}
              editable={false}
              style={[styles.input, { color: palette.muted, borderColor: palette.border }]}
            />
            <Text style={[styles.hint, { color: palette.muted }]}>Email cannot be changed</Text>
          </View>

          <View style={[styles.field, styles.fieldBorder, { borderTopColor: palette.border }]}>
            <Text style={[styles.label, { color: palette.muted }]}>Phone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 99999 99999"
              placeholderTextColor={palette.muted}
              style={[styles.input, { color: palette.text, borderColor: palette.border }]}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        <Pressable
          onPress={save}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: saved ? palette.success : palette.primary },
            pressed && { opacity: 0.85 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>{saved ? 'Saved' : 'Save Changes'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 26, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  avatarEdit: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint: { marginTop: 10, fontSize: 12, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 24 },
  field: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 11, fontFamily: 'Inter_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 8, minHeight: 44 },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  saveBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', fontWeight: '600', color: '#fff' },
});
