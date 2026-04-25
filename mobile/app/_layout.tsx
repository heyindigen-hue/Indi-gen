import { Stack, router } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../lib/themeContext';
import { useManifest } from '../lib/useManifest';
import { AnimatedSplash } from '../components/AnimatedSplash';
import { useTheme } from '../lib/themeContext';
import { api } from '../lib/api';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  if (Platform.OS === 'web') return;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    const finalStatus =
      existing === 'granted'
        ? existing
        : (await Notifications.requestPermissionsAsync()).status;
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    await api.post('/me/push-token', {
      token: tokenData.data,
      platform: Platform.OS as 'android' | 'ios',
    });
  } catch {
    // Non-fatal: push token registration failure should not crash the app
  }
}

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

type BootState = 'loading' | 'unauth' | 'onboarding' | 'auth';

function AppContent({ bootState }: { bootState: BootState }) {
  const { palette, effectiveScheme } = useTheme();
  const notifListener = useRef<any>(null);

  useEffect(() => {
    if (bootState !== 'auth') return;
    registerPushToken();
    notifListener.current = Notifications.addNotificationReceivedListener(() => {});
    return () => {
      if (notifListener.current) Notifications.removeNotificationSubscription(notifListener.current);
    };
  }, [bootState]);

  useEffect(() => {
    if (bootState === 'loading') return;
    if (bootState === 'unauth') router.replace('/(auth)/login');
    else if (bootState === 'onboarding') router.replace('/onboarding');
    // 'auth' → (tabs) is already the default route shown by the Stack
  }, [bootState]);

  return (
    <>
      <StatusBar style={effectiveScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lead/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}

function Content() {
  const { data: manifest, isLoading } = useManifest();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [bootState, setBootState] = useState<BootState>('loading');

  const fontMap: Record<string, any> = {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    GeistMono_400Regular,
  };

  try {
    const fraunces = require('@expo-google-fonts/fraunces');
    if (fraunces?.Fraunces_600SemiBold) fontMap['Fraunces_600SemiBold'] = fraunces.Fraunces_600SemiBold;
    if (fraunces?.Fraunces_400Regular) fontMap['Fraunces_400Regular'] = fraunces.Fraunces_400Regular;
  } catch {}

  const [fontsLoaded] = useFonts(fontMap);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
      setAppReady(true);
      (async () => {
        try {
          const token = await SecureStore.getItemAsync('leadhangover_token');
          if (!token) {
            setBootState('unauth');
            return;
          }
          const onboarded = (await SecureStore.getItemAsync('leadhangover_onboarded')) === 'true';
          setBootState(onboarded ? 'auth' : 'onboarding');
        } catch {
          setBootState('unauth');
        }
      })();
    }
  }, [fontsLoaded, isLoading]);

  if (!appReady) return null;

  return (
    <ThemeProvider manifest={manifest}>
      {showSplash && <AnimatedSplash onComplete={() => setShowSplash(false)} />}
      <AppContent bootState={bootState} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={qc}>
          <BottomSheetModalProvider>
            <Content />
          </BottomSheetModalProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
