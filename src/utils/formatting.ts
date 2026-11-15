/** Display formatting helpers. Locale-free so output is stable on every device. */

import type { Language } from '@/i18n';

const MONTHS: Record<Language, readonly string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
};

const MONTHS_LONG: Record<Language, readonly string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  id: [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ],
};

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWeight(grams: number | null | undefined, withUnit = false): string {
  if (grams == null || !Number.isFinite(grams)) return '–';
  const rounded = Math.round(grams * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return withUnit ? `${text} g` : text;
}

export function formatRatio(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return '–';
  const rounded = Math.round(ratio * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
  return `1:${text}`;
}

export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius == null || !Number.isFinite(celsius)) return '–';
  return `${Math.round(celsius * 10) / 10} °C`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '–';
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number | null | undefined, lang: Language = 'en'): string {
  if (seconds == null || !Number.isFinite(seconds)) return '–';
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  if (lang === 'id') {
    if (minutes === 0) return `${rest} dtk`;
    if (rest === 0) return `${minutes} mnt`;
    return `${minutes} mnt ${rest} dtk`;
  }
  if (minutes === 0) return `${rest}s`;
  if (rest === 0) return `${minutes}m`;
  return `${minutes}m ${rest}s`;
}

/** Stopwatch output for the brewing timer, e.g. "02:14". */
export function formatStopwatch(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDate(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return '–';
  const date = toDate(iso);
  if (!date) return '–';
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return '–';
  const date = toDate(iso);
  if (!date) return '–';
  return `${date.getDate()} ${MONTHS[lang][date.getMonth()]}`;
}

export function formatDateTime(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return '–';
  const date = toDate(iso);
  if (!date) return '–';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(iso, lang)} · ${hours}:${minutes}`;
}

export function formatMonthYear(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return '–';
  const date = toDate(iso);
  if (!date) return '–';
  return `${MONTHS_LONG[lang][date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRoastDate(iso: string | null | undefined, lang: Language = 'en'): string {
  if (!iso) return lang === 'id' ? 'Tanggal sangrai belum diisi' : 'Roast date not set';
  const date = toDate(iso);
  if (!date) return lang === 'id' ? 'Tanggal sangrai belum diisi' : 'Roast date not set';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const formatted = formatDate(iso, lang);
  if (lang === 'id') {
    if (days < 0) return `${formatted} · masih resting`;
    if (days === 0) return `${formatted} · hari ini`;
    if (days === 1) return `${formatted} · 1 hari lalu`;
    return `${formatted} · ${days} hari lalu`;
  }
  if (days < 0) return `${formatted} · resting`;
  if (days === 0) return `${formatted} · today`;
  if (days === 1) return `${formatted} · 1 day ago`;
  return `${formatted} · ${days} days ago`;
}

export function formatRating(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '–';
  return (Math.round(value * 10) / 10).toFixed(1);
}

export function formatCount(value: number, singular: string, plural?: string): string {
  return `${value} ${value === 1 ? singular : (plural ?? `${singular}s`)}`;
}

/** Today's date as yyyy-mm-dd, used by date inputs. */
export function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function greeting(date = new Date(), lang: Language = 'en'): string {
  const hour = date.getHours();
  if (lang === 'id') {
    if (hour < 5) return 'Seduh larut malam';
    if (hour < 12) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  }
  if (hour < 5) return 'Late night brewing';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "yyyy-mm-dd" -> Date at local midnight, or null. */
export function parseIsoDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}
