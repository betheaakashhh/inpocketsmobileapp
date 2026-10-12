import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { Spacing } from '@/core/theme/colors';
import { Fonts } from '@/core/theme/typography';
import { useTheme } from '@/core/theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props extends Omit<TextInputProps, 'style'> {
  label: string;
  errorText?: string | null;
  prefixText?: string;
}

export const TextField = React.forwardRef<TextInput, Props>(function TextField(
  { label, errorText, prefixText, onFocus, onBlur, editable = true, ...rest },
  ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = React.useState(false);
  const hasError = !!errorText;

  return (
    <Animated.View layout={LinearTransition.duration(160)}>
      <AppText variant="labelLarge" color={colors.text}>{label}</AppText>
      <View
        style={{
          marginTop: Spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.surfaceAlt,
          borderRadius: Spacing.radiusMd,
          borderWidth: focused || hasError ? 1.6 : 1,
          borderColor: hasError ? colors.danger : focused ? colors.primary : colors.border,
          paddingHorizontal: Spacing.md,
          opacity: editable ? 1 : 0.6,
        }}
      >
        {prefixText ? <AppText variant="bodyLarge" style={{ marginRight: 4 }}>{prefixText}</AppText> : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={colors.textSecondary}
          selectionColor={colors.primary}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          style={{
            flex: 1,
            paddingVertical: 16,
            fontFamily: Fonts.inter400,
            fontSize: 16,
            color: colors.text,
          }}
          {...rest}
        />
      </View>
      {hasError ? (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs }}>
          <Icon name="error-outline" size={14} color={colors.danger} />
          <AppText variant="bodySmall" color={colors.danger} style={{ flexShrink: 1 }}>{errorText}</AppText>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});
