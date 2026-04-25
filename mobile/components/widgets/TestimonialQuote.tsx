import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../lib/themeContext';

type Quote = { text: string; author: string; role?: string };

const DEFAULT_QUOTES: Quote[] = [
  { text: 'Found 40 verified buyers in one week. This is insane.', author: 'Arjun S.', role: 'SaaS Founder' },
  { text: 'Saved 6 hours a week on lead research. Worth every rupee.', author: 'Priya K.', role: 'Agency Owner' },
  { text: 'Best investment I\'ve made for my D2C brand outreach.', author: 'Rohan M.', role: 'E-commerce CEO' },
  { text: 'Reply rates tripled after switching to Indi-gen phrases.', author: 'Meera T.', role: 'Freelance Consultant' },
];

type Props = {
  set_id?: string;
};

export default function TestimonialQuote({ set_id = 'default' }: Props) {
  const { palette, radius } = useTheme();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % DEFAULT_QUOTES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const quote = DEFAULT_QUOTES[idx];

  return (
    <View
      style={{
        backgroundColor: palette.card,
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.border,
        padding: 18,
      }}
    >
      <Text
        style={{
          color: palette.primary,
          fontSize: 32,
          fontFamily: 'Fraunces_700Bold',
          lineHeight: 32,
          opacity: 0.5,
          marginBottom: -8,
        }}
      >
        "
      </Text>
      <Text
        style={{
          color: palette.text,
          fontSize: 14,
          fontFamily: 'Fraunces_400Regular',
          lineHeight: 22,
          fontStyle: 'italic',
          marginTop: 4,
        }}
      >
        {quote.text}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: palette.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.primary, fontSize: 13, fontWeight: '700' }}>
            {quote.author.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={{ color: palette.text, fontSize: 13, fontFamily: 'Inter_600SemiBold', fontWeight: '600' }}>
            {quote.author}
          </Text>
          {quote.role ? (
            <Text style={{ color: palette.muted, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
              {quote.role}
            </Text>
          ) : null}
        </View>
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 3 }}>
          {DEFAULT_QUOTES.map((_, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: i === idx ? palette.primary : palette.border,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
}
