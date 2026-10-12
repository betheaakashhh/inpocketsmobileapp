/**
 * Brand palette (from you):
 *   #3B82F6  primary         #60A5FA  primary-light / accent
 *   #1F2937  ink / dark surface        #F0F9FF  sky tint / light background
 * Everything else (borders, alt surfaces, secondary text, status colours) is
 * derived from those four so the app stays inside one visual family.
 */
export const Brand = {
  primary: '#3B82F6',
  primaryLight: '#60A5FA',
  ink: '#1F2937',
  sky: '#F0F9FF',
} as const;

export interface Palette {
  isDark: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryLight: string;
  onPrimary: string;
  primarySoft: string; // tinted fill for icon chips etc.
  gradient: readonly [string, string];
  success: string; successBg: string;
  warning: string; warningBg: string;
  danger: string; dangerBg: string;
  info: string; infoBg: string;
  neutral: string; neutralBg: string;
  shadow: string;
  overlay: string;
}

export const lightPalette: Palette = {
  isDark: false,
  bg: Brand.sky,
  surface: '#FFFFFF',
  surfaceAlt: '#E3F1FC',
  border: '#D3E5F5',
  text: Brand.ink,
  textSecondary: '#5B6677',
  primary: Brand.primary,
  primaryLight: Brand.primaryLight,
  onPrimary: '#FFFFFF',
  primarySoft: 'rgba(59,130,246,0.12)',
  gradient: [Brand.primary, Brand.primaryLight],
  success: '#16A34A', successBg: '#DCFCE7',
  warning: '#B45309', warningBg: '#FEF3C7',
  danger: '#DC2626', dangerBg: '#FEE2E2',
  info: '#2563EB', infoBg: '#DBEAFE',
  neutral: '#5B6677', neutralBg: '#E8EEF5',
  shadow: 'rgba(59,130,246,0.30)',
  overlay: 'rgba(15,23,42,0.45)',
};

export const darkPalette: Palette = {
  isDark: true,
  bg: '#111827',
  surface: Brand.ink,
  surfaceAlt: '#2A3647',
  border: '#374151',
  text: Brand.sky,
  textSecondary: '#9CA9BB',
  primary: Brand.primaryLight, // lighter blue keeps contrast on dark surfaces
  primaryLight: Brand.primary,
  onPrimary: '#0B1220',
  primarySoft: 'rgba(96,165,250,0.16)',
  gradient: [Brand.primary, Brand.primaryLight],
  success: '#4ADE80', successBg: 'rgba(74,222,128,0.16)',
  warning: '#FBBF24', warningBg: 'rgba(251,191,36,0.16)',
  danger: '#F87171', dangerBg: 'rgba(248,113,113,0.16)',
  info: '#60A5FA', infoBg: 'rgba(96,165,250,0.16)',
  neutral: '#9CA9BB', neutralBg: 'rgba(156,169,187,0.16)',
  shadow: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.6)',
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
  radiusSm: 10, radiusMd: 16, radiusLg: 24, radiusPill: 999,
} as const;
