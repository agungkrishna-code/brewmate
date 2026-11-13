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
