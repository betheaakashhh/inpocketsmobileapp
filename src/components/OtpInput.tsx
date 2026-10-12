import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import Animated, {
  useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';
import { Fonts } from '@/core/theme/typography';

export interface OtpInputHandle {
  clear: () => void;
  focus: () => void;
}

interface Props {
  length?: number;
  onCompleted: (code: string) => void;
  onChange?: (code: string) => void;
  hasError?: boolean;
  enabled?: boolean;
}

/**
 * Six boxed digits driven by ONE hidden TextInput. That's the robust RN
 * pattern: paste, SMS autofill (oneTimeCode / sms-otp) and backspace all
 * "just work", unlike six chained inputs. Shakes when `hasError` flips true.
 */
export const OtpInput = forwardRef<OtpInputHandle, Props>(function OtpInput(
  { length = 6, onCompleted, onChange, hasError = false, enabled = true },
  ref,
) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const inputRef = useRef<TextInput>(null);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const shake = useSharedValue(0);
  const prevError = useRef(false);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setValue('');
      inputRef.current?.focus();
    },
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (hasError && !prevError.current && !reduced) {
      shake.value = withSequence(
        withTiming(8, { duration: 50 }),
        withTiming(-8, { duration: 80 }),
        withTiming(6, { duration: 70 }),
        withTiming(-4, { duration: 60 }),
        withTiming(0, { duration: 50 }),
      );
    }
    prevError.current = hasError;
  }, [hasError, reduced, shake]);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, length);
    setValue(digits);
    onChange?.(digits);
    if (digits.length === length) onCompleted(digits);
  };

  const activeIndex = Math.min(value.length, length - 1);

  return (
    <Animated.View style={[{ height: 56 }, shakeStyle]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} pointerEvents="none">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isActive = focused && enabled && i === activeIndex && !hasError;
          const borderColor = hasError ? colors.danger : filled || isActive ? colors.primary : colors.border;
          return (
            <View
              key={i}
              style={{
                width: 48,
                height: 56,
                borderRadius: Spacing.radiusSm,
                borderWidth: filled || isActive ? 1.8 : 1.2,
                borderColor,
                backgroundColor: colors.surfaceAlt,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: isActive ? 1.04 : 1 }],
              }}
            >
              <Animated.Text style={{ fontFamily: Fonts.sora600, fontSize: 20, color: colors.text }}>
                {value[i] ?? ''}
              </Animated.Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        editable={enabled}
        autoFocus
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={length}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, color: 'transparent' }}
        accessibilityLabel={`${length}-digit verification code`}
      />
    </Animated.View>
  );
});
