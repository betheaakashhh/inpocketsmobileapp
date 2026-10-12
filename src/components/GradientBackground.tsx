import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/core/theme/ThemeProvider';

function Glow({ color, size }: { color: string; size: number }) {
  // Stacked translucent discs fake a blur without needing expo-blur.
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[1, 0.78, 0.56, 0.34].map((s) => (
        <View
          key={s}
          style={{ position: 'absolute', width: size * s, height: size * s, borderRadius: size, backgroundColor: color }}
        />
      ))}
    </View>
  );
}

/** Slow drifting glow behind splash / auth / completion screens. */
export function GradientBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    t.value = withRepeat(withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, t]);

  const a = useAnimatedStyle(() => ({ transform: [{ translateY: t.value * 30 }, { translateX: -t.value * 20 }] }));
  const b = useAnimatedStyle(() => ({ transform: [{ translateY: -t.value * 20 }, { translateX: t.value * 30 }] }));

  const alpha = colors.isDark ? 0.07 : 0.06;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, overflow: 'hidden' }}>
      <Animated.View pointerEvents="none" style={[styles.blobTop, a]}>
        <Glow color={`rgba(59,130,246,${alpha})`} size={340} />
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.blobBottom, b]}>
        <Glow color={`rgba(96,165,250,${alpha})`} size={300} />
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  blobTop: { position: 'absolute', top: -140, right: -110 },
  blobBottom: { position: 'absolute', bottom: -150, left: -120 },
});
