import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/themeContext';
import { ChevronRightIcon } from '../icons';

interface ProfileCardProps {
  user: { name?: string | null; email?: string; avatar_url?: string | null } | null;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const { palette } = useTheme();
  const initials = (user?.name ?? user?.email ?? '?')
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      {user?.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: palette.primary + '20' }]}>
          <Text style={[styles.initials, { color: palette.primary }]}>{initials}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
          {user?.name ?? 'Your Name'}
        </Text>
        <Text style={[styles.email, { color: palette.muted }]} numberOfLines={1}>
          {user?.email ?? ''}
        </Text>
      </View>
      <ChevronRightIcon size={16} color={palette.muted} strokeWidth={1.5} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
