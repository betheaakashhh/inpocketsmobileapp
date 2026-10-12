import React from 'react';
import { View } from 'react-native';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** Shown on every screen backed by the mock lifecycle repository. */
export function IllustrativeBanner() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md, borderRadius: Spacing.radiusMd, backgroundColor: colors.warningBg, marginBottom: Spacing.md }}>
      <Icon name="info-outline" size={18} color={colors.warning} />
      <AppText variant="bodySmall" color={colors.warning} style={{ flex: 1 }}>
        Illustrative terms: rates, fees and this flow are placeholders until the lending policy and provider integrations are live.
      </AppText>
    </View>
  );
}
