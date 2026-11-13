/** Display formatting helpers. Locale-free so output is stable on every device. */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const MONTHS_LONG = [
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
];

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatWeight(grams: number | null | undefined, withUnit = false): string {
  if (grams == null || !Number.isFinite(grams)) return '—';
  const rounded = Math.round(grams * 10) / 10;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return withUnit ? `${text} g` : text;
}

export function formatRatio(ratio: number | null | undefined): string {
  if (ratio == null || !Number.isFinite(ratio) || ratio <= 0) return '—';
  const rounded = Math.round(ratio * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
  return `1:${text}`;
}

export function formatTemperature(celsius: number | null | undefined): string {
  if (celsius == null || !Number.isFinite(celsius)) return '—';
  return `${Math.round(celsius * 10) / 10} °C`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export function formatDurationLong(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
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

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = toDate(iso);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = toDate(iso);
  if (!date) return '—';
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = toDate(iso);
  if (!date) return '—';
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(iso)} · ${hours}:${minutes}`;
}

export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = toDate(iso);
  if (!date) return '—';
  return `${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatRoastDate(iso: string | null | undefined): string {
  if (!iso) return 'Roast date not set';
  const date = toDate(iso);
  if (!date) return 'Roast date not set';
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 0) return `${formatDate(iso)} · resting`;
  if (days === 0) return `${formatDate(iso)} · today`;
  if (days === 1) return `${formatDate(iso)} · 1 day ago`;
  return `${formatDate(iso)} · ${days} days ago`;
}

export function formatRating(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
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

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 5) return 'Late night brewing';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** "yyyy-mm-dd" -> Date at local midnight, or null. */
export function parseIsoDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
