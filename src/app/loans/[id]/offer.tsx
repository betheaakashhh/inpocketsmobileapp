import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, TextLinkButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { useToast } from '@/components/Toast';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { isOfferExpired } from '@/features/loanLifecycle/models';
import { journeyActions, useJourney } from '@/features/loanLifecycle/useJourney';

export default function LoanOfferScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id, amount, tenure } = useLocalSearchParams<{ id: string; amount?: string; tenure?: string }>();
  const journey = useJourney(id);
  const [busy, setBusy] = useState(false);

  // Offer generation is idempotent in the mock repo.
  useEffect(() => {
    if (journey.data && !journey.data.offer && amount && tenure) {
      journeyActions.generateOfferIfNeeded(id, Number(amount), Number(tenure)).catch(() => toast.show("Couldn't prepare your offer.", 'error'));
    }
  }, [journey.data, id, amount, tenure, toast]);

  const offer = journey.data?.offer ?? null;

  const accept = async () => {
    setBusy(true);
    try { await journeyActions.acceptOffer(id); router.push(Routes.loanKfs(id)); }
    catch { toast.show("Couldn't accept the offer. Try again.", 'error'); }
    finally { setBusy(false); }
  };

  const decline = () =>
    Alert.alert('Decline this offer?', "You can apply again later, but this offer won't be available.", [
      { text: 'Keep offer', style: 'cancel' },
      { text: 'Decline', style: 'destructive', onPress: async () => { await journeyActions.declineOffer(id); router.replace(Routes.homeLoans); } },
    ]);

  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Your loan offer' }} />
      <IllustrativeBanner />
      {!offer ? <ShimmerList count={3} height={100} /> : (
        <>
          <Card>
            <AppText variant="labelMedium">Approved amount</AppText>
            <AppText variant="displayMedium" color={colors.primary}>{Fmt.currency(offer.approvedAmount)}</AppText>
            <View style={{ height: Spacing.sm }} />
            <KeyValueRow label="You receive" value={Fmt.currency(offer.disbursableAmount)} emphasize />
            <KeyValueRow label="Tenure" value={Fmt.tenureDays(offer.tenureDays)} />
            <KeyValueRow label="Interest rate (p.a.)" value={`${offer.annualInterestRatePercent.toFixed(1)}%`} />
            <KeyValueRow label="Processing fee" value={Fmt.currency(offer.processingFee)} />
            <KeyValueRow label="APR" value={`${offer.apr.toFixed(1)}%`} />
            <KeyValueRow label="Monthly instalment" value={Fmt.currency(offer.emiAmount)} />
            <KeyValueRow label="Total repayable" value={Fmt.currency(offer.totalRepaymentAmount)} emphasize />
          </Card>
          <AppText variant="bodySmall" style={{ marginTop: Spacing.sm }}>
            {isOfferExpired(offer) ? 'This offer has expired.' : `Valid until ${Fmt.dateTime(offer.expiresAt)} · ${offer.lenderName}`}
          </AppText>
          <View style={{ height: Spacing.lg }} />
          <PrimaryButton label="Accept offer" isLoading={busy} onPress={isOfferExpired(offer) || offer.status === 'declined' ? undefined : accept} />
          <View style={{ alignItems: 'center', marginTop: Spacing.sm }}><TextLinkButton label="Decline" color={colors.danger} onPress={decline} /></View>
        </>
      )}
    </ScrollScreen>
  );
}
