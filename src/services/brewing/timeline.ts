/**
 * Turns a list of pour steps into a timed timeline. Durations are cumulative
 * from the start of the brew, which is what the timer uses to decide the
 * active stage from elapsed wall-clock time.
 */

import type { BrewDraft, BrewRecipe, PourStep, TimelineStage } from '@/types';
import { percent, round1, sum } from '@/utils/calculations';
import { DEFAULT_BREW } from '@/constants/defaults';
import { calculateBrew } from '@/services/calculator/v60';

export function buildTimeline(steps: PourStep[]): TimelineStage[] {
  const ordered = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
  let startS = 0;
  let previousWater = 0;

  return ordered.map((step) => {
    const startWaterG = previousWater;
    const endS = startS + Math.max(0, step.durationS);
    const stage: TimelineStage = {
      ...step,
      startS,
      endS,
      startWaterG,
      addedWaterG: round1(step.targetWaterG - startWaterG),
    };
    startS = endS;
    previousWater = step.targetWaterG;
    return stage;
  });
}

export function timelineDuration(stages: TimelineStage[]): number {
  if (stages.length === 0) return 0;
  return stages[stages.length - 1].endS;
}

/** Index of the stage being poured at `elapsedS`, clamped to the stage list. */
export function stageIndexAt(elapsedS: number, stages: TimelineStage[]): number {
  if (stages.length === 0) return 0;
  const index = stages.findIndex((stage) => elapsedS < stage.endS);
  if (index === -1) return stages.length - 1;
  return index;
}

export function stageProgress(elapsedS: number, stage: TimelineStage): number {
  const duration = Math.max(0.001, stage.endS - stage.startS);
  return percent(elapsedS - stage.startS, duration);
}

export function brewProgress(elapsedS: number, stages: TimelineStage[]): number {
  const total = timelineDuration(stages);
  return percent(elapsedS, total);
}

/** Cumulative water target that should be on the scale at `elapsedS`. */
export function waterTargetAt(elapsedS: number, stages: TimelineStage[]): number {
  if (stages.length === 0) return 0;
  const index = stageIndexAt(elapsedS, stages);
  const stage = stages[index];
  return Math.max(stage.startWaterG, stage.targetWaterG);
}

export function totalWaterOfSteps(steps: PourStep[]): number {
  if (steps.length === 0) return 0;
  return steps[steps.length - 1].targetWaterG;
}
export function stepsDuration(steps: PourStep[]): number {
  return Math.round(sum(steps.map((step) => step.durationS)));
}

/** Builds the plan handed to the timer from a saved recipe. */
export function brewDraftFromRecipe(recipe: BrewRecipe): BrewDraft {
  return {
    recipeId: recipe.id,
    recipeName: recipe.name,
    coffeeDoseG: recipe.coffeeDoseG,
    ratio: recipe.ratio,
    waterTempC: recipe.waterTempC,
    bloomMultiplier: recipe.bloomMultiplier,
    bloomDurationS: recipe.bloomDurationS,
    steps: recipe.steps,
    grinderProfileId: recipe.grinderProfileId,
    grindSetting: recipe.grindSetting,
    coffeeBeanId: null,
    notes: recipe.notes ?? '',
    source: 'recipe',
  };
}

/** Fallback plan when no recipe exists yet. */
export function defaultBrewDraft(): BrewDraft {
  const calculation = calculateBrew({
    doseG: DEFAULT_BREW.coffeeDoseG,
    ratio: DEFAULT_BREW.ratio,
    bloomMultiplier: DEFAULT_BREW.bloomMultiplier,
    bloomDurationS: DEFAULT_BREW.bloomDurationS,
    pourCount: DEFAULT_BREW.pourCount,
  });
  return {
    recipeId: null,
    recipeName: 'Quick V60',
    coffeeDoseG: DEFAULT_BREW.coffeeDoseG,
    ratio: DEFAULT_BREW.ratio,
    waterTempC: DEFAULT_BREW.waterTempC,
    bloomMultiplier: DEFAULT_BREW.bloomMultiplier,
    bloomDurationS: DEFAULT_BREW.bloomDurationS,
    steps: calculation.steps,
    grinderProfileId: null,
    grindSetting: null,
    coffeeBeanId: null,
    notes: '',
    source: 'calculator',
  };
}
