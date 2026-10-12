import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';

import { useTheme } from '@/core/theme/ThemeProvider';
import { Icon } from './Icon';

export function BrandMark({ size = 56 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[...colors.gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        width: size, height: size, borderRadius: size * 0.28, alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.shadow, shadowOpacity: 1, shadowRadius: size * 0.3, shadowOffset: { width: 0, height: size * 0.16 }, elevation: 8,
      }}
    >
      <Icon name="account-balance-wallet" size={size * 0.48} color="#FFFFFF" />
    </LinearGradient>
  );
}
