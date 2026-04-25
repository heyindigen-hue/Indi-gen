import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '../../lib/themeContext';
import { api } from '../../lib/api';

type Lesson = { id: string; title: string; body: string; emoji?: string };

type Props = {
  lesson_set_id?: string;
  onAction?: (action: string) => void;
};

const FALLBACK_LESSONS: Lesson[] = [
  { id: '1', emoji: '💡', title: 'Use 3-word phrases', body: 'Shorter phrases get 2× more leads per scrape than full sentences.' },
  { id: '2', emoji: '🎯', title: 'Target job roles', body: 'Leads with "founder" or "owner" in title reply 40% more often.' },
  { id: '3', emoji: '⚡', title: 'Send within 24h', body: 'Outreach sent within 24h of saving a lead gets 3× more replies.' },
];

export default function LessonCard({ lesson_set_id = 'default', onAction }: Props) {
  const { palette, radius } = useTheme();
  const [idx, setIdx] = useState(0);

  const { data } = useQuery<Lesson[]>({
    queryKey: ['lessons', lesson_set_id],
    queryFn: async () => {
      const res = await api.get<Lesson[]>(`/lessons?set=${lesson_set_id}`);
      return res.data;
    },
    staleTime: 3_600_000,
  });

  const lessons = (data?.length ? data : FALLBACK_LESSONS);
  const lesson = lessons[idx % lessons.length];

  const handleNext = () => {
    onAction?.('lesson_next');
    setIdx((i) => (i + 1) % lessons.length);
  };

  return (
    <View
      style={{
        backgroundColor: '#EFF6FF',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: '#BFDBFE',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <Text style={{ fontSize: 28 }}>{lesson.emoji ?? '💡'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#1E3A8A', fontSize: 14, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
            {lesson.title}
          </Text>
          <Text style={{ color: '#3B82F6', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4, lineHeight: 18 }}>
            {lesson.body}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {lessons.slice(0, Math.min(lessons.length, 5)).map((_, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: i === idx % lessons.length ? '#3B82F6' : '#BFDBFE',
              }}
            />
          ))}
        </View>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
          <Text style={{ color: '#3B82F6', fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
            Next tip →
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
