import { TextStyle } from 'react-native';

export type TextVariant =
  | 'displayLarge' | 'displayMedium' | 'headlineMedium' | 'headlineSmall'
  | 'titleLarge' | 'titleMedium'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'labelLarge' | 'labelMedium';

export const Fonts = {
  sora600: 'Sora_600SemiBold',
  sora700: 'Sora_700Bold',
  inter400: 'Inter_400Regular',
  inter600: 'Inter_600SemiBold',
  inter700: 'Inter_700Bold',
} as const;

/** Same scale as the Flutter TextTheme (Sora headings, Inter body). */
export const typeScale: Record<TextVariant, TextStyle> = {
  displayLarge:   { fontFamily: Fonts.sora700, fontSize: 34, letterSpacing: -0.5, lineHeight: 39 },
  displayMedium:  { fontFamily: Fonts.sora700, fontSize: 28, letterSpacing: -0.4, lineHeight: 34 },
  headlineMedium: { fontFamily: Fonts.sora600, fontSize: 22, lineHeight: 28 },
  headlineSmall:  { fontFamily: Fonts.sora600, fontSize: 18, lineHeight: 24 },
  titleLarge:     { fontFamily: Fonts.sora600, fontSize: 16, lineHeight: 22 },
  titleMedium:    { fontFamily: Fonts.inter600, fontSize: 15, lineHeight: 21 },
  bodyLarge:      { fontFamily: Fonts.inter400, fontSize: 16, lineHeight: 24 },
  bodyMedium:     { fontFamily: Fonts.inter400, fontSize: 14, lineHeight: 21 },
  bodySmall:      { fontFamily: Fonts.inter400, fontSize: 12, lineHeight: 17 },
  labelLarge:     { fontFamily: Fonts.inter600, fontSize: 14, lineHeight: 20 },
  labelMedium:    { fontFamily: Fonts.inter600, fontSize: 12, letterSpacing: 0.2, lineHeight: 16 },
};

/** Variants whose default colour is the secondary text colour. */
export const secondaryVariants: ReadonlySet<TextVariant> = new Set(['bodyMedium', 'bodySmall', 'labelMedium']);
