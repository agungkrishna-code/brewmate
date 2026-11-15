import { BrewDraftProvider } from '@/contexts/brew-draft-context';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';
import { BrandSurface } from '@/constants/theme';
import { DATABASE_NAME, initializeDatabase } from '@/database/database';
import { useTheme } from '@/hooks/use-theme';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type Theme,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { Suspense, useEffect, useMemo } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell() {
  const theme = useTheme();
  const { ready } = useSettings();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  // Keep the native window behind React in sync so theme changes do not flash
  // the old background during navigation or while the system draws around it.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.bg).catch(() => undefined);
  }, [theme.bg]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.accent,
        background: theme.bg,
        card: theme.surface,
        text: theme.text,
        border: theme.border,
        notification: theme.accent,
      },
    };
  }, [theme]);

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  }

  return (
    <ThemeProvider value={navigationTheme}>
      <BrewDraftProvider>
        <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.bg },
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="brewing/timer"
            options={{ animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen name="recipes/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="recipes/edit" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="beans/new" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="grinders/new" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
      </BrewDraftProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <Suspense fallback={<View style={{ flex: 1, backgroundColor: BrandSurface.bg }} />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
        <SettingsProvider>
          <AppShell />
        </SettingsProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
