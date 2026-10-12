import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TextLinkButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { FadeSlideIn } from '@/components/FadeSlideIn';
import { Icon, IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ShimmerList } from '@/components/ShimmerBox';
import { LoanStatusChip, VerificationStatusChip } from '@/components/StatusChip';
import { Routes } from '@/core/routing/gate';
import { Brand, Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { useLoanList } from '@/features/loans/hooks';
import { refreshQuietly, useOnboarding } from '@/features/onboarding/useOnboarding';

const IN_PROGRESS = ['SUBMITTED', 'PROCESSING', 'MANUAL_REVIEW', 'PENDING_ADDITIONAL_INFORMATION'];

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { snapshot } = useOnboarding();
  const loans = useLoanList();
  const [refreshing, setRefreshing] = useState(false);

  const firstName = snapshot?.profile.firstName;
  const name = firstName && firstName.length > 0 ? firstName : 'there';
  const apps = loans.data ?? [];
  const approved = apps.filter((a) => a.status === 'APPROVED').length;
  const inProgress = apps.filter((a) => IN_PROGRESS.includes(a.status)).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loans.refetch(), refreshQuietly()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {/* Header */}
        <FadeSlideIn>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 }}>
              <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <AppText variant="headlineSmall" color={colors.primary}>{name.charAt(0).toUpperCase()}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodySmall">Welcome back</AppText>
                <AppText variant="headlineMedium" numberOfLines={1}>Hi, {name} 👋</AppText>
              </View>
            </View>
            <Pressable
              onPress={() => router.push(Routes.settings)}
              accessibilityLabel="Settings"
              hitSlop={8}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="settings" size={22} color={colors.text} />
            </Pressable>
          </View>
        </FadeSlideIn>

        {/* Hero */}
        <FadeSlideIn delay={60} style={{ marginTop: Spacing.lg }}>
          <PressableScale onPress={() => router.push(Routes.loanApply)} accessibilityRole="button" accessibilityLabel="Apply for a loan">
            <LinearGradient
              colors={[Brand.primary, Brand.primaryLight]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: Spacing.radiusLg, padding: Spacing.lg, overflow: 'hidden', shadowColor: colors.shadow, shadowOpacity: 1, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
            >
              <View style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.14)' }} />
              <View style={{ position: 'absolute', right: 40, bottom: -70, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.10)' }} />
              <AppText variant="labelMedium" color="rgba(255,255,255,0.85)">INSTANT LOANS</AppText>
              <AppText variant="displayMedium" color="#FFFFFF" style={{ marginTop: 6 }}>Need funds?</AppText>
              <AppText variant="bodyMedium" color="rgba(255,255,255,0.92)" style={{ marginTop: 4, maxWidth: 240 }}>Apply for a loan in under a minute.</AppText>
              <View style={{ marginTop: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 11, borderRadius: Spacing.radiusPill }}>
                <AppText variant="titleMedium" color={Brand.primary}>Apply now</AppText>
                <Icon name="arrow-forward" size={18} color={Brand.primary} />
              </View>
            </LinearGradient>
          </PressableScale>
        </FadeSlideIn>

        {/* Quick actions */}
        <FadeSlideIn delay={110} style={{ marginTop: Spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <QuickAction icon="add-circle-outline" label="Apply" onPress={() => router.push(Routes.loanApply)} />
            <QuickAction icon="description" label="My loans" onPress={() => router.navigate(Routes.homeLoans)} />
            <QuickAction icon="folder" label="Documents" onPress={() => router.push(Routes.documents)} />
            <QuickAction icon="shield" label="Security" onPress={() => router.push(Routes.sessions)} />
          </View>
        </FadeSlideIn>

        {/* Stats */}
        <FadeSlideIn delay={160} style={{ marginTop: Spacing.lg }}>
          <Card padded={false} style={{ flexDirection: 'row', paddingVertical: Spacing.md }}>
            <Stat label="Applications" value={loans.isPending ? '–' : String(apps.length)} />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <Stat label="In progress" value={loans.isPending ? '–' : String(inProgress)} />
            <View style={{ width: 1, backgroundColor: colors.border }} />
            <Stat label="Approved" value={loans.isPending ? '–' : String(approved)} />
          </Card>
        </FadeSlideIn>

        {/* Verification */}
        {snapshot ? (
          <FadeSlideIn delay={210} style={{ marginTop: Spacing.lg }}>
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm }}>
                <Icon name="verified-user" size={20} color={colors.success} />
                <AppText variant="titleLarge">Your verification</AppText>
              </View>
              <VerifyRow label="PAN" status={snapshot.pan?.status ?? 'NOT_STARTED'} />
              <VerifyRow label="KYC" status={snapshot.kyc?.status ?? 'NOT_STARTED'} />
              <VerifyRow label="Selfie check" status={snapshot.identity?.status ?? 'NOT_STARTED'} />
            </Card>
          </FadeSlideIn>
        ) : null}

        {/* Recent */}
        <View style={{ marginTop: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="titleLarge">Recent applications</AppText>
          <TextLinkButton label="See all" onPress={() => router.navigate(Routes.homeLoans)} />
        </View>
        <View style={{ marginTop: Spacing.sm, gap: Spacing.sm }}>
          {loans.isPending ? (
            <ShimmerList count={2} height={76} />
          ) : loans.isError ? (
            <AppText variant="bodySmall">Couldn't load your applications.</AppText>
          ) : apps.length === 0 ? (
            <Card><AppText variant="bodyMedium">You haven't applied for a loan yet.</AppText></Card>
          ) : (
            apps.slice(0, 2).map((app) => (
              <PressableScale key={app.id} onPress={() => router.push(Routes.loanDetail(app.id))} accessibilityRole="button">
                <Card style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <AppText variant="titleMedium">{Fmt.currency(app.requestedAmount)}</AppText>
                    <AppText variant="bodySmall">{app.applicationNumber}</AppText>
                  </View>
                  <LoanStatusChip status={app.status} />
                </Card>
              </PressableScale>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', width: 76 }}>
      <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} color={colors.primary} />
      </View>
      <AppText variant="labelMedium" color={colors.text} style={{ marginTop: 6 }}>{label}</AppText>
    </PressableScale>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <AppText variant="headlineMedium" color={colors.primary}>{value}</AppText>
      <AppText variant="bodySmall">{label}</AppText>
    </View>
  );
}

function VerifyRow({ label, status }: { label: string; status: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <AppText variant="bodyMedium">{label}</AppText>
      <VerificationStatusChip status={status} />
    </View>
  );
}
