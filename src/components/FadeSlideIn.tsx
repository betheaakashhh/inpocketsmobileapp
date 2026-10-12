import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';

import { Motion } from '@/core/theme/motion';

/** Opacity + 12 px upward movement, once, after an optional delay. */
export function FadeSlideIn({
  children, delay = 0, offset = Motion.enterDistance, duration = Motion.normal, style,
}: { children: React.ReactNode; delay?: number; offset?: number; duration?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) p.value = withDelay(delay, withTiming(1, { duration, easing: Motion.easeStandard }));
  }, [reduced, delay, duration, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * offset }],
  }));

  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
