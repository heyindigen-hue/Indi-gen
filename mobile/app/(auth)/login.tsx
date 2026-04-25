import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../store/auth';
import { useTheme } from '../../lib/themeContext';

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function LoginScreen() {
  const { palette, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { setAuth } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await api.post('/auth/login', { email: data.email, password: data.password });
      await setAuth(res.data.token, res.data.user);
      const needsOnboarding = res.data.needs_onboarding || res.data.user?.needs_onboarding;
      if (needsOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setServerError(err?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold', color: palette.text, marginBottom: 8 }}>
          Welcome back
        </Text>
        <Text style={{ fontSize: 15, color: palette.muted, fontFamily: 'Inter_400Regular', marginBottom: 32 }}>
          Sign in to your Indi-gen account
        </Text>

        <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 }}>Email</Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                backgroundColor: palette.card,
                borderWidth: 0.5,
                borderColor: errors.email ? palette.destructive : palette.border,
                borderRadius: radius,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: palette.text,
                fontSize: 15,
                fontFamily: 'Inter_400Regular',
                marginBottom: 4,
              }}
              placeholder="you@example.com"
              placeholderTextColor={palette.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.email && (
          <Text style={{ color: palette.destructive, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 12 }}>
            {errors.email.message}
          </Text>
        )}

        <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6, marginTop: 8 }}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={{
                backgroundColor: palette.card,
                borderWidth: 0.5,
                borderColor: errors.password ? palette.destructive : palette.border,
                borderRadius: radius,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: palette.text,
                fontSize: 15,
                fontFamily: 'Inter_400Regular',
                marginBottom: 4,
              }}
              placeholder="••••••••"
              placeholderTextColor={palette.muted}
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />
        {errors.password && (
          <Text style={{ color: palette.destructive, fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 12 }}>
            {errors.password.message}
          </Text>
        )}

        {serverError && (
          <Text style={{ color: palette.destructive, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 12, marginTop: 4 }}>
            {serverError}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={{
            backgroundColor: palette.primary,
            borderRadius: radius,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 16,
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting
            ? <ActivityIndicator color={palette.primaryFg} />
            : <Text style={{ color: palette.primaryFg, fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' }}>Sign in</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/phone')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: palette.muted, fontSize: 13, fontFamily: 'Inter_500Medium' }}>
            Sign in with phone instead
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
