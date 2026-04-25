import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { MMKV } from 'react-native-mmkv';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

const mmkv = new MMKV({ id: 'announcements' });

function isDismissed(id: string): boolean {
  return mmkv.getBoolean(`dismissed_${id}`) ?? false;
}

function markDismissed(id: string): void {
  mmkv.set(`dismissed_${id}`, true);
}

type Announcement = {
  id: string;
  message: string;
  url?: string;
  route?: string;
};

type Props = {
  message?: string;
  dismissible?: boolean;
  onAction?: (action: string) => void;
};

export default function AnnouncementBanner({ message: staticMessage, dismissible = true, onAction }: Props) {
  const { palette, radius } = useTheme();

  const { data, isLoading } = useQuery<Announcement | null>({
    queryKey: ['announcement'],
    queryFn: async () => {
      try {
        const res = await api.get<Announcement | null>('/public/announcement');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  // Use API data if available, fall back to static prop
  const announcement = data ?? (staticMessage ? { id: 'static', message: staticMessage } : null);

  const [localDismissed, setLocalDismissed] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (announcement?.id) {
      setLocalDismissed(isDismissed(announcement.id));
    }
  }, [announcement?.id]);

  if (isLoading || !announcement || localDismissed) return null;

  const handleDismiss = () => {
    if (announcement.id) markDismissed(announcement.id);
    setLocalDismissed(true);
    onAction?.('dismissed');
  };

  const handlePress = () => {
    if (announcement.url) {
      Linking.openURL(announcement.url);
    } else if (announcement.route) {
      router.push(announcement.route as any);
    }
    onAction?.('tapped');
  };

  const isClickable = !!(announcement.url || announcement.route);

  return (
    <TouchableOpacity
      activeOpacity={isClickable ? 0.75 : 1}
      onPress={isClickable ? handlePress : undefined}
      style={{
        backgroundColor: palette.primary + '1A',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.primary + '55',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <Text style={{ fontSize: 14, marginRight: 8 }}>📣</Text>
      <Text
        style={{
          flex: 1,
          color: palette.text,
          fontSize: 13,
          lineHeight: 19,
          fontFamily: 'Inter_400Regular',
        }}
      >
        {announcement.message}
      </Text>
      {dismissible && (
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: palette.muted, fontSize: 18, lineHeight: 20, marginLeft: 8 }}>×</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}
