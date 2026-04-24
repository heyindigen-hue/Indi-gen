import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Props = {
  message?: string;
  dismissible?: boolean;
  onAction?: (action: string) => void;
};

export default function AnnouncementBanner({ message, dismissible = true }: Props) {
  const { palette, radius } = useTheme();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !message) return null;

  return (
    <View style={{
      backgroundColor: palette.primary + '22',
      borderRadius: radius,
      borderWidth: 0.5,
      borderColor: palette.primary + '66',
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <Text style={{ flex: 1, color: palette.text, fontSize: 13, fontFamily: 'Inter_400Regular' }}>
        {message}
      </Text>
      {dismissible && (
        <TouchableOpacity onPress={() => setDismissed(true)} style={{ marginLeft: 8, padding: 4 }}>
          <Text style={{ color: palette.muted, fontSize: 16 }}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
