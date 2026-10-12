import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { SecondaryButton } from '@/components/Buttons';
import { Card } from '@/components/Card';
import { Icon, IconName } from '@/components/Icon';
import { ShimmerList } from '@/components/ShimmerBox';
import { useToast } from '@/components/Toast';
import { ApiException } from '@/core/api/errors';
import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fmt } from '@/core/utils/formatters';
import { isSessionActive } from '@/features/auth/models';
import { authRepository } from '@/features/auth/repository';

const deviceIcon = (t: string | null): IconName => (t === 'ios' ? 'phone-iphone' : t === 'android' ? 'phone-android' : 'devices-other');

export default function SessionsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['sessions'], queryFn: authRepository.getSessions });
  const [refreshing, setRefreshing] = useState(false);

  const msg = (e: unknown) => (e instanceof ApiException ? e.message : ApiException.unexpected().message);
  const revokeOthers = useMutation({
    mutationFn: authRepository.revokeOtherSessions,
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ['sessions'] }); toast.show(`Signed out of ${n} other device(s).`, 'success'); },
    onError: (e) => toast.show(msg(e), 'error'),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => authRepository.revokeSession(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (e) => toast.show(msg(e), 'error'),
  });

  const active = (q.data ?? []).filter(isSessionActive);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.sm }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} colors={[colors.primary]}
        onRefresh={async () => { setRefreshing(true); await q.refetch(); setRefreshing(false); }} />}
    >
      <Stack.Screen options={{ headerShown: true, title: 'Security & sessions' }} />
      {q.isPending ? <ShimmerList count={3} height={70} /> : q.isError ? (
        <View style={{ alignItems: 'center', paddingTop: 80 }}><AppText variant="bodyMedium">Couldn't load your sessions.</AppText></View>
      ) : (
        <>
          {active.length > 1 ? (
            <View style={{ marginBottom: Spacing.sm }}>
              <SecondaryButton label="Log out all other devices" icon="logout" onPress={() => revokeOthers.mutate()} />
            </View>
          ) : null}
          {active.map((s) => (
            <Card key={s.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
              <Icon name={deviceIcon(s.deviceType)} size={24} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText variant="titleMedium">{s.deviceName ?? 'Unknown device'}</AppText>
                <AppText variant="bodySmall">
                  {s.lastUsedAt ? `Active ${Fmt.relativeShort(s.lastUsedAt)}` : `Signed in ${Fmt.relativeShort(s.createdAt)}`}
                </AppText>
              </View>
              <Pressable onPress={() => revoke.mutate(s.id)} hitSlop={10} accessibilityLabel="Sign out this device">
                <Icon name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}
