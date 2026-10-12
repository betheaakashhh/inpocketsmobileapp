import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { useToast } from '@/components/Toast';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { IFSC_PATTERN } from '@/core/utils/validators';
import { journeyActions, useJourney } from '@/features/loanLifecycle/useJourney';

export default function BankAccountScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bank = useJourney(id).data?.bankAccount ?? null;

  const [holder, setHolder] = useState('');
  const [acct, setAcct] = useState('');
  const [acct2, setAcct2] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [errs, setErrs] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const e: Record<string, string | null> = {
      holder: holder.trim().length < 2 ? 'Enter the account holder name' : null,
      acct: !/^\d{9,18}$/.test(acct) ? 'Enter a valid account number (9–18 digits)' : null,
      acct2: acct2 !== acct ? "Account numbers don't match" : null,
      ifsc: !IFSC_PATTERN.test(ifsc.trim().toUpperCase()) ? 'IFSC should look like HDFC0001234' : null,
    };
    setErrs(e);
    if (Object.values(e).some(Boolean)) return;
    setBusy(true);
    try { await journeyActions.submitBankAccount(id, { accountHolderName: holder.trim(), accountNumber: acct, ifsc: ifsc.trim().toUpperCase() }); }
    catch { toast.show("Couldn't verify the account. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const verified = bank?.status === 'verified';
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Bank account' }} />
      <IllustrativeBanner />
      {verified && bank ? (
        <>
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
              <Icon name="check-circle" size={22} color={colors.success} />
              <AppText variant="titleLarge">Account verified</AppText>
            </View>
            <KeyValueRow label="Holder" value={bank.accountHolderName} />
            <KeyValueRow label="Account" value={bank.accountNumberMasked} />
            <KeyValueRow label="IFSC" value={bank.ifsc} />
            <KeyValueRow label="Bank" value={bank.bankName} />
          </Card>
          <View style={{ height: Spacing.lg }} />
          <PrimaryButton label="Continue to disbursement" onPress={() => router.push(Routes.loanDisbursement(id))} />
        </>
      ) : (
        <View style={{ gap: Spacing.md }}>
          <AppText variant="bodyMedium">Your loan will be paid into this account. The name must match your KYC name.</AppText>
          <TextField label="Account holder name" value={holder} autoCapitalize="words" errorText={errs.holder} onChangeText={setHolder} />
          <TextField label="Account number" value={acct} keyboardType="number-pad" maxLength={18} errorText={errs.acct} onChangeText={(t) => setAcct(t.replace(/\D/g, ''))} />
          <TextField label="Confirm account number" value={acct2} keyboardType="number-pad" maxLength={18} errorText={errs.acct2} onChangeText={(t) => setAcct2(t.replace(/\D/g, ''))} />
          <TextField label="IFSC code" value={ifsc} autoCapitalize="characters" maxLength={11} errorText={errs.ifsc} onChangeText={(t) => setIfsc(t.toUpperCase())} />
          <View style={{ height: Spacing.sm }} />
          <PrimaryButton label="Verify account" isLoading={busy} onPress={submit} />
        </View>
      )}
    </ScrollScreen>
  );
}
