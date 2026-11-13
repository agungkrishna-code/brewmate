import { BrewDraftProvider } from '@/contexts/brew-draft-context';
import { SettingsProvider, useSettings } from '@/contexts/settings-context';
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
import { Suspense, useEffect, useMemo } from 'react';
import { View } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function AppShell() {
  const theme = useTheme();
  const { ready } = useSettings();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = theme.mode === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.primary,
        background: theme.bg,
        card: theme.surface,
        text: theme.text,
        border: theme.border,
        notification: theme.gold,
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
    <Suspense fallback={<View style={{ flex: 1, backgroundColor: '#F5F0E8' }} />}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initializeDatabase} useSuspense>
        <SettingsProvider>
          <AppShell />
        </SettingsProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
