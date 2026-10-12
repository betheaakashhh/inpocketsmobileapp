import React from 'react';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

/** Selectable pill (Flutter ChoiceChip). */
export function Chip({ label, selected, onPress, disabled }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: Spacing.radiusPill, borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primarySoft : colors.surface,
      }}
    >
      <AppText variant="labelLarge" color={selected ? colors.primary : colors.text}>{label}</AppText>
    </PressableScale>
  );
}
