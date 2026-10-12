import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon, IconName } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { ScrollScreen } from '@/components/Screen';
import { Routes } from '@/core/routing/gate';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { useAuthStore } from '@/features/auth/authStore';
import { useOnboarding } from '@/features/onboarding/useOnboarding';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { snapshot } = useOnboarding();
  const p = snapshot?.profile;
  const fullName = [p?.firstName, p?.lastName].filter((s) => s && s.length > 0).join(' ');
  const initial = (fullName ? fullName[0] : user?.phoneNumber?.[0] ?? '?').toUpperCase();

  const confirmLogout = () =>
    Alert.alert('Log out?', "You'll need to verify your number again to sign back in.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => { logout(); } },
    ]);

  return (
    <ScrollScreen>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <AppText variant="displayMedium" color={colors.primary}>{initial}</AppText>
        </View>
        <AppText variant="headlineSmall" style={{ marginTop: Spacing.md }}>{fullName || 'InPockets user'}</AppText>
        {user ? <AppText variant="bodyMedium" style={{ marginTop: 2 }}>+91 {Fmt.phoneGrouped(user.phoneNumber)}</AppText> : null}
      </View>

      <Card padded={false} style={{ marginTop: Spacing.xl }}>
        <Row icon="settings" title="Settings" subtitle="Appearance and preferences" onPress={() => router.push(Routes.settings)} />
        <Divider />
        <Row icon="shield" title="Security & sessions" subtitle="Manage devices signed in to your account" onPress={() => router.push(Routes.sessions)} />
        <Divider />
        <Row icon="folder" title="Documents" subtitle="View documents collected during KYC" onPress={() => router.push(Routes.documents)} />
      </Card>

      <Card padded={false} style={{ marginTop: Spacing.lg }}>
        <Row icon="logout" title="Log out" danger onPress={confirmLogout} />
      </Card>
    </ScrollScreen>
  );
}

export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

export function Row({ icon, title, subtitle, onPress, danger, right }: {
  icon: IconName; title: string; subtitle?: string; onPress?: () => void; danger?: boolean; right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const tint = danger ? colors.danger : colors.text;
  return (
    <PressableScale onPress={onPress} disabled={!onPress} scaleTo={0.99} accessibilityRole={onPress ? 'button' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md }}>
      <Icon name={icon} size={24} color={danger ? colors.danger : colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <AppText variant="titleMedium" color={tint}>{title}</AppText>
        {subtitle ? <AppText variant="bodySmall">{subtitle}</AppText> : null}
      </View>
      {right ?? (onPress && !danger ? <Icon name="chevron-right" size={24} color={colors.textSecondary} /> : null)}
    </PressableScale>
  );
}
