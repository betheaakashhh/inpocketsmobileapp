import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton, TextLinkButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const journey = useJourney(id);
  const [busy, setBusy] = useState(false);
  const offer = journey.data?.offer ?? null;

  const decline = () =>
    Alert.alert('Decline this offer?', "You can apply again later, but this offer won't be available.", [
      { text: 'Keep offer', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try { await journeyActions.declineOffer(id); router.replace(Routes.homeLoans); }
          catch (e) { toast.show(e instanceof ApiException ? e.message : "Couldn't decline the offer.", 'error'); }
          finally { setBusy(false); }
        },
      },
    ]);

  const expired = offer ? isOfferExpired(offer) : false;
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Your loan offer' }} />
      {journey.isPending ? <ShimmerList count={3} height={100} /> : journey.isError ? (
        <View style={{ gap: Spacing.md }}>
          <AppText variant="bodyMedium">Couldn't load your offer.</AppText>
          <SecondaryButton label="Try again" onPress={() => journey.refetch()} />
        </View>
      ) : !offer ? (
        <Card>
          <AppText variant="titleLarge">Your offer is being prepared</AppText>
          <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>
            Your application is approved. Our team is preparing your loan terms and we'll show them here as soon as they're ready.
          </AppText>
          <View style={{ height: Spacing.md }} />
          <SecondaryButton label="Check again" onPress={() => journey.refetch()} />
        </Card>
      ) : (
        <>
          <Card>
            <AppText variant="labelMedium">Approved amount</AppText>
            <AppText variant="displayMedium" color={colors.primary}>{Fmt.currency(offer.principalAmount)}</AppText>
            <View style={{ height: Spacing.sm }} />
            <KeyValueRow label="Repayment period" value={Fmt.tenureDays(offer.tenureDays)} />
            {offer.terms.map((t) => <KeyValueRow key={t.key} label={t.label} value={t.value} />)}
          </Card>
          <AppText variant="bodySmall" style={{ marginTop: Spacing.sm }}>
            These terms are set by the lender. Read the full Key Facts Statement before you accept.
          </AppText>
          {offer.status === 'issued' && offer.expiresAt ? (
            <AppText variant="bodySmall" style={{ marginTop: Spacing.xs }}>
              {expired ? 'This offer has expired.' : `Valid until ${Fmt.dateTime(offer.expiresAt)}`}
            </AppText>
          ) : null}
          <View style={{ height: Spacing.lg }} />
          {offer.status === 'issued' && !expired ? (
            <>
              <PrimaryButton label="Review key facts & accept" isLoading={busy} onPress={() => router.push(Routes.loanKfs(id))} />
              <View style={{ alignItems: 'center', marginTop: Spacing.sm }}><TextLinkButton label="Decline" color={colors.danger} onPress={decline} /></View>
            </>
          ) : offer.status === 'accepted' ? (
            <PrimaryButton label="Continue" onPress={() => router.push(Routes.loanAgreement(id))} />
          ) : (
            <AppText variant="bodyMedium">
              {offer.status === 'declined' ? 'You declined this offer.' : expired || offer.status === 'expired' ? 'This offer has expired. Contact support if you still need a loan.' : 'This offer is no longer available.'}
            </AppText>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
