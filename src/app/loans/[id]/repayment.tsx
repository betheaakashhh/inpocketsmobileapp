import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { StatusChip, StatusTone } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { amountRemaining, InstallmentStatus, isFullyPaid, nextDue, PaymentMethod, totalOutstanding } from '@/features/loanLifecycle/models';
import { journeyActions, useJourney } from '@/features/loanLifecycle/useJourney';

const TONES: Record<InstallmentStatus, [string, StatusTone]> = {
  upcoming: ['Upcoming', 'neutral'], due: ['Due', 'warning'], paid: ['Paid', 'success'],
  overdue: ['Overdue', 'danger'], partiallyPaid: ['Partly paid', 'info'],
};
const METHODS: [PaymentMethod, string][] = [['upi', 'UPI'], ['debitCard', 'Debit card'], ['netBanking', 'Net banking']];

export default function RepaymentScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const j = useJourney(id).data;
  const [sheet, setSheet] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [busy, setBusy] = useState(false);

  const schedule = j?.schedule ?? null;
  const due = schedule ? nextDue(schedule) : null;

  const pay = async () => {
    if (!due) return;
    setBusy(true);
    try {
      await journeyActions.makePayment(id, { amount: amountRemaining(due), method, installmentNumbers: [due.installmentNumber] });
      setSheet(false);
      toast.show('Payment successful', 'success');
    } catch { toast.show('Payment failed. You have not been charged.', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Repayment' }} />
      <IllustrativeBanner />
      {!schedule ? <ShimmerList count={3} height={72} /> : (
        <>
          <Card>
            <AppText variant="labelMedium">Outstanding</AppText>
            <AppText variant="displayMedium" color={colors.primary}>{Fmt.currency(totalOutstanding(schedule))}</AppText>
            {isFullyPaid(schedule)
              ? <AppText variant="bodyMedium" color={colors.success}>All instalments paid. Thank you!</AppText>
              : due ? <AppText variant="bodySmall">Next: {Fmt.currency(amountRemaining(due))} due {Fmt.date(due.dueDate)}</AppText> : null}
          </Card>
          {due ? <View style={{ marginTop: Spacing.md }}><PrimaryButton label={`Pay ${Fmt.currency(amountRemaining(due))}`} onPress={() => setSheet(true)} /></View> : null}

          <AppText variant="titleLarge" style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>Schedule</AppText>
          <View style={{ gap: Spacing.sm }}>
            {schedule.installments.map((i) => {
              const [label, tone] = TONES[i.status];
              return (
                <Card key={i.installmentNumber} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <AppText variant="titleMedium">Instalment {i.installmentNumber}</AppText>
                    <AppText variant="bodySmall">{Fmt.date(i.dueDate)} · {Fmt.currency(i.amountDue)}</AppText>
                  </View>
                  <StatusChip label={label} tone={tone} />
                </Card>
              );
            })}
          </View>

          {(j?.payments ?? []).length > 0 ? (
            <>
              <AppText variant="titleLarge" style={{ marginTop: Spacing.xl, marginBottom: Spacing.sm }}>Payment history</AppText>
              <View style={{ gap: Spacing.sm }}>
                {j!.payments.map((p) => (
                  <Card key={p.id}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <AppText variant="titleMedium">{Fmt.currency(p.amount)}</AppText>
                      <StatusChip label={p.status === 'success' ? 'Success' : p.status === 'failed' ? 'Failed' : 'Pending'} tone={p.status === 'success' ? 'success' : p.status === 'failed' ? 'danger' : 'info'} />
                    </View>
                    <AppText variant="bodySmall">{Fmt.dateTime(p.createdAt)}{p.receiptRef ? ` · ${p.receiptRef}` : ''}</AppText>
                  </Card>
                ))}
              </View>
            </>
          ) : null}
        </>
      )}

      <BottomSheet visible={sheet} onClose={() => (busy ? undefined : setSheet(false))} dismissable={!busy}>
        <AppText variant="headlineSmall">Choose payment method</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginVertical: Spacing.lg }}>
          {METHODS.map(([m, label]) => <Chip key={m} label={label} selected={method === m} onPress={() => setMethod(m)} disabled={busy} />)}
        </View>
        <PrimaryButton label={due ? `Pay ${Fmt.currency(amountRemaining(due))}` : 'Pay'} isLoading={busy} onPress={pay} />
      </BottomSheet>
    </ScrollScreen>
  );
}
