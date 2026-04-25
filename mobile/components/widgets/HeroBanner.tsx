import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '../../lib/themeContext';

type Props = {
  title?: string;
  subtitle?: string;
  illustration_id?: string;
  cta_label?: string;
  cta_route?: string;
  onAction?: (action: string) => void;
};

const ILLUSTRATION_URLS: Record<string, any> = {
  'hero-onboarding': require('../../assets/illustrations/hero-onboarding.png'),
};

export default function HeroBanner({
  title = 'Wake up to better leads',
  subtitle = '3 new buyers found overnight',
  illustration_id,
  cta_label = 'View leads',
  cta_route = '/(tabs)/explore',
  onAction,
}: Props) {
  const { palette, radius } = useTheme();

  const handleCta = () => {
    onAction?.('hero_cta');
    if (cta_route) router.push(cta_route as any);
  };

  const imgSrc = illustration_id ? ILLUSTRATION_URLS[illustration_id] : null;

  return (
    <View
      style={{
        backgroundColor: palette.primary + '12',
        borderRadius: radius,
        borderWidth: 0.5,
        borderColor: palette.primary + '30',
        padding: 20,
        overflow: 'hidden',
        minHeight: 110,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: palette.text,
              fontSize: 18,
              fontFamily: 'Fraunces_700Bold',
              lineHeight: 22,
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: palette.muted,
                fontSize: 13,
                fontFamily: 'Inter_400Regular',
                marginTop: 4,
                lineHeight: 18,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
          {cta_label ? (
            <TouchableOpacity
              onPress={handleCta}
              activeOpacity={0.8}
              style={{
                alignSelf: 'flex-start',
                marginTop: 14,
                backgroundColor: palette.primary,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: radius / 2,
              }}
            >
              <Text
                style={{
                  color: palette.primaryFg,
                  fontSize: 13,
                  fontWeight: '600',
                  fontFamily: 'Inter_600SemiBold',
                }}
              >
                {cta_label}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {imgSrc ? (
          <Image
            source={imgSrc}
            style={{ width: 72, height: 72, opacity: 0.85 }}
            resizeMode="contain"
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: palette.primary + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 28 }}>🎯</Text>
          </View>
        )}
      </View>
    </View>
  );
}
