import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { SuccessCheck } from '@/components/SuccessCheck';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { journeyActions, refreshJourneyQuietly, useJourney } from '@/features/loanLifecycle/useJourney';

export default function DisbursementScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const j = useJourney(id).data;
  const started = useRef(false);

  const status = j?.disbursement?.status;

  // Kick off disbursement once the journey is loaded and none exists yet.
  useEffect(() => {
    if (j && j.offer && !j.disbursement && !started.current) {
      started.current = true;
      journeyActions.initiateDisbursement(id).catch(() => { started.current = false; });
    }
  }, [j, id]);

  // Poll while processing. Success must come from the (mock) backend state, never from the animation.
  useEffect(() => {
    if (status !== 'processing' && status !== 'pending') return;
    const t = setInterval(() => { refreshJourneyQuietly(id); }, 1500);
    return () => clearInterval(t);
  }, [status, id]);

  const d = j?.disbursement ?? null;
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Disbursement' }} />
      <IllustrativeBanner />
      {!d || d.status === 'processing' || d.status === 'pending' ? (
        <View style={{ alignItems: 'center', paddingTop: Spacing.xxl, gap: Spacing.md }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText variant="titleLarge">Sending your money…</AppText>
          <AppText variant="bodyMedium" style={{ textAlign: 'center' }}>This usually takes a few seconds. You can safely leave this screen.</AppText>
        </View>
      ) : d.status === 'success' ? (
        <View style={{ alignItems: 'center', paddingTop: Spacing.xl, gap: Spacing.md }}>
          <SuccessCheck size={96} />
          <AppText variant="headlineMedium">{Fmt.currency(d.amount)} sent</AppText>
          <Card style={{ alignSelf: 'stretch' }}>
            {d.utr ? <KeyValueRow label="UTR" value={d.utr} /> : null}
            {d.completedAt ? <KeyValueRow label="Completed" value={Fmt.dateTime(d.completedAt)} /> : null}
          </Card>
          <PrimaryButton label="View repayment schedule" onPress={() => router.push(Routes.loanRepayment(id))} />
        </View>
      ) : (
        <Card><AppText variant="bodyMedium" color={colors.danger}>{d.failureReason ?? 'Disbursement needs attention. Our team will reach out.'}</AppText></Card>
      )}
    </ScrollScreen>
  );
}
