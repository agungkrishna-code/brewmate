/** User preferences: theme, language, haptics and screen-awake behaviour. */

import type { ThemePreference } from '@/constants/theme';
import type { LanguagePreference } from '@/i18n';
import {
  PREFERENCE_KEYS,
  readPreferences,
  removePreference,
  setPreference,
  type Preferences,
} from '@/services/preferences';
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const FALLBACK: Preferences = {
  themeMode: 'system',
  language: 'system',
  haptics: true,
  keepAwake: true,
  lastGrinderId: null,
};

interface SettingsContextValue {
  preferences: Preferences;
  ready: boolean;
  update: (patch: Partial<Preferences>) => Promise<void>;
  setThemeMode: (mode: ThemePreference) => Promise<void>;
  setLanguage: (language: LanguagePreference) => Promise<void>;
  setHaptics: (enabled: boolean) => Promise<void>;
  setKeepAwake: (enabled: boolean) => Promise<void>;
  setLastGrinderId: (id: string | null) => Promise<void>;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [preferences, setPreferences] = useState<Preferences>(FALLBACK);
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    const next = await readPreferences(db);
    setPreferences(next);
    setReady(true);
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await readPreferences(db);
        if (cancelled) return;
        setPreferences(next);
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  const update = useCallback(
    async (patch: Partial<Preferences>) => {
      setPreferences((current) => ({ ...current, ...patch }));
      if (patch.themeMode !== undefined) {
        await setPreference(db, PREFERENCE_KEYS.themeMode, patch.themeMode);
      }
      if (patch.language !== undefined) {
        await setPreference(db, PREFERENCE_KEYS.language, patch.language);
      }
      if (patch.haptics !== undefined) {
        await setPreference(db, PREFERENCE_KEYS.haptics, String(patch.haptics));
      }
      if (patch.keepAwake !== undefined) {
        await setPreference(db, PREFERENCE_KEYS.keepAwake, String(patch.keepAwake));
      }
      if (patch.lastGrinderId !== undefined) {
        if (patch.lastGrinderId) {
          await setPreference(db, PREFERENCE_KEYS.lastGrinderId, patch.lastGrinderId);
        } else {
          await removePreference(db, PREFERENCE_KEYS.lastGrinderId);
        }
      }
    },
    [db]
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      preferences,
      ready,
      update,
      setThemeMode: (mode) => update({ themeMode: mode }),
      setLanguage: (language) => update({ language }),
      setHaptics: (enabled) => update({ haptics: enabled }),
      setKeepAwake: (enabled) => update({ keepAwake: enabled }),
      setLastGrinderId: (id) => update({ lastGrinderId: id }),
      reload: load,
    }),
    [preferences, ready, update, load]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside SettingsProvider');
  return context;
}
