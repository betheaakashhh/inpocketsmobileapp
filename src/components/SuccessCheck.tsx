import React, { useEffect } from 'react';
import Animated, {
  Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Motion } from '@/core/theme/motion';
import { useTheme } from '@/core/theme/ThemeProvider';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Circle draws itself, then a checkmark strokes in. Spec sequence:
 * success circle -> expansion -> checkmark (~500-800 ms).
 * Never show this before the backend confirms success.
 */
export function SuccessCheck({ size = 96, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  const tint = color ?? colors.success;
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) progress.value = withTiming(1, { duration: Motion.celebration, easing: Easing.out(Easing.cubic) });
  }, [reduced, progress]);

  const r = size / 2 - 3;
  const c = size / 2;
  const circ = 2 * Math.PI * r;
  const checkLen = 0.6797 * size;

  const circleProps = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, progress.value / 0.65));
    return { strokeDashoffset: circ * (1 - p), fillOpacity: 0.12 * p };
  });
  const checkProps = useAnimatedProps(() => {
    const p = Math.min(1, Math.max(0, (progress.value - 0.55) / 0.45));
    return { strokeDashoffset: checkLen * (1 - p) };
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <AnimatedCircle
        cx={c} cy={c} r={r}
        stroke={tint} strokeWidth={4} strokeLinecap="round"
        fill={tint}
        strokeDasharray={[circ, circ]}
        rotation={-90} origin={`${c}, ${c}`}
        animatedProps={circleProps}
      />
      <AnimatedPath
        d={`M ${size * 0.28} ${size * 0.52} L ${size * 0.44} ${size * 0.68} L ${size * 0.74} ${size * 0.34}`}
        stroke={tint} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none"
        strokeDasharray={[checkLen, checkLen]}
        animatedProps={checkProps}
      />
    </Svg>
  );
}
