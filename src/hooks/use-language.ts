/** Resolves the active display language from preferences + device locale. */

import { useMemo } from 'react';
import { useSettings } from '@/contexts/settings-context';
import { getTranslations, resolveLanguage, type Language, type TranslationDict } from '@/i18n';

export function useLanguage(): Language {
  const { preferences } = useSettings();
  return useMemo(() => resolveLanguage(preferences.language), [preferences.language]);
}

export function useTranslation(): { lang: Language; t: TranslationDict } {
  const lang = useLanguage();
  const t = useMemo(() => getTranslations(lang), [lang]);
  return { lang, t };
}
