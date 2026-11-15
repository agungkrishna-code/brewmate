/**
 * Local JSON backup and restore.
 *
 * Everything stays on the device: the export writes a plain .json file to the
 * cache directory and hands it to the Android share sheet. Restore reads a file
 * picked by the user and merges it by id.
 */

import { BACKUP_TABLES, SCHEMA_VERSION, type BackupTable } from '@/database/schema';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';

const APP_TAG = 'brewmate';

interface BackupFile {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  data: Partial<Record<BackupTable, Record<string, unknown>[]>>;
}

export interface ImportSummary {
  tables: Record<string, number>;
  total: number;
}

export async function buildBackup(db: SQLiteDatabase): Promise<BackupFile> {
  const data: Partial<Record<BackupTable, Record<string, unknown>[]>> = {};
  for (const table of BACKUP_TABLES) {
    data[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
  }
  return {
    app: APP_TAG,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

export async function exportBackupJson(db: SQLiteDatabase): Promise<string> {
  const backup = await buildBackup(db);
  return JSON.stringify(backup, null, 2);
}

function backupFileName(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `brewmate-backup-${stamp}.json`;
}

/** Writes the backup to the cache folder and returns its file URI. */
export async function writeBackupFile(db: SQLiteDatabase): Promise<string> {
  const json = await exportBackupJson(db);
  const file = new File(Paths.cache, backupFileName());
  if (file.exists) file.delete();
  file.create({ intermediates: true, overwrite: true });
  file.write(json);
  return file.uri;
}

export async function shareBackup(db: SQLiteDatabase): Promise<string> {
  const uri = await writeBackupFile(db);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save your Brewmate backup',
      UTI: 'public.json',
    });
  }
  return uri;
}

function isBackupFile(value: unknown): value is BackupFile {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<BackupFile>;
  return candidate.app === APP_TAG && typeof candidate.data === 'object' && candidate.data != null;
}

/**
 * Child rows that belong to a parent row.
 *
 * `INSERT OR REPLACE` deletes the parent row first, but the restore disables
 * foreign keys, so SQLite never runs `ON DELETE CASCADE`. Without an explicit
 * purge the previous children (recipe steps, session steps, ratings) survive
 * next to the restored ones and the brew shows duplicated stages.
 */
const OWNED_CHILD_TABLES: {
  table: BackupTable;
  parentTable: BackupTable;
  parentColumn: string;
}[] = [
  { table: 'brew_pour_steps', parentTable: 'brew_recipes', parentColumn: 'recipe_id' },
  { table: 'brew_session_steps', parentTable: 'brew_sessions', parentColumn: 'session_id' },
  { table: 'brew_session_ratings', parentTable: 'brew_sessions', parentColumn: 'session_id' },
];

/** Keeps the `IN (...)` list below SQLite's bound-variable limit. */
const PURGE_CHUNK_SIZE = 200;

function idsOf(rows: unknown): string[] {
  if (!Array.isArray(rows)) return [];
  const ids: string[] = [];
  for (const row of rows) {
    if (typeof row !== 'object' || row === null) continue;
    const id = (row as Record<string, unknown>).id;
    if (typeof id === 'string' && id.length > 0) ids.push(id);
  }
  return ids;
}

async function purgeOwnedChildren(
  db: SQLiteDatabase,
  child: (typeof OWNED_CHILD_TABLES)[number],
  parentIds: string[]
): Promise<void> {
  for (let start = 0; start < parentIds.length; start += PURGE_CHUNK_SIZE) {
    const chunk = parentIds.slice(start, start + PURGE_CHUNK_SIZE);
    const placeholders = chunk.map(() => '?').join(', ');
    await db.runAsync(
      `DELETE FROM ${child.table} WHERE ${child.parentColumn} IN (${placeholders})`,
      chunk
    );
  }
}

/** Columns that really exist for a table, used to sanitise imported JSON. */
async function tableColumns(db: SQLiteDatabase, table: BackupTable): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((row) => row.name));
}

/**
 * Merges a backup into the local database. Rows with an existing id are
 * overwritten; everything else is kept. Foreign keys are disabled for the
 * duration so a partially exported file cannot abort the whole restore.
 */
export async function importBackupJson(
  db: SQLiteDatabase,
  json: string
): Promise<ImportSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  if (!isBackupFile(parsed)) {
    throw new Error('That file is not a Brewmate backup.');
  }

  const summary: ImportSummary = { tables: {}, total: 0 };
  const columnsByTable = new Map<BackupTable, Set<string>>();
  for (const table of BACKUP_TABLES) {
    columnsByTable.set(table, await tableColumns(db, table));
  }

  await db.execAsync('PRAGMA foreign_keys = OFF;');
  try {
    await db.withTransactionAsync(async () => {
      for (const table of BACKUP_TABLES) {
        const rows = parsed.data[table];
        if (!Array.isArray(rows)) continue;

        // Restored parents are authoritative for their children: drop whatever
        // the replaced parent row left behind before inserting the backup rows.
        const owned = OWNED_CHILD_TABLES.find((entry) => entry.table === table);
        if (owned) {
          const parentIds = idsOf(parsed.data[owned.parentTable]);
          if (parentIds.length > 0) {
            await purgeOwnedChildren(db, owned, parentIds);
          }
        }

        const allowed = columnsByTable.get(table) ?? new Set<string>();
        let inserted = 0;

        for (const row of rows) {
          if (typeof row !== 'object' || row === null) continue;
          const keys = Object.keys(row).filter((key) => allowed.has(key));
          if (keys.length === 0) continue;
          const placeholders = keys.map(() => '?').join(', ');
          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
            keys.map((key) => (row as Record<string, unknown>)[key] as string | number | null)
          );
          inserted += 1;
        }

        summary.tables[table] = inserted;
        summary.total += inserted;
      }
    });
  } finally {
    await db.execAsync('PRAGMA foreign_keys = ON;');
  }

  return summary;
}

export async function readBackupFile(uri: string): Promise<string> {
  const file = new File(uri);
  return file.text();
}
