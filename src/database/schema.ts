/**
 * SQLite schema.
 *
 * Every table is created here for version 1. Later schema changes are added as
 * new numbered migrations in `migrations.ts` — never by editing this file.
 */

export const SCHEMA_VERSION = 1;

export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS grinder_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'TIMEMORE',
  model TEXT NOT NULL,
  clicks_per_rotation REAL NOT NULL,
  setting_unit TEXT NOT NULL DEFAULT 'clicks',
  microns_per_click REAL NOT NULL,
  macro_steps_per_rotation INTEGER,
  reference_min REAL,
  reference_max REAL,
  reference_note TEXT,
  preferred_min REAL,
  preferred_max REAL,
  is_builtin INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS coffee_beans (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  origin TEXT,
  country TEXT,
  region TEXT,
  farm TEXT,
  variety TEXT,
  process TEXT NOT NULL DEFAULT 'Washed',
  roast_level TEXT NOT NULL DEFAULT 'Light',
  roast_date TEXT,
  tasting_notes TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_coffee_beans_name ON coffee_beans (name COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_coffee_beans_archived ON coffee_beans (is_archived);

CREATE TABLE IF NOT EXISTS brew_recipes (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  coffee_dose_g REAL NOT NULL,
  ratio REAL NOT NULL,
  total_water_g REAL NOT NULL DEFAULT 0,
  water_temp_c REAL NOT NULL,
  bloom_multiplier REAL NOT NULL,
  bloom_duration_s INTEGER NOT NULL,
  grinder_profile_id TEXT REFERENCES grinder_profiles (id) ON DELETE SET NULL,
  grind_setting REAL,
  target_time_s INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  is_starter INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_brew_recipes_favorite ON brew_recipes (is_favorite);

CREATE TABLE IF NOT EXISTS brew_pour_steps (
  id TEXT PRIMARY KEY NOT NULL,
  recipe_id TEXT NOT NULL REFERENCES brew_recipes (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_water_g REAL NOT NULL,
  duration_s INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pour_steps_recipe ON brew_pour_steps (recipe_id, step_order);

CREATE TABLE IF NOT EXISTS brew_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  brewed_at TEXT NOT NULL,
  coffee_bean_id TEXT REFERENCES coffee_beans (id) ON DELETE SET NULL,
  bean_name_snapshot TEXT,
  recipe_id TEXT REFERENCES brew_recipes (id) ON DELETE SET NULL,
  recipe_name_snapshot TEXT,
  grinder_profile_id TEXT REFERENCES grinder_profiles (id) ON DELETE SET NULL,
  grinder_name_snapshot TEXT,
  grind_setting REAL,
  coffee_dose_g REAL NOT NULL,
  ratio REAL NOT NULL,
  water_temp_c REAL NOT NULL,
  total_water_g REAL NOT NULL,
  bloom_water_g REAL,
  total_time_s INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_brewed_at ON brew_sessions (brewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_bean ON brew_sessions (coffee_bean_id);
CREATE INDEX IF NOT EXISTS idx_sessions_grinder ON brew_sessions (grinder_profile_id);

CREATE TABLE IF NOT EXISTS brew_session_steps (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL REFERENCES brew_sessions (id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  kind TEXT NOT NULL,
  target_water_g REAL NOT NULL,
  duration_s INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_steps_session ON brew_session_steps (session_id, step_order);

CREATE TABLE IF NOT EXISTS brew_session_ratings (
  session_id TEXT PRIMARY KEY NOT NULL REFERENCES brew_sessions (id) ON DELETE CASCADE,
  acidity INTEGER,
  sweetness INTEGER,
  bitterness INTEGER,
  body INTEGER,
  clarity INTEGER,
  aftertaste INTEGER
);

CREATE TABLE IF NOT EXISTS grind_settings (
  id TEXT PRIMARY KEY NOT NULL,
  grinder_profile_id TEXT NOT NULL REFERENCES grinder_profiles (id) ON DELETE CASCADE,
  coffee_bean_id TEXT REFERENCES coffee_beans (id) ON DELETE SET NULL,
  recipe_id TEXT REFERENCES brew_recipes (id) ON DELETE SET NULL,
  setting_value REAL NOT NULL,
  clicks INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grind_settings_grinder ON grind_settings (grinder_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grind_settings_bean ON grind_settings (coffee_bean_id);

CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

/** Tables included in a JSON backup, in foreign-key-safe insertion order. */
export const BACKUP_TABLES = [
  'grinder_profiles',
  'coffee_beans',
  'brew_recipes',
  'brew_pour_steps',
  'brew_sessions',
  'brew_session_steps',
  'brew_session_ratings',
  'grind_settings',
  'user_preferences',
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];
