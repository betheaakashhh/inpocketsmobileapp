import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

import { secondaryVariants, TextVariant, typeScale } from '@/core/theme/typography';
import { useTheme } from '@/core/theme/ThemeProvider';

interface Props extends TextProps {
  variant?: TextVariant;
  color?: string;
  weight?: TextStyle['fontWeight'];
}

export function AppText({ variant = 'bodyMedium', color, style, children, ...rest }: Props) {
  const { colors } = useTheme();
  const base = typeScale[variant];
  const defaultColor = secondaryVariants.has(variant) ? colors.textSecondary : colors.text;
  return (
    <Text {...rest} style={[base, { color: color ?? defaultColor }, style]}>
      {children}
    </Text>
  );
}
