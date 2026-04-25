import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type ReleaseNote = { title: string; description?: string; tag?: string };

const STATIC_NOTES: ReleaseNote[] = [
  { title: 'AI phrase suggestions', description: 'Get smarter search phrases powered by AI', tag: 'New' },
  { title: 'Bulk outreach', description: 'Send personalised messages to multiple leads at once', tag: 'New' },
  { title: 'Dark mode', description: 'Easy on the eyes, day or night', tag: 'Update' },
  { title: 'Improved scrape speed', description: '2× faster lead discovery', tag: 'Performance' },
  { title: 'CSV export', description: 'Export your leads to spreadsheet', tag: 'Update' },
];

type Props = {
  limit?: number;
};

const TAG_COLORS: Record<string, string> = {
  New: '#F97316',
  Update: '#3B82F6',
  Performance: '#10B981',
  Fix: '#8B5CF6',
};

export default function WhatsNewCard({ limit = 3 }: Props) {
  const { palette, radius } = useTheme();

  const notes = STATIC_NOTES.slice(0, limit);

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: palette.border }}>
        <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
          🎉 What's New
        </Text>
      </View>
      {notes.map((note, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderTopWidth: i === 0 ? 0 : 0.5,
            borderTopColor: palette.border,
          }}
        >
          <View
            style={{
              marginTop: 2,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: (TAG_COLORS[note.tag ?? 'New'] ?? palette.primary) + '18',
            }}
          >
            <Text
              style={{
                color: TAG_COLORS[note.tag ?? 'New'] ?? palette.primary,
                fontSize: 9,
                fontFamily: 'Inter_600SemiBold',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {note.tag ?? 'New'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
              {note.title}
            </Text>
            {note.description ? (
              <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 16 }}>
                {note.description}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </View>
  );
}
