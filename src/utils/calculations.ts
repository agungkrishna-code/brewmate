/**
 * Pure V60 calculation helpers.
 *
 * All water weights are handled in grams with one decimal place. Because the
 * UI works in 0.1 g increments, every helper comes back on the same grid so
 * the sum of the stages always equals the intended total.
 */

export const WEIGHT_STEP = 0.1;
export const EPSILON = 0.049;

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function round1(value: number): number {
  return roundTo(value, 1);
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Parses user input, accepting a comma as decimal separator. */
export function parseNumber(input: string | null | undefined): number | null {
  if (input == null) return null;
  const normalized = input.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function isPositive(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** Total water for a dose and ratio (1:N). */
export function totalWaterFor(dose: number, ratio: number): number {
  return round1(dose * ratio);
}

/** Bloom water for a dose and bloom multiplier. */
export function bloomWaterFor(dose: number, multiplier: number): number {
  return round1(dose * multiplier);
}

export function remainingWaterFor(totalWater: number, bloomWater: number): number {
  return round1(totalWater - bloomWater);
}

/** Ratio (the N in 1:N) implied by a dose and a water weight. */
export function ratioFor(dose: number, water: number): number | null {
  if (!isPositive(dose) || !isPositive(water)) return null;
  return roundTo(water / dose, 2);
}

export function doseFor(water: number, ratio: number): number | null {
  if (!isPositive(ratio) || !isPositive(water)) return null;
  return round1(water / ratio);
}

/** Splits a weight into `parts` even stages, fixing rounding on the last one. */
export function distributeWater(total: number, parts: number): number[] {
  if (parts <= 0) return [];
  const totalTenths = Math.round(round1(total) * 10);
  const base = Math.floor(totalTenths / parts);
  const amounts = Array.from({ length: parts }, () => base / 10);
  amounts[parts - 1] = (totalTenths - base * (parts - 1)) / 10;
  return amounts;
}

export function cumulative(values: number[]): number[] {
  let running = 0;
  return values.map((value) => {
    running = round1(running + value);
    return running;
  });
}

/** Forces the amounts to add up exactly to `total`, absorbing drift in the last stage. */
export function normalizeToTotal(amounts: number[], total: number): number[] {
  if (amounts.length === 0) return [];
  const target = round1(total);
  const head = amounts.slice(0, -1).map((value) => Math.max(0, round1(value)));
  const headSum = round1(sum(head));
  return [...head, Math.max(0, round1(target - headSum))];
}

/**
 * Sets one stage to a new weight and keeps the total intact by absorbing the
 * difference in the neighbouring stage. Every stage keeps at least 0.1 g.
 */
export function adjustStageAmount(
  amounts: number[],
  index: number,
  nextValue: number,
  total: number
): number[] {
  const count = amounts.length;
  if (count === 0) return [];
  if (count === 1) return [round1(Math.max(0, total))];

  const floor = WEIGHT_STEP;
  const maxValue = Math.max(floor, round1(total - floor * (count - 1)));
  const value = round1(clamp(nextValue, floor, maxValue));

  const result = [...amounts];
  result[index] = value;

  const fixIndex = index === count - 1 ? count - 2 : count - 1;
  const targetForOthers = round1(total - value);
  const otherSum = round1(sum(result.filter((_, position) => position !== index)));
  result[fixIndex] = Math.max(floor, round1(result[fixIndex] + (targetForOthers - otherSum)));

  const drift = round1(total - sum(result));
  if (Math.abs(drift) > 0.001) {
    result[fixIndex] = Math.max(floor, round1(result[fixIndex] + drift));
  }
  return result;
}

export function average(values: (number | null | undefined)[]): number | null {
  const present = values.filter((value): value is number => typeof value === 'number');
  if (present.length === 0) return null;
  return roundTo(sum(present) / present.length, 2);
}

export function percent(part: number, whole: number): number {
  if (!isPositive(whole)) return 0;
  return clamp((part / whole) * 100, 0, 100);
}

/** Formats a number with at most one decimal and no trailing zeros. */
export function trimNumber(value: number, decimals = 1): string {
  return String(roundTo(value, decimals));
}
