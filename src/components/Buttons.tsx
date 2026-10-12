import React from 'react';
import { ActivityIndicator, StyleProp, View, ViewStyle } from 'react-native';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';

interface BaseProps {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({ label, onPress, isLoading = false, icon, fullWidth = true, style, disabled }: BaseProps & { isLoading?: boolean; disabled?: boolean }) {
  const { colors } = useTheme();
  const enabled = !!onPress && !isLoading && !disabled;
  return (
    <PressableScale
      onPress={enabled ? onPress : undefined}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled, busy: isLoading }}
      style={[
        {
          alignSelf: fullWidth ? 'stretch' : 'center',
          backgroundColor: colors.primary,
          opacity: enabled || isLoading ? 1 : 0.4,
          borderRadius: Spacing.radiusMd,
          paddingVertical: 16,
          paddingHorizontal: Spacing.lg,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          {icon ? <Icon name={icon} size={18} color={colors.onPrimary} /> : null}
          <AppText variant="titleMedium" color={colors.onPrimary}>{label}</AppText>
        </View>
      )}
    </PressableScale>
  );
}

export function SecondaryButton({ label, onPress, icon, fullWidth = true, style }: BaseProps) {
  const { colors } = useTheme();
  const enabled = !!onPress;
  return (
    <PressableScale
      onPress={onPress}
      disabled={!enabled}
      accessibilityRole="button"
      style={[
        {
          alignSelf: fullWidth ? 'stretch' : 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          opacity: enabled ? 1 : 0.5,
          borderRadius: Spacing.radiusMd,
          paddingVertical: 16,
          paddingHorizontal: Spacing.lg,
          minHeight: 52,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
        {icon ? <Icon name={icon} size={18} color={colors.text} /> : null}
        <AppText variant="titleMedium">{label}</AppText>
      </View>
    </PressableScale>
  );
}

export function TextLinkButton({ label, onPress, color }: { label: string; onPress?: () => void; color?: string }) {
  const { colors } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={!onPress} hitSlop={8} style={{ paddingHorizontal: 4, paddingVertical: 8 }}>
      <AppText variant="titleMedium" color={color ?? colors.primary}>{label}</AppText>
    </PressableScale>
  );
}
