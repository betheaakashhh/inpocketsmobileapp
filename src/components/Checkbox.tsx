import React from 'react';
import { Pressable, View } from 'react-native';

import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

export function CheckboxRow({ value, onChange, label, disabled }: { value: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => onChange(!value)}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, opacity: disabled ? 0.5 : 1 }}
    >
      <View
        style={{
          width: 24, height: 24, borderRadius: 7, borderWidth: 1.6, marginTop: 1,
          borderColor: value ? colors.primary : colors.textSecondary,
          backgroundColor: value ? colors.primary : 'transparent',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        {value ? <Icon name="check" size={16} color={colors.onPrimary} /> : null}
      </View>
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{label}</AppText>
    </Pressable>
  );
}
