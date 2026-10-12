import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: Spacing.radiusMd,
          borderWidth: 1,
          borderColor: colors.border,
          padding: padded ? Spacing.md : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
