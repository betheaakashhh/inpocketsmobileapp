import { Easing } from 'react-native-reanimated';

/**
 * Motion tokens from "InPockets Production Motion & Animation Specification".
 * Starting values — tune on real devices.
 */
export const Motion = {
  fast: 160,
  normal: 280,
  emphasized: 420,
  celebration: 700,
  pressScale: 0.97,
  enterDistance: 12,
  spring: { damping: 18, stiffness: 180 },
  easeStandard: Easing.out(Easing.cubic),
  easeEmphasized: Easing.out(Easing.exp),
} as const;
