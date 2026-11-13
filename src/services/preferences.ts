/** Key/value preferences stored in SQLite (no cloud, no accounts). */

import type { ThemePreference } from '@/constants/theme';
import type { SQLiteDatabase } from 'expo-sqlite';

export const PREFERENCE_KEYS = {
  themeMode: 'themeMode',
  haptics: 'haptics',
  keepAwake: 'keepAwake',
  lastGrinderId: 'lastGrinderId',
} as const;

export interface Preferences {
  themeMode: ThemePreference;
  haptics: boolean;
  keepAwake: boolean;
  lastGrinderId: string | null;
}

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  haptics: true,
  keepAwake: true,
  lastGrinderId: null,
};

export async function getAllPreferences(db: SQLiteDatabase): Promise<Record<string, string>> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM user_preferences'
  );
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setPreference(
  db: SQLiteDatabase,
  key: string,
  value: string
): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, new Date().toISOString()]
  );
}

export async function removePreference(db: SQLiteDatabase, key: string): Promise<void> {
  await db.runAsync('DELETE FROM user_preferences WHERE key = ?', [key]);
}

export async function readPreferences(db: SQLiteDatabase): Promise<Preferences> {
  const raw = await getAllPreferences(db);
  const theme = raw[PREFERENCE_KEYS.themeMode];
  return {
    themeMode: theme === 'light' || theme === 'dark' ? theme : 'system',
    haptics: raw[PREFERENCE_KEYS.haptics] !== 'false',
    keepAwake: raw[PREFERENCE_KEYS.keepAwake] !== 'false',
    lastGrinderId: raw[PREFERENCE_KEYS.lastGrinderId] ?? null,
  };
}
