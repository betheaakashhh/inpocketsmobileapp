import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { GradientBackground } from '@/components/GradientBackground';
import { Icon } from '@/components/Icon';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { reloadOnboarding, useOnboarding } from '@/features/onboarding/useOnboarding';

/**
 * Sits between "we know you're logged in" and "we know where to send you"
 * while GET /onboarding + profile/pan/kyc/identity load in parallel. Doubles
 * as the retry screen if that fetch fails (e.g. backend unreachable).
 */
export default function LoadingRoute() {
  const { colors } = useTheme();
  const { isError } = useOnboarding();

  return (
    <GradientBackground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl }}>
        {isError ? (
          <View style={{ alignItems: 'center' }}>
            <Icon name="cloud-off" size={40} color={colors.danger} />
            <AppText variant="headlineSmall" style={{ marginTop: Spacing.md, textAlign: 'center' }}>Couldn't reach InPockets</AppText>
            <AppText variant="bodyMedium" style={{ marginTop: Spacing.xs, textAlign: 'center' }}>
              Check that the backend is running and reachable from your phone, then try again.
            </AppText>
            <View style={{ height: Spacing.lg }} />
            <PrimaryButton label="Retry" fullWidth={false} onPress={() => reloadOnboarding()} />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText variant="bodyMedium" style={{ marginTop: Spacing.lg }}>Setting things up…</AppText>
          </View>
        )}
      </View>
    </GradientBackground>
  );
}
