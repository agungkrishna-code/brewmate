/** Resolves the active colour theme from preferences + the device scheme. */

import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { Themes, type AppTheme, type ThemeMode } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';

export function useThemeMode(): ThemeMode {
  const { preferences } = useSettings();
  const system = useColorScheme();
  if (preferences.themeMode === 'light' || preferences.themeMode === 'dark') {
    return preferences.themeMode;
  }
  return system === 'dark' ? 'dark' : 'light';
}

export function useTheme(): AppTheme {
  const mode = useThemeMode();
  return useMemo(() => Themes[mode], [mode]);
}
