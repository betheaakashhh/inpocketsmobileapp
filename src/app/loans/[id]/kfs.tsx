import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { CheckboxRow } from '@/components/Checkbox';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { Fmt } from '@/core/utils/formatters';
import { isOfferExpired } from '@/features/loanLifecycle/models';
import { journeyActions, useJourney } from '@/features/loanLifecycle/useJourney';

/** The acknowledgement here is what actually accepts the offer: the server records
 *  which KFS version was shown and acknowledged. */
export default function KfsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const offer = useJourney(id).data?.offer ?? null;
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try { await journeyActions.acceptOffer(id); router.replace(Routes.loanAgreement(id)); }
    catch (e) { toast.show(e instanceof ApiException ? e.message : "Couldn't accept the offer. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const accepted = offer?.status === 'accepted';
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Key Facts Statement' }} />
      <AppText variant="bodyMedium" style={{ marginBottom: Spacing.md }}>Please read these key terms before you accept and sign your loan agreement.</AppText>
      {!offer ? <ShimmerList count={4} height={40} /> : (
        <>
          <Card>
            <KeyValueRow label="Loan amount" value={Fmt.currency(offer.principalAmount)} emphasize />
            <KeyValueRow label="Repayment period" value={Fmt.tenureDays(offer.tenureDays)} />
            {offer.terms.map((t) => <KeyValueRow key={t.key} label={t.label} value={t.value} />)}
            <KeyValueRow label="Offer version" value={`v${offer.version}`} />
            {offer.expiresAt ? <KeyValueRow label="Valid until" value={Fmt.dateTime(offer.expiresAt)} /> : null}
          </Card>
          <View style={{ height: Spacing.lg }} />
          {accepted ? (
            <PrimaryButton label="Continue to agreement" onPress={() => router.replace(Routes.loanAgreement(id))} />
          ) : isOfferExpired(offer) || offer.status !== 'issued' ? (
            <AppText variant="bodyMedium">This offer can no longer be accepted.</AppText>
          ) : (
            <>
              <Card><CheckboxRow value={ack} onChange={setAck} label="I have read and understood the key facts of this loan, and I accept this offer." /></Card>
              <View style={{ height: Spacing.lg }} />
              <PrimaryButton label="Accept offer and continue" isLoading={busy} onPress={ack ? accept : undefined} />
            </>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
