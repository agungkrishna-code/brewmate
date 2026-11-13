import { Platform, type TextStyle } from 'react-native';

/**
 * Brewmate design tokens.
 *
 * One system, two moods: a cream "paper" light theme and a deep espresso dark
 * theme. Everything is derived from these values so screens never hard-code a
 * colour.
 */

export const Palette = {
  espresso: '#35251E',
  coffee: '#604637',
  cream: '#F5F0E8',
  warmWhite: '#FFFCF7',
  gold: '#C7A675',
  softGray: '#8D8983',
  deepEspresso: '#14100D',
} as const;

export type ThemeMode = 'light' | 'dark';

/** What the user picked in Settings; `system` follows the device. */
export type ThemePreference = ThemeMode | 'system';

export interface AppTheme {
  mode: ThemeMode;
  /** Page background. */
  bg: string;
  /** Slightly darker page section. */
  bgSubtle: string;
  /** Card background. */
  surface: string;
  /** Card background that needs to sit above another card. */
  surfaceRaised: string;
  /** Inset wells, inputs, chips. */
  surfaceSunken: string;
  text: string;
  textMuted: string;
  textFaint: string;
  /** Primary action background. */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  gold: string;
  goldSoft: string;
  border: string;
  borderStrong: string;
  danger: string;
  dangerSoft: string;
  success: string;
  shadow: string;
  tabBar: string;
  tabInactive: string;
  overlay: string;
}

export const Themes: Record<ThemeMode, AppTheme> = {
  light: {
    mode: 'light',
    bg: '#F5F0E8',
    bgSubtle: '#EDE6D9',
    surface: '#FFFCF7',
    surfaceRaised: '#FFFFFF',
    surfaceSunken: '#EFE8DB',
    text: '#35251E',
    textMuted: '#6E6156',
    textFaint: '#928B83',
    primary: '#604637',
    onPrimary: '#FFFCF7',
    primarySoft: '#EBE0D2',
    gold: '#B08D57',
    goldSoft: '#F0E3CB',
    border: '#E4DACA',
    borderStrong: '#D2C3AE',
    danger: '#A6473C',
    dangerSoft: '#F6E4E1',
    success: '#5C7A55',
    shadow: '#35251E',
    tabBar: '#FFFCF7',
    tabInactive: '#928B83',
    overlay: 'rgba(53, 37, 30, 0.42)',
  },
  dark: {
    mode: 'dark',
    bg: '#14100D',
    bgSubtle: '#1A1411',
    surface: '#221A15',
    surfaceRaised: '#2B211A',
    surfaceSunken: '#171210',
    text: '#F5F0E8',
    textMuted: '#BCB0A4',
    textFaint: '#8D8983',
    primary: '#C7A675',
    onPrimary: '#20160F',
    primarySoft: '#2E231B',
    gold: '#C7A675',
    goldSoft: '#3A2C21',
    border: '#332720',
    borderStrong: '#4A392E',
    danger: '#D98276',
    dangerSoft: '#33211D',
    success: '#8FAE86',
    shadow: '#000000',
    tabBar: '#1A1411',
    tabInactive: '#8D8983',
    overlay: 'rgba(0, 0, 0, 0.62)',
  },
};

/**
 * Brand surface used for the hero cards and the brewing timer. It stays
 * espresso-dark in both themes so the app keeps one recognisable signature.
 */
export const BrandSurface = {
  bg: '#35251E',
  bgDeep: '#2A1C16',
  text: '#FFFCF7',
  muted: 'rgba(255, 252, 247, 0.64)',
  faint: 'rgba(255, 252, 247, 0.42)',
  line: 'rgba(255, 252, 247, 0.12)',
  accent: '#C7A675',
  onAccent: '#20160F',
} as const;

export const FontFamily = {  serif: Platform.select({ android: 'serif', ios: 'Georgia', default: 'serif' }),
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
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.6,
  } satisfies TextStyle,
  h1: {
    fontFamily: FontFamily.serif,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  } satisfies TextStyle,
  h2: {
    fontFamily: FontFamily.serif,
    fontSize: 21,
    lineHeight: 27,
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
    fontSize: 13,
    lineHeight: 18,
  } satisfies TextStyle,
  caption: {
    fontFamily: FontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
  } satisfies TextStyle,
  label: {
    fontFamily: FontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  mono: {
    fontFamily: FontFamily.mono,
    fontSize: 15,
    lineHeight: 20,
  } satisfies TextStyle,
  monoLarge: {
    fontFamily: FontFamily.mono,
    fontSize: 64,
    lineHeight: 70,
    letterSpacing: -1,
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
  xxl: 28,
  xxxl: 40,
} as const;

export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

export const TouchTarget = 48;
