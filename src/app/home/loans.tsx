import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton, TextLinkButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ShimmerList } from '@/components/ShimmerBox';
import { LoanStatusChip } from '@/components/StatusChip';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { useLoanList } from '@/features/loans/hooks';
import { LoanApplication } from '@/features/loans/models';

export default function LoanListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const q = useLoanList();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); await q.refetch(); setRefreshing(false); };
  const refresh = <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />;

  if (q.isPending) {
    return <View style={{ flex: 1, padding: Spacing.lg }}><ShimmerList count={4} height={92} /></View>;
  }

  if (q.isError) {
    return (
      <FlatList data={[]} renderItem={null} refreshControl={refresh} contentContainerStyle={{ padding: Spacing.xxl, alignItems: 'center' }}
        ListHeaderComponent={
          <View style={{ alignItems: 'center', gap: Spacing.md }}>
            <Icon name="cloud-off" size={40} color={colors.textSecondary} />
            <AppText variant="titleMedium">Couldn't load your loans</AppText>
            <TextLinkButton label="Retry" onPress={() => q.refetch()} />
          </View>
        } />
    );
  }

  return (
    <FlatList<LoanApplication>
      data={q.data}
      keyExtractor={(a) => a.id}
      refreshControl={refresh}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, flexGrow: 1 }}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 80, gap: Spacing.sm }}>
          <Icon name="account-balance-wallet" size={56} color={colors.primary} />
          <AppText variant="titleMedium" style={{ marginTop: Spacing.sm }}>No loan applications yet</AppText>
          <AppText variant="bodyMedium">Apply in under a minute.</AppText>
          <View style={{ height: Spacing.md }} />
          <PrimaryButton label="Apply now" fullWidth={false} onPress={() => router.push(Routes.loanApply)} />
        </View>
      }
      renderItem={({ item, index }) => (
        <FadeSlideIn delay={Math.min(index, 8) * 40}>
          <PressableScale onPress={() => router.push(Routes.loanDetail(item.id))} accessibilityRole="button">
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <AppText variant="labelMedium">{item.applicationNumber}</AppText>
                <LoanStatusChip status={item.status} />
              </View>
              <AppText variant="headlineSmall" style={{ marginTop: Spacing.sm }}>{Fmt.currency(item.requestedAmount)}</AppText>
              <AppText variant="bodySmall" style={{ marginTop: 2 }}>
                {Fmt.tenureDays(item.requestedTenureDays)} · Applied {Fmt.relativeShort(item.createdAt)}
              </AppText>
            </Card>
          </PressableScale>
        </FadeSlideIn>
      )}
    />
  );
}
