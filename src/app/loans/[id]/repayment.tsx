import { Stack } from 'expo-router';
import React from 'react';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { ScrollScreen } from '@/components/Screen';
import { Spacing } from '@/core/theme/colors';

/** Repayment is not part of the backend yet (no schedule, collections or payment gateway). The
 *  previous version of this screen invented a schedule and "successful" payments on the device;
 *  it has been removed rather than left to mislead customers. */
export default function RepaymentScreen() {
  return (
    <ScrollScreen>
      <Stack.Screen options={{ headerShown: true, title: 'Repayment' }} />
      <Card>
        <AppText variant="titleLarge">Repayment isn't available in the app yet</AppText>
        <AppText variant="bodyMedium" style={{ marginTop: Spacing.sm }}>
          Your repayment schedule and payment options will appear here once they are live. Until then, follow the repayment instructions in your signed loan agreement.
        </AppText>
      </Card>
    </ScrollScreen>
  );
}
