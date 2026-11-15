import { Platform, type TextStyle } from 'react-native';

/**
 * Brewmate design tokens.
 *
 * Tactile precision-instrument system: warm alabaster/stone in light mode,
 * deep matte charcoal in dark mode, with a single muted copper-amber accent
 * reserved for active states and primary brewing controls.
 */

export const Palette = {
  stone: '#F4F1EB',
  alabaster: '#FAF8F4',
  obsidian: '#1C1917',
  charcoal: '#131110',
  instrument: '#1A1715',
  copper: '#A66334',
  copperBright: '#C98A56',
} as const;

export type ThemeMode = 'light' | 'dark';

/** What the user picked in Settings; `system` follows the device. */
export type ThemePreference = ThemeMode | 'system';

export interface AppTheme {
  mode: ThemeMode;
  /** Page background. */
  bg: string;
  /** Slightly recessed section background. */
  bgSubtle: string;
  /** Primary card / grouped list surface. */
  surface: string;
  /** Elevated surface above another surface. */
  surfaceRaised: string;
  /** Inset wells, inputs, recessed tracks. */
  surfaceSunken: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Primary action background (high-contrast monochrome ink). */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Single muted copper-amber hardware accent. */
  accent: string;
  accentSoft: string;
  onAccent: string;
  /** @deprecated Alias for `accent` retained for compatibility. */
  gold: string;
  /** @deprecated Alias for `accentSoft` retained for compatibility. */
  goldSoft: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  success: string;
  /** Switch knob. Stays light in both themes so a toggle reads as a physical knob. */
  switchThumb: string;
  shadow: string;
  tabBar: string;
  tabInactive: string;
  overlay: string;
}

export const Themes: Record<ThemeMode, AppTheme> = {
  light: {
    mode: 'light',
    bg: '#F4F1EB',
    bgSubtle: '#EAE5DC',
    surface: '#FAF8F4',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#ECE7DE',
    text: '#1C1917',
    textMuted: '#57534E',
    textFaint: '#6B655E',
    primary: '#231F1D',
    onPrimary: '#FAF8F4',
    primarySoft: '#EAE4DA',
    accent: '#A66334',
    accentSoft: '#F2E6DC',
    onAccent: '#FAF8F4',
    gold: '#A66334',
    goldSoft: '#F2E6DC',
    border: '#DCD6CC',
    borderStrong: '#C5BDB0',
    danger: '#A8382B',
    dangerSoft: '#F5E2DF',
    success: '#3F6A47',
    switchThumb: '#FFFFFF',
    shadow: '#1C1917',
    tabBar: '#FAF8F4',
    tabInactive: '#6B655E',
    overlay: 'rgba(24, 21, 18, 0.48)',
  },
  dark: {
    mode: 'dark',
    bg: '#131110',
    bgSubtle: '#1A1715',
    surface: '#1E1B18',
    surfaceRaised: '#26221E',
    surfaceSunken: '#161311',
    text: '#F2EFE9',
    textMuted: '#B5AEA5',
    textFaint: '#918A81',
    primary: '#F2EFE9',
    onPrimary: '#131110',
    primarySoft: '#292420',
    accent: '#C98A56',
    accentSoft: '#2D2219',
    onAccent: '#131110',
    gold: '#C98A56',
    goldSoft: '#2D2219',
    border: '#2E2925',
    borderStrong: '#443D37',
    danger: '#E07B6E',
    dangerSoft: '#341F1C',
    success: '#7FA883',
    switchThumb: '#F5F2EC',
    shadow: '#000000',
    tabBar: '#1A1715',
    tabInactive: '#918A81',
    overlay: 'rgba(0, 0, 0, 0.68)',
  },
};

/**
 * Instrument dark surface used for hero readouts and the active brewing timer.
 * Unified matte charcoal across both light and dark themes with WCAG-AA
 * verified text tokens.
 */
export const BrandSurface = {
  bg: '#1A1715',
  bgDeep: '#12100E',
  surface: '#26221E',
  text: '#F5F2EC',
  muted: '#B8B0A6',
  faint: '#968E84',
  line: 'rgba(245, 242, 236, 0.12)',
  border: 'rgba(245, 242, 236, 0.16)',
  accent: '#C98A56',
  onAccent: '#131110',
} as const;

export const FontFamily = {
  serif: Platform.select({ android: 'serif', ios: 'Georgia', default: 'serif' }),
  sans: Platform.select({ android: 'sans-serif', ios: 'System', default: 'sans-serif' }),
  sansMedium: Platform.select({
    android: 'sans-serif-medium',
    ios: 'System',
    default: 'sans-serif',
  }),
  mono: Platform.select({ android: 'monospace', ios: 'Menlo', default: 'monospace' }),
} as const;

export const Typography = {
  display: {
    fontFamily: FontFamily.serif,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  h1: {
    fontFamily: FontFamily.serif,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h2: {
    fontFamily: FontFamily.serif,
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.2,
  } satisfies TextStyle,
  h3: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 22,
  } satisfies TextStyle,
  body: {
    fontFamily: FontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  bodyStrong: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  } satisfies TextStyle,
  small: {
    fontFamily: FontFamily.sans,
    fontSize: 13.5,
    lineHeight: 19,
  } satisfies TextStyle,
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
  /** Clean sentence-case form and table field label. */
  fieldLabel: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 12.5,
    lineHeight: 17,
  } satisfies TextStyle,
  /** Compact instrument dial header (uppercase reserved strictly for small readouts). */
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.05,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  /** Tabular numeric readout variants so numbers align without layout jitter. */
  metricHero: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  metric: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 20,
    lineHeight: 25,
    letterSpacing: -0.3,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  metricSmall: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 14,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
  monoLarge: {
    fontFamily: FontFamily.mono,
    fontSize: 60,
    lineHeight: 66,
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  } satisfies TextStyle,
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 36,
} as const;

export const Radius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const;

export const TouchTarget = 48;
