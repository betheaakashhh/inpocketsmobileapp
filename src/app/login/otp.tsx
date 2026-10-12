import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TextLinkButton } from '@/components/Buttons';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GradientBackground } from '@/components/GradientBackground';
import { Icon } from '@/components/Icon';
import { OtpInput, OtpInputHandle } from '@/components/OtpInput';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { useOtpFlow } from '@/features/auth/otpFlowStore';

export default function OtpVerifyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const flow = useOtpFlow();
  const otpRef = useRef<OtpInputHandle>(null);

  const maskedPhone = flow.phoneNumber.length === 10 ? `+91 ${Fmt.phoneGrouped(flow.phoneNumber)}` : flow.phoneNumber;
  const canResend = flow.resendCooldown <= 0 && !flow.isSubmitting;

  const handleCompleted = async (code: string) => {
    const ok = await flow.verifyOtp(code);
    if (!ok) otpRef.current?.clear();
    // On success the route gate reacts to the auth change — no navigation here.
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1, padding: Spacing.lg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={() => { flow.reset(); router.replace(Routes.login); }}
            hitSlop={12}
            accessibilityLabel="Back"
            style={{ alignSelf: 'flex-start', paddingVertical: Spacing.sm }}
          >
            <Icon name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <View style={{ flex: 2 }} />
          <FadeSlideIn><AppText variant="displayMedium">Enter the code</AppText></FadeSlideIn>
          <FadeSlideIn delay={60} style={{ marginTop: Spacing.sm }}>
            <AppText variant="bodyMedium">
              We've sent a 6-digit code to <AppText variant="bodyMedium" color={colors.text} style={{ fontFamily: 'Inter_700Bold' }}>{maskedPhone}</AppText>
            </AppText>
          </FadeSlideIn>

          <FadeSlideIn delay={110} style={{ marginTop: Spacing.xl }}>
            <OtpInput
              ref={otpRef}
              length={6}
              enabled={!flow.isSubmitting}
              hasError={flow.otpError !== null}
              onChange={() => { if (flow.otpError) flow.clearOtpError(); }}
              onCompleted={handleCompleted}
            />
          </FadeSlideIn>

          {flow.otpError ? (
            <AppText variant="bodySmall" color={colors.danger} style={{ marginTop: Spacing.sm }}>{flow.otpError}</AppText>
          ) : null}

          {flow.isSubmitting ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <AppText variant="bodyMedium">Verifying…</AppText>
            </View>
          ) : null}

          <View style={{ flex: 3 }} />
          <FadeSlideIn delay={160} style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            {canResend ? (
              <TextLinkButton label="Didn't get it? Resend code" onPress={() => flow.resend()} />
            ) : (
              <AppText variant="bodySmall">Resend code in {flow.resendCooldown}s</AppText>
            )}
          </FadeSlideIn>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
