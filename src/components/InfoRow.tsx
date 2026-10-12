import React from 'react';
import { View } from 'react-native';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';

export function IconChip({ icon, size = 40 }: { icon: IconName; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: Spacing.radiusSm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={size * 0.5} color={colors.primary} />
    </View>
  );
}

export function InfoRow({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
      <IconChip icon={icon} />
      <View style={{ flex: 1 }}>
        <AppText variant="titleMedium">{title}</AppText>
        <AppText variant="bodySmall">{subtitle}</AppText>
      </View>
    </View>
  );
}

export function KeyValueRow({ label, value, emphasize = false, small = false }: { label: string; value: string; emphasize?: boolean; small?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: small ? 3 : 4, gap: 12 }}>
      <AppText variant={small ? 'bodySmall' : 'bodyMedium'} style={{ flexShrink: 1 }}>{label}</AppText>
      {emphasize
        ? <AppText variant="titleMedium">{value}</AppText>
        : <AppText variant="bodyMedium" color={undefined} style={{ fontFamily: 'Inter_600SemiBold', color: undefined }}>{value}</AppText>}
    </View>
  );
}
