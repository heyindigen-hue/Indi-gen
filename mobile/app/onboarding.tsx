import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../lib/themeContext';
import { api } from '../lib/api';
import { ChipInput } from '../components/onboarding/ChipInput';
import { CheckIcon } from '../components/icons';

const { width: SCREEN_W } = Dimensions.get('window');

type CompanyInfo = {
  name: string;
  tagline: string;
  website: string;
  description: string;
  ideal_clients: string[];
  industries: string[];
  geography: string[];
  search_phrases: string[];
  budget_signals: string[];
  selected_plan: string;
};

const EMPTY_INFO: CompanyInfo = {
  name: '',
  tagline: '',
  website: '',
  description: '',
  ideal_clients: [],
  industries: [],
  geography: [],
  search_phrases: [],
  budget_signals: [],
  selected_plan: 'free',
};

const IDEAL_CLIENT_OPTIONS = [
  'D2C Brand', 'SaaS', 'SME', 'Healthcare', 'Logistics', 'Fintech',
  'Ecommerce', 'AgriTech', 'EduTech', 'RealEstate', 'Manufacturing', 'Startup',
];

const GEOGRAPHY_OPTIONS = [
  'India', 'USA', 'UK', 'Canada', 'Australia',
  'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat',
  'Telangana', 'West Bengal', 'Rajasthan', 'International',
];

const SEARCH_PHRASE_SUGGESTIONS = [
  'looking for developer', 'need to build app', 'hiring shopify dev',
  'building saas', 'need mobile app', 'looking for agency',
  'website redesign', 'need tech co-founder', 'MVP development',
  'React Native developer', 'Flutter developer', 'full stack developer',
  'digital marketing', 'SEO agency', 'social media management',
];

const BUDGET_SIGNAL_OPTIONS = [
  'International clients', '$5K-$10K budget', '$10K-$50K budget',
  'USD pricing', 'INR pricing', 'Equity + cash', 'Funded startup',
  'Series A+', 'Bootstrap', 'SME budget',
];

const PLAN_OPTIONS = [
  { id: 'free', name: 'Free', price: '₹0', tokens: '10 leads/day', features: 'Basic lead feed' },
  { id: 'starter', name: 'Starter', price: '₹1,499/mo', tokens: '500 tokens', features: 'AI drafts + export' },
  { id: 'pro', name: 'Pro', price: '₹4,999/mo', tokens: '2,500 tokens', features: 'Unlimited queries', popular: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', tokens: 'Unlimited', features: 'Dedicated support' },
];

type StepId =
  | 'welcome'
  | 'company_name'
  | 'what_you_sell'
  | 'ideal_client'
  | 'search_phrases'
  | 'geography'
  | 'plan'
  | 'finding_leads';

interface StepDef {
  id: StepId;
  title: string;
  subtitle: string;
}

const STEPS: StepDef[] = [
  { id: 'welcome', title: 'Wake up to\nbetter leads', subtitle: 'LeadHangover finds people already asking for what you sell — on LinkedIn, Reddit, and beyond.' },
  { id: 'company_name', title: 'Tell us about\nyour business', subtitle: 'This helps us find leads relevant to what you actually sell.' },
  { id: 'what_you_sell', title: 'What do you sell?', subtitle: 'Describe your product or service in your own words.' },
  { id: 'ideal_client', title: 'Who is your\nideal client?', subtitle: "Select all that apply — we'll tune the lead feed to match." },
  { id: 'search_phrases', title: 'What are they\nsaying online?', subtitle: 'Pick or add phrases your ideal customers use when they need help.' },
  { id: 'geography', title: 'Which markets\ndo you target?', subtitle: 'Select regions so we focus on the right geography.' },
  { id: 'plan', title: 'Choose your plan', subtitle: 'Start free — upgrade anytime as you grow.' },
  { id: 'finding_leads', title: 'Finding your\nfirst leads…', subtitle: 'Scanning the web for people who need exactly what you offer.' },
];

function ScrapeLoader({ phrases }: { phrases: string[] }) {
  const { palette } = useTheme();
  const [statusText, setStatusText] = useState('Starting scan...');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    let jobId: string | null = null;

    const finishAndNavigate = async () => {
      await SecureStore.setItemAsync('leadhangover_onboarded', 'true');
      router.replace('/(tabs)');
    };

    const kickoff = async () => {
      try {
        const { data } = await api.post('/scrape', {
          phrases: phrases.length > 0 ? phrases.slice(0, 3) : ['leads'],
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
            setStatusText(progress > 0 ? `Scanning... ${Math.round(progress)}%` : 'Scanning the web...');
          }
        } catch {
          clearInterval(timerRef.current!);
          finishAndNavigate();
        }
      }, 3000);
    };

    kickoff();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
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
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  title: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold', marginBottom: 10, textAlign: 'center' },
  status: { fontSize: 15, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

export default function OnboardingScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [info, setInfo] = useState<CompanyInfo>(EMPTY_INFO);
  const [saving, setSaving] = useState(false);

  const opacity = useSharedValue(1);

  const animateToStep = useCallback((next: number) => {
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setCurrentIndex)(next);
      opacity.value = withTiming(1, { duration: 200 });
    });
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const step = STEPS[currentIndex];
  const isLast = currentIndex === STEPS.length - 1;

  const updateField = <K extends keyof CompanyInfo>(key: K, val: CompanyInfo[K]) => {
    setInfo((prev) => ({ ...prev, [key]: val }));
  };

  const toggleChip = (key: keyof CompanyInfo, opt: string) => {
    const arr = info[key] as string[];
    updateField(key as any, arr.includes(opt) ? arr.filter((x) => x !== opt) : [...arr, opt]);
  };

  const canProceed = (): boolean => {
    if (step.id === 'company_name') return info.name.trim().length > 0;
    if (step.id === 'what_you_sell') return info.description.trim().length > 0;
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;
    if (currentIndex < STEPS.length - 1) {
      if (currentIndex === STEPS.length - 2) {
        await saveAndProceed();
      } else {
        animateToStep(currentIndex + 1);
      }
    }
  };

  const saveAndProceed = async () => {
    setSaving(true);
    try {
      await api.post('/me/company-profile', info);
    } catch {
      // Non-fatal: save failure should not block onboarding
    }
    setSaving(false);
    animateToStep(currentIndex + 1);
  };

  const goPrev = () => {
    if (currentIndex > 0) animateToStep(currentIndex - 1);
  };

  if (step.id === 'finding_leads') {
    return <ScrapeLoader phrases={info.search_phrases} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        {/* header row */}
        <View style={s.headerRow}>
          {currentIndex > 0 ? (
            <TouchableOpacity onPress={goPrev} style={s.backBtn}>
              <Text style={[s.backText, { color: palette.muted }]}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 56 }} />
          )}
          <View style={s.dotsRow}>
            {STEPS.slice(0, -1).map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  {
                    width: i === currentIndex ? 20 : 6,
                    backgroundColor: i <= currentIndex ? palette.primary : palette.border,
                  },
                ]}
              />
            ))}
          </View>
          <TouchableOpacity
            onPress={async () => {
              await SecureStore.setItemAsync('leadhangover_onboarded', 'true');
              router.replace('/(tabs)');
            }}
            style={s.skipBtn}
          >
            <Text style={[s.skipText, { color: palette.muted }]}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[s.content, animStyle]}>
            <Text style={[s.title, { color: palette.text }]}>{step.title}</Text>
            <Text style={[s.subtitle, { color: palette.muted }]}>{step.subtitle}</Text>

            {/* step-specific inputs */}
            {step.id === 'welcome' && (
              <View style={s.welcomeBloom}>
                <View style={[s.bloomCircle, { backgroundColor: palette.primary + '22' }]}>
                  <Text style={{ fontSize: 48 }}>✦</Text>
                </View>
              </View>
            )}

            {step.id === 'company_name' && (
              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: palette.muted }]}>Company name *</Text>
                <TextInput
                  style={[s.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text, borderRadius: radius / 2 }]}
                  placeholder="e.g. IndiGen Labs"
                  placeholderTextColor={palette.muted}
                  value={info.name}
                  onChangeText={(v) => updateField('name', v)}
                />
                <Text style={[s.fieldLabel, { color: palette.muted, marginTop: 16 }]}>One-line tagline</Text>
                <TextInput
                  style={[s.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text, borderRadius: radius / 2 }]}
                  placeholder="e.g. We build mobile apps for D2C brands"
                  placeholderTextColor={palette.muted}
                  value={info.tagline}
                  onChangeText={(v) => updateField('tagline', v)}
                />
                <Text style={[s.fieldLabel, { color: palette.muted, marginTop: 16 }]}>Website (optional)</Text>
                <TextInput
                  style={[s.input, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text, borderRadius: radius / 2 }]}
                  placeholder="https://yoursite.com"
                  placeholderTextColor={palette.muted}
                  autoCapitalize="none"
                  keyboardType="url"
                  value={info.website}
                  onChangeText={(v) => updateField('website', v)}
                />
              </View>
            )}

            {step.id === 'what_you_sell' && (
              <View style={s.fieldGroup}>
                <Text style={[s.fieldLabel, { color: palette.muted }]}>Describe what you sell *</Text>
                <TextInput
                  style={[
                    s.input,
                    s.textarea,
                    {
                      backgroundColor: palette.card,
                      borderColor: palette.border,
                      color: palette.text,
                      borderRadius: radius / 2,
                    },
                  ]}
                  placeholder="We build React Native apps for early-stage startups. Our clients are typically founders who want an MVP in 6-8 weeks."
                  placeholderTextColor={palette.muted}
                  multiline
                  numberOfLines={5}
                  value={info.description}
                  onChangeText={(v) => updateField('description', v)}
                  textAlignVertical="top"
                />
              </View>
            )}

            {step.id === 'ideal_client' && (
              <ChipInput
                options={IDEAL_CLIENT_OPTIONS}
                selected={info.ideal_clients}
                onToggle={(opt) => toggleChip('ideal_clients', opt)}
              />
            )}

            {step.id === 'search_phrases' && (
              <View style={{ width: '100%' }}>
                <ChipInput
                  options={SEARCH_PHRASE_SUGGESTIONS}
                  selected={info.search_phrases}
                  onToggle={(opt) => toggleChip('search_phrases', opt)}
                />
                {info.search_phrases.length === 0 && (
                  <Text style={[s.hint, { color: palette.muted }]}>
                    Select at least 1 phrase to get the best results
                  </Text>
                )}
              </View>
            )}

            {step.id === 'geography' && (
              <ChipInput
                options={GEOGRAPHY_OPTIONS}
                selected={info.geography}
                onToggle={(opt) => toggleChip('geography', opt)}
              />
            )}

            {step.id === 'plan' && (
              <View style={s.planGrid}>
                {PLAN_OPTIONS.map((plan) => {
                  const active = info.selected_plan === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => updateField('selected_plan', plan.id)}
                      style={[
                        s.planCard,
                        {
                          backgroundColor: active ? palette.primary + '15' : palette.card,
                          borderColor: active ? palette.primary : palette.border,
                          borderRadius: radius,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      {(plan as any).popular && (
                        <View style={[s.popularBadge, { backgroundColor: palette.primary }]}>
                          <Text style={[s.popularText, { color: palette.primaryFg }]}>★ Popular</Text>
                        </View>
                      )}
                      {active && (
                        <View style={s.checkBadge}>
                          <CheckIcon size={14} color={palette.primary} strokeWidth={2.5} />
                        </View>
                      )}
                      <Text style={[s.planName, { color: palette.text }]}>{plan.name}</Text>
                      <Text style={[s.planPrice, { color: active ? palette.primary : palette.muted }]}>
                        {plan.price}
                      </Text>
                      <Text style={[s.planTokens, { color: palette.muted }]}>{plan.tokens}</Text>
                      <Text style={[s.planFeature, { color: palette.muted }]}>{plan.features}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!canProceed() || saving}
          style={[
            s.nextBtn,
            {
              backgroundColor: canProceed() ? palette.primary : palette.border,
              borderRadius: radius,
              opacity: saving ? 0.7 : 1,
            },
          ]}
          activeOpacity={0.88}
        >
          {saving ? (
            <ActivityIndicator color={palette.primaryFg} />
          ) : (
            <Text style={[s.nextText, { color: canProceed() ? palette.primaryFg : palette.muted }]}>
              {isLast ? 'Get started' : currentIndex === STEPS.length - 2 ? 'Find my leads' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: { padding: 4, width: 56 },
  backText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  skipBtn: { padding: 4, width: 56, alignItems: 'flex-end' },
  skipText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: { height: 5, borderRadius: 2.5 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  content: { flex: 1, paddingTop: 24 },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
    marginBottom: 8,
  },
  welcomeBloom: {
    alignItems: 'center',
    marginTop: 40,
  },
  bloomCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldGroup: { marginTop: 8, width: '100%' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  textarea: {
    height: 120,
    paddingTop: 12,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 12,
  },
  planGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  planCard: {
    width: (SCREEN_W - 48 - 10) / 2,
    borderWidth: 1.5,
    padding: 16,
    position: 'relative',
    gap: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  popularText: { fontSize: 9, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  planName: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  planPrice: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  planTokens: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  planFeature: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  nextBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  nextText: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
