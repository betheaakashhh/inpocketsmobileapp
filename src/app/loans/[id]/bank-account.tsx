import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { IFSC_PATTERN } from '@/core/utils/validators';
import { journeyActions, refreshJourneyQuietly, useJourney } from '@/features/loanLifecycle/useJourney';

export default function BankAccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bank = useJourney(id).data?.bankAccount ?? null;

  const [acct, setAcct] = useState('');
  const [acct2, setAcct2] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(false);

  const checking = bank?.status === 'pending' || bank?.status === 'initiated';
  useEffect(() => {
    if (!checking) return;
    const t = setInterval(() => { void refreshJourneyQuietly(id); }, 4000);
    return () => clearInterval(t);
  }, [checking, id]);

  const submit = async () => {
    const e: Record<string, string | null> = {
      acct: !/^\d{9,18}$/.test(acct) ? 'Enter a valid account number (9–18 digits)' : null,
      acct2: acct2 !== acct ? "Account numbers don't match" : null,
      ifsc: !IFSC_PATTERN.test(ifsc.trim().toUpperCase()) ? 'IFSC should look like HDFC0001234' : null,
    };
    setErrs(e);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    try { await journeyActions.submitBankAccount(id, { accountNumber: acct, ifsc: ifsc.trim().toUpperCase() }); setRetry(false); setAcct(''); setAcct2(''); }
    catch (err) { toast.show(err instanceof ApiException ? err.message : "Couldn't verify the account. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const verified = bank?.status === 'verified';
  const needsForm = !bank || retry || bank.status === 'failed' || bank.status === 'expired';
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Bank account' }} />
      {verified && bank && !retry ? (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <Icon name="check-circle" size={22} color={colors.success} />
              <AppText variant="titleLarge">Account verified</AppText>
            </View>
            <KeyValueRow label="Account" value={bank.accountNumberMasked} />
            <KeyValueRow label="IFSC" value={bank.ifsc} />
            {bank.bankName ? <KeyValueRow label="Bank" value={bank.bankName} /> : null}
          </Card>
          <View style={{ height: Spacing.lg }} />
          <PrimaryButton label="Continue to payout status" onPress={() => router.push(Routes.loanDisbursement(id))} />
        </>
      ) : checking && bank ? (
        <Card>
          <AppText variant="titleLarge">Verifying your account…</AppText>
          <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>{bank.accountNumberMasked} · {bank.ifsc}. This usually takes a moment; you can leave this screen.</AppText>
        </Card>
      ) : bank?.status === 'manualReview' ? (
        <Card>
          <AppText variant="titleLarge">We're checking your account</AppText>
          <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>The account name needs a manual check by our team. We'll update this screen when it's done.</AppText>
        </Card>
      ) : needsForm ? (
        <View style={{ gap: Spacing.md }}>
          {bank?.status === 'failed' ? <AppText variant="bodyMedium" color={colors.danger}>We couldn't verify that account{bank.failureCode ? ` (${bank.failureCode.replace(/_/g, ' ').toLowerCase()})` : ''}. Check the details and try again.</AppText> : null}
          <AppText variant="bodyMedium">Your loan will be paid into this account. The account holder's name must match the name on your profile and KYC.</AppText>
          <TextField label="Account number" value={acct} keyboardType="number-pad" maxLength={18} errorText={errs.acct} onChangeText={(t) => setAcct(t.replace(/\D/g, ''))} />
          <TextField label="Confirm account number" value={acct2} keyboardType="number-pad" maxLength={18} errorText={errs.acct2} onChangeText={(t) => setAcct2(t.replace(/\D/g, ''))} />
          <TextField label="IFSC code" value={ifsc} autoCapitalize="characters" maxLength={11} errorText={errs.ifsc} onChangeText={(t) => setIfsc(t.toUpperCase())} />
          <View style={{ height: Spacing.sm }} />
          <PrimaryButton label="Verify account" isLoading={busy} onPress={submit} />
        </View>
      ) : null}
    </ScrollScreen>
  );
}
