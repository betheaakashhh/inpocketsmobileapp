import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { SuccessCheck } from '@/components/SuccessCheck';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { refreshJourneyQuietly, useJourney } from '@/features/loanLifecycle/useJourney';

/** Read-only. The customer can never trigger or confirm a payout: finance releases it and the
 *  bank/payment provider confirms it. "Sent" appears only when the server says it was disbursed. */
export default function DisbursementScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const journey = useJourney(id);
  const j = journey.data;
  const d = j?.disbursement ?? null;
  const inFlight = d?.status === 'pending' || d?.status === 'processing';

  useEffect(() => {
    if (!inFlight) return;
    const t = setInterval(() => { void refreshJourneyQuietly(id); }, 5000);
    return () => clearInterval(t);
  }, [inFlight, id]);

  const signed = j?.esign?.status === 'signed';
  const bankOk = j?.bankAccount?.status === 'verified';
  return (
    <ScrollScreen refreshControl={<RefreshControl refreshing={journey.isRefetching} onRefresh={() => journey.refetch()} tintColor={colors.primary} colors={[colors.primary]} />}>
      <Stack.Screen options={{ headerShown: true, title: 'Payout status' }} />
      {journey.isPending ? <ActivityIndicator color={colors.primary} style={{ marginTop: Spacing.xl }} /> : !d ? (
        <Card>
          <AppText variant="titleLarge">{!j?.offer || j.offer.status !== 'accepted' ? 'Accept your offer to continue' : !signed ? 'Sign your agreement' : !bankOk ? 'Add and verify your bank account' : 'Waiting for payout'}</AppText>
          <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>
            {signed && bankOk
              ? 'Everything is in place. Our team releases the payout and it appears here once the bank confirms it. Pull down to refresh.'
              : 'Your payout is released after your offer is accepted, your agreement is signed and your bank account is verified.'}
          </AppText>
        </Card>
      ) : inFlight ? (
        <View style={{ alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="titleLarge">Your payout is on its way</AppText>
          <AppText variant="bodyMedium" style={{ textAlign: 'center' }}>We're waiting for the bank to confirm. This can take a little while; you can safely leave this screen.</AppText>
        </View>
      ) : d.status === 'disbursed' ? (
        <View style={{ alignItems: 'center', paddingTop: Spacing.xl, gap: Spacing.md }}>
          <SuccessCheck size={96} />
          <AppText variant="headlineMedium">{Fmt.currency(d.amount)} sent</AppText>
          <Card style={{ alignSelf: 'stretch' }}>
            <KeyValueRow label="To account" value={d.accountNumberMasked} />
            {d.utr ? <KeyValueRow label="UTR" value={d.utr} /> : null}
            {d.completedAt ? <KeyValueRow label="Completed" value={Fmt.dateTime(d.completedAt)} /> : null}
          </Card>
        </View>
      ) : (
        <Card>
          <AppText variant="titleLarge" color={colors.danger}>{d.status === 'reversed' ? 'The payout was returned' : d.status === 'failed' ? 'The payout did not go through' : 'We are checking your payout'}</AppText>
          <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>Our team has been notified and will contact you. You don't need to do anything.</AppText>
        </Card>
      )}
    </ScrollScreen>
  );
}
