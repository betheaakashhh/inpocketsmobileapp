import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { OnboardingScaffold } from '@/components/OnboardingScaffold';
import { VerificationStatusChip } from '@/components/StatusChip';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Validators } from '@/core/utils/validators';
import { PanVerificationModel } from '@/features/onboarding/models';
import { getSnapshot, onboardingActions } from '@/features/onboarding/useOnboarding';

export default function PanVerificationScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const [pan, setPan] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PanVerificationModel | null>(() => getSnapshot()?.pan ?? null);

  const submit = async () => {
    const value = pan.trim().toUpperCase();
    const err = Validators.pan(value);
    setError(err);
    if (err) return;
    setSubmitting(true);
    try {
      setResult(await onboardingActions.submitPan(value));
      // If VERIFIED the backend already advanced current_step to KYC; the gate moves us on.
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => { setResult(null); setPan(''); };
  const terminalNonSuccess = result !== null && result.status !== 'VERIFIED';

  return (
    <OnboardingScaffold
      stepIndex={1}
      title="Verify your PAN"
      subtitle="Your PAN helps us confirm your identity — we'll never share it."
      footer={
        result === null ? <PrimaryButton label="Verify PAN" isLoading={submitting} onPress={submit} />
        : terminalNonSuccess ? <SecondaryButton label="Try a different PAN" onPress={retry} />
        : undefined
      }
    >
      {result === null ? (
        <TextField
          label="PAN number" value={pan} placeholder="ABCDE1234F" autoFocus maxLength={10}
          autoCapitalize="characters" autoCorrect={false}
          onChangeText={(t) => { setPan(t.replace(/[^A-Za-z0-9]/g, '').toUpperCase()); if (error) setError(null); }}
          errorText={error} onSubmitEditing={submit}
        />
      ) : (
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <AppText variant="titleLarge">{result.panNumberMasked}</AppText>
            <VerificationStatusChip status={result.status} />
          </View>
          {result.verifiedName ? (
            <View style={{ marginTop: Spacing.sm }}>
              <AppText variant="labelMedium">Registered name</AppText>
              <AppText variant="bodyLarge">{result.verifiedName}</AppText>
            </View>
          ) : null}
          {result.failureReason ? (
            <AppText variant="bodyMedium" color={colors.danger} style={{ marginTop: Spacing.sm }}>{result.failureReason}</AppText>
          ) : null}
          {result.status === 'VERIFIED' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.md }}>
              <Icon name="check-circle" size={18} color={colors.success} />
              <AppText variant="bodySmall" style={{ flex: 1 }}>Verified — taking you to the next step…</AppText>
            </View>
          ) : null}
        </Card>
      )}
    </OnboardingScaffold>
  );
}
