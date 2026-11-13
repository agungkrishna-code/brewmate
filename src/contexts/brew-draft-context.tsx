/**
 * Holds the brew plan between the calculator/recipe screens and the timer.
 * Kept in memory on purpose: it is a transient intent, not saved data.
 */

import type { BrewDraft } from '@/types';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface BrewDraftContextValue {
  draft: BrewDraft | null;
  beginBrew: (draft: BrewDraft) => void;
  clearBrew: () => void;
}

const BrewDraftContext = createContext<BrewDraftContextValue | null>(null);

export function BrewDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BrewDraft | null>(null);

  const beginBrew = useCallback((next: BrewDraft) => setDraft(next), []);
  const clearBrew = useCallback(() => setDraft(null), []);

  const value = useMemo(
    () => ({ draft, beginBrew, clearBrew }),
    [draft, beginBrew, clearBrew]
  );

  return <BrewDraftContext.Provider value={value}>{children}</BrewDraftContext.Provider>;
}

export function useBrewDraft(): BrewDraftContextValue {
  const context = useContext(BrewDraftContext);
  if (!context) throw new Error('useBrewDraft must be used inside BrewDraftProvider');
  return context;
}
