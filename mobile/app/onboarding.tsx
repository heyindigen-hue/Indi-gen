import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useManifest } from '../lib/useManifest';
import { useTheme } from '../lib/themeContext';

const { width } = Dimensions.get('window');

type Step = { id: string; title: string; description: string; image?: string | null };

export default function OnboardingScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: manifest } = useManifest();
  const [currentIndex, setCurrentIndex] = useState(0);

  const steps: Step[] = manifest?.onboarding_steps || [];

  const onNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.replace('/(tabs)');
    }
  };

  const onSkip = () => router.replace('/(tabs)');

  const step = steps[currentIndex];

  if (steps.length === 0) {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: palette.bg,
      paddingTop: insets.top + 16,
      paddingBottom: insets.bottom + 24,
      paddingHorizontal: 24,
    }}>
      <TouchableOpacity onPress={onSkip} style={{ alignSelf: 'flex-end', padding: 4 }}>
        <Text style={{ color: palette.muted, fontSize: 14, fontFamily: 'Inter_400Regular' }}>Skip</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: palette.primary + '22',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 32,
        }}>
          <Text style={{ fontSize: 32 }}>{currentIndex === 0 ? '✦' : currentIndex === 1 ? '⚡' : '🚀'}</Text>
        </View>

        <Text style={{
          fontSize: 26, fontWeight: '700', fontFamily: 'Inter_700Bold',
          color: palette.text, textAlign: 'center', marginBottom: 14,
        }}>
          {step.title}
        </Text>
        <Text style={{
          fontSize: 15, fontFamily: 'Inter_400Regular',
          color: palette.muted, textAlign: 'center', lineHeight: 24,
        }}>
          {step.description}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 28 }}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === currentIndex ? 20 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === currentIndex ? palette.primary : palette.border,
              marginHorizontal: 3,
            }}
          />
        ))}
      </View>

      <TouchableOpacity
        onPress={onNext}
        style={{
          backgroundColor: palette.primary,
          borderRadius: radius,
          paddingVertical: 14,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: palette.primaryFg, fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>
          {currentIndex < steps.length - 1 ? 'Next' : 'Get started'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
