import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Spacing } from '@/core/theme/colors';
import { Motion } from '@/core/theme/motion';
import { useTheme } from '@/core/theme/ThemeProvider';

function Segment({ active }: { active: boolean }) {
  const { colors } = useTheme();
  const p = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(active ? 1 : 0, { duration: Motion.normal, easing: Motion.easeStandard });
  }, [active, p]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], [colors.border, colors.primary]),
  }));
  return <Animated.View style={[{ flex: 1, height: 5, borderRadius: Spacing.radiusPill }, style]} />;
}

/** Onboarding progress: Profile -> PAN -> KYC -> Identity. */
export function StepProgress({ totalSteps, currentStep }: { totalSteps: number; currentStep: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
      {Array.from({ length: totalSteps }).map((_, i) => <Segment key={i} active={i <= currentStep} />)}
    </View>
  );
}
