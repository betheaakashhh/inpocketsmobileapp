import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { CheckboxRow } from '@/components/Checkbox';
import { InfoRow } from '@/components/InfoRow';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { VerificationStatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { onboardingActions, refreshQuietly, useOnboarding } from '@/features/onboarding/useOnboarding';

export default function KycScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { snapshot } = useOnboarding();
  const kyc = snapshot?.kyc ?? null;

  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const poll = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll every 5 s while the provider is working (PENDING / PROCESSING).
  useEffect(() => {
    const shouldPoll = kyc?.status === 'PENDING' || kyc?.status === 'PROCESSING';
    if (shouldPoll && !poll.current) {
      poll.current = setInterval(() => { refreshQuietly(); }, 5000);
    } else if (!shouldPoll && poll.current) {
      clearInterval(poll.current);
      poll.current = null;
    }
  }, [kyc?.status]);
  useEffect(() => () => { if (poll.current) clearInterval(poll.current); }, []);

  const startKyc = async () => {
    setSubmitting(true);
    try {
      await onboardingActions.grantKycConsentAndInitiate();
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openConsentUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      toast.show("Couldn't open the verification link.", 'error');
    }
  };

  const isPending = kyc?.status === 'PENDING' || kyc?.status === 'PROCESSING';

  const footer = kyc === null
    ? <PrimaryButton label="Start KYC verification" isLoading={submitting} onPress={consent ? startKyc : undefined} />
    : isPending && kyc.consentUrl
      ? <SecondaryButton label="Continue verification" icon="open-in-new" onPress={() => openConsentUrl(kyc.consentUrl!)} />
      : kyc.status === 'FAILED'
        ? <PrimaryButton label="Retry KYC" isLoading={submitting} onPress={startKyc} />
        : undefined;

  return (
    <OnboardingScaffold stepIndex={2} title="Verify your identity" subtitle="A quick DigiLocker-based check confirms who you are." footer={footer}>
      {kyc === null ? (
        <View style={{ gap: Spacing.md }}>
          <InfoRow icon="verified-user" title="Secure & encrypted" subtitle="Your documents are verified through a licensed KYC provider." />
          <InfoRow icon="timer" title="Takes about 2 minutes" subtitle="You'll be guided through a few quick steps." />
          <View style={{ height: Spacing.xs }} />
          <Card>
            <CheckboxRow value={consent} onChange={setConsent} label="I consent to InPockets verifying my identity through its KYC provider." />
          </Card>
        </View>
      ) : (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="titleLarge">KYC status</AppText>
            <VerificationStatusChip status={kyc.status} />
          </View>
          <View style={{ marginTop: Spacing.sm }}>
            {isPending ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText variant="bodySmall" style={{ flex: 1 }}>We're waiting on your KYC provider — this screen updates automatically once it completes.</AppText>
              </View>
            ) : kyc.status === 'MANUAL_REVIEW' ? (
              <AppText variant="bodySmall">Your documents are under manual review by our team. We'll notify you once it's done.</AppText>
            ) : kyc.status === 'FAILED' ? (
              <AppText variant="bodyMedium" color={colors.danger}>{kyc.failureReason ?? 'Verification failed. Please try again.'}</AppText>
            ) : null}
          </View>
        </Card>
      )}
    </OnboardingScaffold>
  );
}
