import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { DimensionValue, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';

import { Spacing } from '@/core/theme/colors';
import { useTheme } from '@/core/theme/ThemeProvider';

export function ShimmerBox({ width = '100%', height = 16, radius = Spacing.radiusSm }: { width?: DimensionValue; height?: number; radius?: number }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [w, setW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    x.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false);
  }, [reduced, x]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -w + x.value * w * 2 }] }));
  const highlight = colors.isDark ? colors.border : 'rgba(255,255,255,0.85)';

  return (
    <View
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt, overflow: 'hidden' }}
    >
      {w > 0 && !reduced ? (
        <Animated.View style={[{ ...absoluteFill, width: w }, style]}>
          <LinearGradient
            colors={['transparent', highlight, 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const absoluteFill = { position: 'absolute' as const, top: 0, bottom: 0, left: 0 };

export function ShimmerList({ count, height, radius = Spacing.radiusMd }: { count: number; height: number; radius?: number }) {
  return (
    <View style={{ gap: Spacing.md }}>
      {Array.from({ length: count }).map((_, i) => <ShimmerBox key={i} height={height} radius={radius} />)}
    </View>
  );
}
