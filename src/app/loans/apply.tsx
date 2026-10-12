import Slider from '@react-native-community/slider';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Chip } from '@/components/Chip';
import { ScrollScreen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { Validators } from '@/core/utils/validators';
import { reloadLoans } from '@/features/loans/hooks';
import { loanRepository } from '@/features/loans/repository';

const MIN = 1000;
const MAX = 500000;
const TENURES = [30, 60, 90, 180];

export default function LoanApplyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const [amount, setAmount] = useState('25000');
  const [tenure, setTenure] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const numeric = Number(amount);
  const sliderValue = Number.isFinite(numeric) ? Math.min(MAX, Math.max(MIN, numeric)) : MIN;

  const submit = async () => {
    const err = Validators.loanAmount(amount, MIN, MAX);
    setError(err);
    if (err) return;
    setBusy(true);
    try {
      const draft = await loanRepository.createDraft(Number(amount), tenure);
      const submitted = await loanRepository.submit(draft.id);
      await reloadLoans();
      toast.show('Application submitted', 'success');
      router.replace(Routes.loanDetail(submitted.id));
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Apply for a loan' }} />
      <AppText variant="displayMedium" color={colors.primary}>{Fmt.currency(sliderValue)}</AppText>
      <Slider
        style={{ marginTop: Spacing.sm, height: 40 }}
        minimumValue={MIN} maximumValue={MAX} step={1000} value={sliderValue}
        minimumTrackTintColor={colors.primary} maximumTrackTintColor={colors.border} thumbTintColor={colors.primary}
        onValueChange={(v) => { setAmount(String(Math.round(v))); setError(null); }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <AppText variant="bodySmall">{Fmt.currency(MIN)}</AppText>
        <AppText variant="bodySmall">{Fmt.currency(MAX)}</AppText>
      </View>

      <View style={{ height: Spacing.lg }} />
      <TextField label="Loan amount" value={amount} prefixText="₹ " keyboardType="number-pad" errorText={error}
        onChangeText={(t) => { setAmount(t.replace(/\D/g, '')); setError(null); }} />

      <View style={{ height: Spacing.lg }} />
      <AppText variant="labelLarge" color={colors.text}>Repayment period</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm }}>
        {TENURES.map((d) => <Chip key={d} label={Fmt.tenureDays(d)} selected={tenure === d} onPress={() => setTenure(d)} />)}
      </View>

      <View style={{ height: Spacing.xl }} />
      <PrimaryButton label="Submit application" isLoading={busy} onPress={submit} />
    </ScrollScreen>
  );
}
