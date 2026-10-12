import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GradientBackground } from '@/components/GradientBackground';
import { SuccessCheck } from '@/components/SuccessCheck';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';

/** Spec: checkmark -> heading -> supporting message -> CTA. */
export default function OnboardingCompleteScreen() {
  const router = useRouter();
  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg }}>
          <SuccessCheck size={110} />
          <FadeSlideIn delay={500} style={{ marginTop: Spacing.lg }}>
            <AppText variant="displayMedium" style={{ textAlign: 'center' }}>You're all set!</AppText>
          </FadeSlideIn>
          <FadeSlideIn delay={560} style={{ marginTop: Spacing.sm }}>
            <AppText variant="bodyMedium" style={{ textAlign: 'center' }}>
              Your account is verified. You can now apply for a loan and track it right from your dashboard.
            </AppText>
          </FadeSlideIn>
          <FadeSlideIn delay={620} style={{ marginTop: Spacing.xl }}>
            <PrimaryButton label="Go to dashboard" fullWidth={false} onPress={() => router.replace(Routes.home)} />
          </FadeSlideIn>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}
