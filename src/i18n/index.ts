import { en } from './en';
import { id } from './id';
import type { Language, LanguagePreference, TranslationDict } from './types';

export type { Language, LanguagePreference, TranslationDict };

export const TRANSLATIONS: Record<Language, TranslationDict> = { en, id };

/** Detects device locale via Intl without requiring a native localization module. */
export function detectDeviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() ?? '';
    if (locale.startsWith('id') || locale.startsWith('in')) {
      return 'id';
    }
  } catch {
    // Fall back to English if Intl is unavailable in a minimal runtime.
  }
  return 'en';
}

export function resolveLanguage(preference: LanguagePreference): Language {
  if (preference === 'en' || preference === 'id') {
    return preference;
  }
  return detectDeviceLanguage();
}

export function getTranslations(lang: Language): TranslationDict {
  return TRANSLATIONS[lang];
}
