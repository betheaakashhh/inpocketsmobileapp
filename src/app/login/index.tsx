import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/Buttons';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { GradientBackground } from '@/components/GradientBackground';
import { TextField } from '@/components/TextField';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { Validators } from '@/core/utils/validators';
import { useOtpFlow } from '@/features/auth/otpFlowStore';

export default function PhoneEntryScreen() {
  const router = useRouter();
  const flow = useOtpFlow();
  const [phone, setPhone] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async () => {
    const error = Validators.phoneNumber(phone);
    setLocalError(error);
    if (error) return;
    Keyboard.dismiss();
    const ok = await flow.sendOtp(phone.trim());
    if (ok) router.replace(Routes.loginOtp);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: Spacing.lg }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ flex: 2 }} />
            <FadeSlideIn><BrandMark size={56} /></FadeSlideIn>
            <FadeSlideIn delay={60} style={{ marginTop: Spacing.lg }}>
              <AppText variant="displayMedium">Welcome to InPockets</AppText>
            </FadeSlideIn>
            <FadeSlideIn delay={110} style={{ marginTop: Spacing.sm }}>
              <AppText variant="bodyMedium">Enter your mobile number — we'll text you a code to sign in or create your account.</AppText>
            </FadeSlideIn>
            <FadeSlideIn delay={160} style={{ marginTop: Spacing.xl }}>
              <TextField
                label="Mobile number"
                value={phone}
                onChangeText={(t) => { setPhone(t.replace(/\D/g, '')); if (localError) setLocalError(null); }}
                placeholder="98765 43210"
                prefixText="+91  "
                keyboardType="phone-pad"
                maxLength={10}
                autoFocus
                errorText={localError ?? flow.errorMessage}
                onSubmitEditing={submit}
              />
            </FadeSlideIn>
            <View style={{ flex: 3, minHeight: Spacing.xl }} />
            <FadeSlideIn delay={200}>
              <PrimaryButton label="Send OTP" isLoading={flow.isSubmitting} onPress={submit} />
            </FadeSlideIn>
            <FadeSlideIn delay={240} style={{ marginTop: Spacing.md, alignItems: 'center' }}>
              <AppText variant="bodySmall" style={{ textAlign: 'center' }}>By continuing, you agree to InPockets’ Terms & Privacy Policy.</AppText>
            </FadeSlideIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
