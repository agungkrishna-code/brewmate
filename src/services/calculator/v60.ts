/**
 * V60 recipe maths.
 *
 * The calculator is deliberately deterministic: doses and ratios produce a
 * total water weight, the bloom takes a multiple of the dose, and the rest is
 * split across the pour stages. The final stage always lands exactly on the
 * total, so the scale target and the sum of the stages never disagree.
 */

import { getStageLabels } from '@/constants/defaults';
import type { Language } from '@/i18n';
import type { PourStep } from '@/types';
import {
  bloomWaterFor,
  cumulative,
  distributeWater,
  round1,
  totalWaterFor,
} from '@/utils/calculations';

const POUR_ORDINALS: Record<Language, readonly string[]> = {
  en: ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth'],
  id: ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam'],
};

export interface BrewCalculation {
  totalWaterG: number;
  bloomWaterG: number;
  remainingWaterG: number;
  pourAmounts: number[];
  cumulativeTargets: number[];
  steps: PourStep[];
  totalTimeS: number;
}

export interface BrewCalculationInput {
  doseG: number;
  ratio: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  pourCount: number;
  pourDurationS?: number;
  drawdownDurationS?: number;
  includeDrawdown?: boolean;
}

export const DEFAULT_POUR_DURATION_S = 30;
export const DEFAULT_DRAWDOWN_DURATION_S = 45;

export function pourLabel(index: number, count: number, lang: Language = 'en'): string {
  if (lang === 'id') {
    if (count === 1) return 'Tuang tunggal';
    const ordinal = POUR_ORDINALS.id[index];
    return ordinal ? `Tuang ${ordinal}` : `Tuang ${index + 1}`;
  }
  if (count === 1) return 'Single pour';
  const ordinal = POUR_ORDINALS.en[index] ?? `Pour ${index + 1}`;
  return `${ordinal} pour`;
}

/** Builds the ordered stage list from bloom water and per-pour amounts. */
export function buildStages(params: {
  bloomWaterG: number;
  pourAmounts: number[];
  bloomDurationS: number;
  pourDurationS: number;
  drawdownDurationS: number;
  includeDrawdown: boolean;
  lang?: Language;
}): PourStep[] {
  const lang = params.lang ?? 'en';
  const stageLabels = getStageLabels(lang);
  // Cumulative targets are measured on the scale, so they start after the bloom.
  const pourCumulative = cumulative(params.pourAmounts);
  const steps: PourStep[] = [];
  let order = 0;

  steps.push({
    stepOrder: order++,
    label: stageLabels.bloom,
    kind: 'bloom',
    targetWaterG: round1(params.bloomWaterG),
    durationS: Math.round(params.bloomDurationS),
  });

  params.pourAmounts.forEach((_, index) => {
    steps.push({
      stepOrder: order++,
      label: pourLabel(index, params.pourAmounts.length, lang),
      kind: 'pour',
      targetWaterG: round1(params.bloomWaterG + pourCumulative[index]),
      durationS: Math.round(params.pourDurationS),
    });
  });

  if (params.includeDrawdown) {
    steps.push({
      stepOrder: order++,
      label: stageLabels.drawdown,
      kind: 'drawdown',
      targetWaterG: round1(params.bloomWaterG + (pourCumulative[pourCumulative.length - 1] ?? 0)),
      durationS: Math.round(params.drawdownDurationS),
    });
  }

  return steps;
}

export function calculateBrew(input: BrewCalculationInput): BrewCalculation {
  const totalWaterG = totalWaterFor(input.doseG, input.ratio);
  const bloomWaterG = bloomWaterFor(input.doseG, input.bloomMultiplier);
  const remainingWaterG = round1(totalWaterG - bloomWaterG);
  const pourCount = Math.max(1, Math.round(input.pourCount));
  const pourAmounts = distributeWater(remainingWaterG, pourCount);
  const cumulativeTargets = cumulative(pourAmounts).map((target) =>
    round1(bloomWaterG + target)
  );

  const steps = buildStages({
    bloomWaterG,
    pourAmounts,
    bloomDurationS: input.bloomDurationS,
    pourDurationS: input.pourDurationS ?? DEFAULT_POUR_DURATION_S,
    drawdownDurationS: input.drawdownDurationS ?? DEFAULT_DRAWDOWN_DURATION_S,
    includeDrawdown: input.includeDrawdown ?? true,
  });

  return {
    totalWaterG,
    bloomWaterG,
    remainingWaterG,
    pourAmounts,
    cumulativeTargets,
    steps,
    totalTimeS: steps.reduce((total, step) => total + step.durationS, 0),
  };
}

/** Converts stored cumulative steps back into per-stage water additions. */
export function stepAmountsFromSteps(bloomWaterG: number, steps: PourStep[]): number[] {
  const pours = steps.filter((step) => step.kind === 'pour');
  let previous = bloomWaterG;
  return pours.map((step) => {
    const amount = round1(step.targetWaterG - previous);
    previous = step.targetWaterG;
    return Math.max(0, amount);
  });
}

/** Rebuilds cumulative targets after the user edits a per-stage amount. */
export function applyPourAmounts(bloomWaterG: number, pourAmounts: number[]): PourStep[] {
  return buildStages({
    bloomWaterG,
    pourAmounts,
    bloomDurationS: 0,
    pourDurationS: 0,
    drawdownDurationS: 0,
    includeDrawdown: false,
  });
}

export function totalWaterFromRatio(doseG: number, ratio: number): number {
  return totalWaterFor(doseG, ratio);
}
