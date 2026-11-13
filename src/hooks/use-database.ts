/** Database access helpers for screens. */

import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

/** The shared SQLite connection created by `SQLiteProvider`. */
export function useDatabase(): SQLiteDatabase {
  return useSQLiteContext();
}

export interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Runs an async query and exposes a `reload` function.
 * `key` re-runs the query when a screen-level parameter changes.
 */
export function useQuery<T>(
  loader: (db: SQLiteDatabase) => Promise<T>,
  key = ''
): QueryResult<T> {
  const db = useSQLiteContext();
  const loaderRef = useRef(loader);

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  // Keep the latest loader without making it a query dependency. This effect is
  // declared before the query effect so the ref is current when the query runs.
  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await loaderRef.current(db);
        if (cancelled) return;
        setData(result);
        setError(null);
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : 'Could not read the database.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, key, version]);

  return { data, loading, error, reload };
}

/** Reloads when a screen regains focus, skipping the initial mount query. */
export function useReloadOnFocus(reload: () => void): void {
  const mounted = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      reload();
    }, [reload])
  );
}

/** Convenience wrapper: a query that also refreshes on focus. */
export function useFocusedQuery<T>(
  loader: (db: SQLiteDatabase) => Promise<T>,
  key = ''
): QueryResult<T> {
  const result = useQuery(loader, key);
  useReloadOnFocus(result.reload);
  return result;
}
