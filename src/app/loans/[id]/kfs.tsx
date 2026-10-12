import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { CheckboxRow } from '@/components/Checkbox';
import { IllustrativeBanner } from '@/components/IllustrativeBanner';
import { KeyValueRow } from '@/components/InfoRow';
import { ScrollScreen } from '@/components/Screen';
import { ShimmerList } from '@/components/ShimmerBox';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useJourney } from '@/features/loanLifecycle/useJourney';

export default function KfsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kfs = useJourney(id).data?.kfs ?? null;
  const [ack, setAck] = useState(false);

  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Key Facts Statement' }} />
      <IllustrativeBanner />
      <AppText variant="bodyMedium" style={{ marginBottom: Spacing.md }}>Please read these key terms before you sign your loan agreement.</AppText>
      {!kfs ? <ShimmerList count={4} height={40} /> : (
        <>
          <Card>{kfs.lineItems.map((li) => <KeyValueRow key={li.label} label={li.label} value={li.value} />)}</Card>
          <View style={{ height: Spacing.lg }} />
          <Card><CheckboxRow value={ack} onChange={setAck} label="I have read and understood the key facts of this loan." /></Card>
          <View style={{ height: Spacing.lg }} />
          <PrimaryButton label="Continue to agreement" onPress={ack ? () => router.push(Routes.loanAgreement(id)) : undefined} />
        </>
      )}
    </ScrollScreen>
  );
}
