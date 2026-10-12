import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { LoanStatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { reloadLoan, reloadLoans, useLoanDetail, useLoanEvents } from '@/features/loans/hooks';
import { isDraft } from '@/features/loans/models';
import { loanRepository } from '@/features/loans/repository';

const titleize = (s: string) => s.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');

export default function LoanDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const loan = useLoanDetail(id);
  const events = useLoanEvents(id);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const submitDraft = async () => {
    setBusy(true);
    try {
      await loanRepository.submit(id);
      await Promise.all([reloadLoan(id), reloadLoans()]);
    } catch (e) {
      toast.show(e instanceof ApiException ? e.message : ApiException.unexpected().message, 'error');
    } finally { setBusy(false); }
  };

  const l = loan.data;
  return (
    <ScrollScreen refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} colors={[colors.primary]}
      onRefresh={async () => { setRefreshing(true); await Promise.all([loan.refetch(), events.refetch()]); setRefreshing(false); }} />}>
      <Stack.Screen options={{ headerShown: true, title: 'Application details' }} />
      {loan.isPending ? <ShimmerList count={3} height={90} /> : loan.isError || !l ? (
        <AppText variant="bodyMedium">Couldn't load this application.</AppText>
      ) : (
        <>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="labelMedium">{l.applicationNumber}</AppText>
              <LoanStatusChip status={l.status} />
            </View>
            <AppText variant="displayMedium" style={{ marginTop: Spacing.sm }}>{Fmt.currency(l.requestedAmount)}</AppText>
            <View style={{ height: Spacing.sm }} />
            <KeyValueRow label="Repayment period" value={Fmt.tenureDays(l.requestedTenureDays)} />
            <KeyValueRow label="Created" value={Fmt.dateTime(l.createdAt)} />
            {l.submittedAt ? <KeyValueRow label="Submitted" value={Fmt.dateTime(l.submittedAt)} /> : null}
          </Card>

          <View style={{ height: Spacing.md }} />
          {isDraft(l) ? <PrimaryButton label="Submit application" isLoading={busy} onPress={submitDraft} /> : null}
          {l.status === 'APPROVED' ? (
            <View style={{ gap: Spacing.sm }}>
              <PrimaryButton label="View your offer" icon="local-offer" onPress={() => router.push(Routes.loanOffer(l.id, l.requestedAmount, l.requestedTenureDays))} />
              <SecondaryButton label="Repayment & disbursement" onPress={() => router.push(Routes.loanDisbursement(l.id))} />
            </View>
          ) : null}

          <AppText variant="titleLarge" style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>Timeline</AppText>
          {events.isPending ? <ShimmerList count={2} height={56} /> : (events.data ?? []).length === 0 ? (
            <AppText variant="bodyMedium">No activity yet.</AppText>
          ) : (
            <View style={{ gap: Spacing.sm }}>
              {(events.data ?? []).map((e, i) => (
                <View key={e.id} style={{ flexDirection: 'row', gap: Spacing.md }}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === (events.data?.length ?? 1) - 1 ? colors.primary : colors.border, marginTop: 4 }} />
                    {i < (events.data?.length ?? 0) - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: colors.border }} /> : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: Spacing.sm }}>
                    <AppText variant="titleMedium">{titleize(e.newStatus)}</AppText>
                    <AppText variant="bodySmall">{Fmt.dateTime(e.createdAt)} · {titleize(e.actorType)}</AppText>
                    {e.reason ? <AppText variant="bodySmall" style={{ marginTop: 2 }}>{e.reason}</AppText> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollScreen>
  );
}
