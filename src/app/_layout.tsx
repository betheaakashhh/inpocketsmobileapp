import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRootNavigationState, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/Toast';
import { queryClient } from '@/core/queryClient';
import { resolveRedirect } from '@/core/routing/gate';
import { ThemeProvider, useTheme } from '@/core/theme/ThemeProvider';
import { Fonts } from '@/core/theme/typography';
import { useAuthStore } from '@/features/auth/authStore';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Minimum time the animated brand splash stays up (spec: brand intro 600–1200 ms). */
const MIN_SPLASH_MS = 1100;

function Shell({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { colors, isDark, hydrated } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const navKey = useRootNavigationState()?.key;

  const authStatus = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const onboarding = useOnboarding();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    bootstrap();
    const t = setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);
    return () => clearTimeout(t);
  }, [bootstrap]);

  const ready = fontsLoaded && hydrated;
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    if (!ready || !navKey) return;
    const target = resolveRedirect({
      pathname,
      authStatus,
      splashDone,
      onboarding: { isLoading: onboarding.isLoading, isError: onboarding.isError, snapshot: onboarding.snapshot },
    });
    if (target && target !== pathname) router.replace(target);
  }, [ready, navKey, pathname, authStatus, splashDone, onboarding.isLoading, onboarding.isError, onboarding.snapshot, router]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.bg },
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: Fonts.sora600, fontSize: 18, color: colors.text },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Sora_600SemiBold, Sora_700Bold, Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <Shell fontsLoaded={fontsLoaded} />
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
