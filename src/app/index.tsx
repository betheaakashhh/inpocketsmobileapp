import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming,
} from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { BrandMark } from '@/components/BrandMark';
import { GradientBackground } from '@/components/GradientBackground';
import { Spacing } from '@/core/theme/colors';

/** Splash: logo scales in, wordmark fades, tagline follows. */
export default function SplashRoute() {
  const reduced = useReducedMotion();
  const logo = useSharedValue(reduced ? 1 : 0);
  const word = useSharedValue(reduced ? 1 : 0);
  const tag = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    logo.value = withTiming(1, { duration: 540, easing: Easing.out(Easing.back(1.6)) });
    word.value = withTiming(1, { duration: 360, easing: Easing.out(Easing.quad) });
    tag.value = withDelay(320, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
  }, [reduced, logo, word, tag]);

  const logoStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, logo.value * 2.5), transform: [{ scale: 0.6 + 0.4 * logo.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value }));
  const tagStyle = useAnimatedStyle(() => ({ opacity: tag.value }));

  return (
    <GradientBackground>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={logoStyle}><BrandMark size={88} /></Animated.View>
        <Animated.View style={[wordStyle, { marginTop: Spacing.lg }]}>
          <AppText variant="displayMedium">InPockets</AppText>
        </Animated.View>
        <Animated.View style={[tagStyle, { marginTop: Spacing.xs }]}>
          <AppText variant="bodyMedium">Lending, done right.</AppText>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}
