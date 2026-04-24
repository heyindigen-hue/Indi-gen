import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useManifest } from '../lib/useManifest';
import { useTheme } from '../lib/themeContext';
import { api } from '../lib/api';
import { CheckIcon } from '../components/icons';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

type Step = {
  id: string;
  title: string;
  description: string;
  input_type: 'none' | 'chip_select' | 'done';
  options?: string[];
  field?: string;
};

function ChipSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
}) {
  const { palette, radius } = useTheme();
  return (
    <View style={cs.wrap}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onToggle(opt)}
            style={[
              cs.chip,
              {
                backgroundColor: active ? palette.primary : palette.card,
                borderColor: active ? palette.primary : palette.border,
                borderRadius: radius,
              },
            ]}
            activeOpacity={0.8}
          >
            {active ? (
              <CheckIcon size={13} color={palette.primaryFg} strokeWidth={2} />
            ) : null}
            <Text
              style={[
                cs.chipText,
                { color: active ? palette.primaryFg : palette.text },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const cs = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginTop: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});

function ScrapeLoader({ phrases }: { phrases: string[] }) {
  const { palette } = useTheme();
  const [statusText, setStatusText] = useState('Starting scan...');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    let jobId: string | null = null;

    const kickoff = async () => {
      try {
        const { data } = await api.post('/scrape', {
          phrases: phrases.length > 0 ? phrases : ['leads'],
          limit: 25,
        });
        jobId = data?.job_id ?? data?.id ?? null;
        if (jobId) poll(jobId);
        else finishAndNavigate();
      } catch {
        finishAndNavigate();
      }
    };

    const poll = (id: string) => {
      timerRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/scrape/jobs/${id}`);
          const status: string = data?.status ?? '';
          const progress: number = data?.progress ?? 0;
          if (status === 'completed' || status === 'done') {
            clearInterval(timerRef.current!);
            setStatusText('Done! Loading your leads...');
            setTimeout(finishAndNavigate, 600);
          } else if (status === 'failed') {
            clearInterval(timerRef.current!);
            finishAndNavigate();
          } else {
            setStatusText(
              progress > 0 ? `Scanning... ${Math.round(progress)}%` : 'Scanning the web...'
            );
          }
        } catch {
          clearInterval(timerRef.current!);
          finishAndNavigate();
        }
      }, 3000);
    };

    const finishAndNavigate = () => router.replace('/(tabs)');

    kickoff();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={[sl.root, { backgroundColor: palette.bg }]}>
      <ActivityIndicator size="large" color={palette.primary} style={{ marginBottom: 24 }} />
      <Text style={[sl.title, { color: palette.text }]}>Finding your leads</Text>
      <Text style={[sl.status, { color: palette.muted }]}>{statusText}</Text>
    </View>
  );
}

const sl = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  status: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});

export default function OnboardingScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: manifest } = useManifest();

  const steps: Step[] = (manifest?.onboarding_steps ?? []) as Step[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState<Record<string, string[]>>({});
  const [scraping, setScraping] = useState(false);

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animateToNext = (nextIndex: number) => {
    opacity.value = withTiming(0, { duration: 160 }, () => {
      runOnJS(setCurrentIndex)(nextIndex);
      translateX.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    });
  };

  const animateToPrev = (prevIndex: number) => {
    opacity.value = withTiming(0, { duration: 160 }, () => {
      runOnJS(setCurrentIndex)(prevIndex);
      translateX.value = 0;
      opacity.value = withTiming(1, { duration: 200 });
    });
  };

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      animateToNext(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) animateToPrev(currentIndex - 1);
  };

  const handleFinish = () => {
    const lastStep = steps[steps.length - 1];
    if (lastStep?.input_type === 'done' || currentIndex === steps.length - 1) {
      const phrases = (Object.values(fieldValues).flat() as string[]);
      setScraping(true);
      setTimeout(() => {}, 0);
      return;
    }
    router.replace('/(tabs)');
  };

  const toggleChip = (field: string, opt: string) => {
    setFieldValues((prev) => {
      const cur = prev[field] ?? [];
      const next = cur.includes(opt) ? cur.filter((x) => x !== opt) : [...cur, opt];
      return { ...prev, [field]: next };
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = e.translationX * 0.3;
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        translateX.value = withSpring(0);
        runOnJS(goPrev)();
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  if (steps.length === 0) {
    router.replace('/(tabs)');
    return null;
  }

  if (scraping) {
    const phrases = Object.values(fieldValues).flat() as string[];
    return <ScrapeLoader phrases={phrases} />;
  }

  const step = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;
  const stepPhrases: string[] =
    step.field ? (fieldValues[step.field] ?? []) : [];

  const stepIcon = ['✦', '⚡', '🚀'][currentIndex] ?? '✦';

  return (
    <View
      style={[
        s.root,
        {
          backgroundColor: palette.bg,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
        },
      ]}
    >
      {/* skip */}
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)')}
        style={s.skipBtn}
      >
        <Text style={[s.skipText, { color: palette.muted }]}>Skip</Text>
      </TouchableOpacity>

      {/* step content */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[s.content, animStyle]}>
          <View style={[s.iconCircle, { backgroundColor: palette.primary + '22' }]}>
            <Text style={s.stepIcon}>{stepIcon}</Text>
          </View>

          <Text style={[s.title, { color: palette.text }]}>{step.title}</Text>
          <Text style={[s.description, { color: palette.muted }]}>{step.description}</Text>

          {step.input_type === 'chip_select' && step.options && step.field ? (
            <ChipSelect
              options={step.options}
              selected={stepPhrases}
              onToggle={(opt) => toggleChip(step.field!, opt)}
            />
          ) : null}
        </Animated.View>
      </GestureDetector>

      {/* progress dots */}
      <View style={s.dotsRow}>
        {steps.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              {
                width: i === currentIndex ? 20 : 6,
                backgroundColor: i === currentIndex ? palette.primary : palette.border,
              },
            ]}
          />
        ))}
      </View>

      {/* next button */}
      <TouchableOpacity
        onPress={goNext}
        style={[s.nextBtn, { backgroundColor: palette.primary, borderRadius: radius }]}
        activeOpacity={0.88}
      >
        <Text style={[s.nextText, { color: palette.primaryFg }]}>
          {isLast ? 'Get started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  stepIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
