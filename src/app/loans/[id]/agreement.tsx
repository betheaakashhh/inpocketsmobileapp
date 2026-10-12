import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { InfoRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { Fmt } from '@/core/utils/formatters';
import { journeyActions, useJourney } from '@/features/loanLifecycle/useJourney';
import { View } from 'react-native';

export default function AgreementScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agreement = useJourney(id).data?.agreement ?? null;
  const [busy, setBusy] = useState(false);

  const sign = async () => {
    setBusy(true);
    try {
      if (agreement?.signingStatus === 'initiated') await journeyActions.initiateESign(id);
      await journeyActions.completeESign(id); // mock: stands in for the provider's signing UI + webhook
      toast.show('Agreement signed', 'success');
    } catch { toast.show("Couldn't complete e-sign. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const signed = agreement?.signingStatus === 'signed';
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Loan agreement' }} />
      <IllustrativeBanner />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="titleLarge">Loan agreement</AppText>
          <StatusChip label={signed ? 'Signed' : 'Awaiting signature'} tone={signed ? 'success' : 'warning'} />
        </View>
        <View style={{ height: Spacing.md }} />
        <InfoRow icon="draw" title="Sign with Aadhaar eSign" subtitle="A legally valid digital signature — no printing needed." />
        {signed && agreement?.signedAt ? <AppText variant="bodySmall" style={{ marginTop: Spacing.md }}>Signed on {Fmt.dateTime(agreement.signedAt)}</AppText> : null}
      </Card>
      <View style={{ height: Spacing.lg }} />
      {signed
        ? <PrimaryButton label="Add bank account" onPress={() => router.push(Routes.loanBank(id))} />
        : <PrimaryButton label="Sign agreement" isLoading={busy} onPress={agreement ? sign : undefined} />}
    </ScrollScreen>
  );
}
