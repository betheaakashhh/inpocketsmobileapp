import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { InfoRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { Fmt } from '@/core/utils/formatters';
import { journeyActions, refreshJourneyQuietly, useJourney } from '@/features/loanLifecycle/useJourney';

/** Signing happens on the e-sign provider's page. This screen only ever DISPLAYS the server's
 *  state: "signed" appears after the provider's signed callback reached the backend. */
export default function AgreementScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const journey = useJourney(id);
  const offer = journey.data?.offer ?? null;
  const esign = journey.data?.esign ?? null;
  const [busy, setBusy] = useState(false);

  const waiting = esign?.status === 'pending' || esign?.status === 'initiated';
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => { void refreshJourneyQuietly(id); }, 4000);
    return () => clearInterval(t);
  }, [waiting, id]);

  const sign = async () => {
    setBusy(true);
    try {
      const url = await journeyActions.startESign(id);
      if (url) await Linking.openURL(url).catch(() => toast.show("Couldn't open the signing page.", 'error'));
    } catch (e) { toast.show(e instanceof ApiException ? e.message : "Couldn't start e-sign. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const signed = esign?.status === 'signed';
  const failed = esign?.status === 'failed' || esign?.status === 'expired';
  const review = esign?.status === 'manualReview';
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Loan agreement' }} />
      {journey.isPending ? <ShimmerList count={2} height={90} /> : !offer || offer.status !== 'accepted' ? (
        <Card>
          <AppText variant="bodyMedium">Accept your offer first, then you can sign the agreement.</AppText>
          <View style={{ height: Spacing.md }} />
          <PrimaryButton label="Back to your offer" onPress={() => router.replace(Routes.loanOffer(id))} />
        </Card>
      ) : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="titleLarge">Loan agreement</AppText>
              <StatusChip label={signed ? 'Signed' : failed ? 'Not completed' : review ? 'Under review' : waiting ? 'Waiting for signature' : 'Not signed yet'} tone={signed ? 'success' : failed ? 'danger' : 'warning'} />
            </View>
            <View style={{ height: Spacing.md }} />
            <InfoRow icon="draw" title="Sign with Aadhaar eSign" subtitle="A legally valid digital signature on the lender's e-sign page — no printing needed." />
            {signed && esign?.signedAt ? <AppText variant="bodySmall" style={{ marginTop: Spacing.md }}>Signed on {Fmt.dateTime(esign.signedAt)}</AppText> : null}
            {waiting ? <AppText variant="bodySmall" style={{ marginTop: Spacing.md }}>Finish signing on the e-sign page. This screen updates by itself when we receive the confirmation.</AppText> : null}
            {failed ? <AppText variant="bodySmall" style={{ marginTop: Spacing.md }}>Signing wasn't completed. You can start again.</AppText> : null}
            {review ? <AppText variant="bodySmall" style={{ marginTop: Spacing.md }}>Our team is checking your signature and will update you.</AppText> : null}
          </Card>
          <View style={{ height: Spacing.lg }} />
          {signed ? (
            <PrimaryButton label="Add bank account" onPress={() => router.push(Routes.loanBank(id))} />
          ) : review ? null : waiting ? (
            <View style={{ gap: Spacing.sm }}>
              {esign?.signingUrl ? <PrimaryButton label="Open signing page" onPress={() => { void Linking.openURL(esign.signingUrl as string); }} /> : null}
              <SecondaryButton label="I've signed — check status" onPress={() => journey.refetch()} />
            </View>
          ) : (
            <PrimaryButton label={failed ? 'Start signing again' : 'Sign agreement'} isLoading={busy} onPress={sign} />
          )}
        </>
      )}
    </ScrollScreen>
  );
}
