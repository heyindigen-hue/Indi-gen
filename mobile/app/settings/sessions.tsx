import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';
import { ZapIcon, TrashIcon } from '../../components/icons';

type Session = {
  jti: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string | null;
  is_current: boolean;
};

function parseUA(ua: string | null): string {
  if (!ua) return 'Unknown device';
  if (ua.includes('okhttp') || ua.includes('Android')) return 'Android';
  if (ua.includes('iPhone') || ua.includes('iOS')) return 'iPhone';
  if (ua.includes('Chrome')) return 'Chrome Browser';
  if (ua.includes('Firefox')) return 'Firefox Browser';
  if (ua.includes('Safari')) return 'Safari Browser';
  return ua.slice(0, 40);
}

export default function SessionsScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/me/sessions').then((r) => r.data),
    staleTime: 30 * 1000,
  });

  const revokeMutation = useMutation({
    mutationFn: (jti: string) => api.delete(`/me/sessions/${jti}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.error ?? 'Failed to revoke session.'),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => api.delete('/me/sessions'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.error ?? 'Failed.'),
  });

  const handleRevoke = (jti: string) => {
    Alert.alert('Revoke session?', 'This device will be signed out.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Revoke', style: 'destructive', onPress: () => revokeMutation.mutate(jti) },
    ]);
  };

  const handleRevokeAll = () => {
    Alert.alert('Sign out all other sessions?', 'All sessions except your current one will be revoked.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out all', style: 'destructive', onPress: () => revokeAllMutation.mutate() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: palette.bg }}>
      <Stack.Screen options={{ title: 'Active Sessions' }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={palette.primary} style={{ marginTop: 40 }} />
        ) : (sessions?.length ?? 0) === 0 ? (
          <Text style={[styles.empty, { color: palette.muted }]}>No active sessions.</Text>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
              {(sessions ?? []).map((s, i) => (
                <View
                  key={s.jti}
                  style={[
                    styles.row,
                    i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <ZapIcon size={18} color={s.is_current ? palette.primary : palette.muted} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.device, { color: palette.text }]}>
                      {parseUA(s.user_agent)}{s.is_current ? ' (this device)' : ''}
                    </Text>
                    <Text style={[styles.meta, { color: palette.muted }]}>
                      {s.ip_address ?? 'Unknown IP'} • {s.last_seen_at
                        ? new Date(s.last_seen_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                        : new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                  </View>
                  {!s.is_current && (
                    <Pressable
                      onPress={() => handleRevoke(s.jti)}
                      disabled={revokeMutation.isPending}
                      style={({ pressed }) => [styles.revokeBtn, { borderColor: palette.destructive + '40' }, pressed && { opacity: 0.7 }]}
                    >
                      <TrashIcon size={14} color={palette.destructive} strokeWidth={1.5} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>

            <Pressable
              onPress={handleRevokeAll}
              disabled={revokeAllMutation.isPending}
              style={({ pressed }) => [
                styles.revokeAllBtn,
                { borderColor: palette.destructive + '40', backgroundColor: palette.destructive + '08' },
                pressed && { opacity: 0.7 },
              ]}
            >
              {revokeAllMutation.isPending ? (
                <ActivityIndicator size="small" color={palette.destructive} />
              ) : (
                <Text style={[styles.revokeAllText, { color: palette.destructive }]}>Logout All Other Sessions</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowIcon: { marginRight: 12 },
  device: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  revokeBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  revokeAllBtn: { paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  revokeAllText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, fontFamily: 'Inter_400Regular' },
});
