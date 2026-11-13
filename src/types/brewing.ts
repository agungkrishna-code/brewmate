/** Brewing, timer, session and rating domain types. */

import type { PourStep, StepKind } from './recipe';

export interface TimelineStage extends PourStep {
  /** Stage start measured from brew start, in seconds. */
  startS: number;
  /** Stage end measured from brew start, in seconds. */
  endS: number;
  /** Cumulative weight at the beginning of the stage, in grams. */
  startWaterG: number;
  /** Water added during the stage, in grams. */
  addedWaterG: number;
}

export type BrewTimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export type RatingKey = 'acidity' | 'sweetness' | 'bitterness' | 'body' | 'clarity' | 'aftertaste';

export type BrewRatings = Record<RatingKey, number | null>;

export interface RatingCategory {
  key: RatingKey;
  label: string;
  hint: string;
}

/** The in-memory plan handed from the calculator or a recipe to the timer. */
export interface BrewDraft {
  recipeId: string | null;
  recipeName: string;
  coffeeDoseG: number;
  ratio: number;
  waterTempC: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  steps: PourStep[];
  grinderProfileId: string | null;
  grindSetting: number | null;
  coffeeBeanId: string | null;
  notes: string;
  source: 'recipe' | 'calculator';
}

export interface BrewSession {
  id: string;
  brewedAt: string;
  coffeeBeanId: string | null;
  beanNameSnapshot: string | null;
  recipeId: string | null;
  recipeNameSnapshot: string | null;
  grinderProfileId: string | null;
  grinderNameSnapshot: string | null;
  grindSetting: number | null;
  coffeeDoseG: number;
  ratio: number;
  waterTempC: number;
  totalWaterG: number;
  bloomWaterG: number | null;
  totalTimeS: number;
  notes: string | null;
  createdAt: string;
}

export interface BrewSessionStep {
  id: string;
  sessionId: string;
  stepOrder: number;
  label: string;
  kind: StepKind;
  targetWaterG: number;
  durationS: number;
}

export interface BrewSessionDetail extends BrewSession {
  steps: BrewSessionStep[];
  ratings: BrewRatings | null;
  /** Average of the six rating categories, null when nothing is rated. */
  averageRating: number | null;
}

export interface BrewSessionDraft {
  brewedAt: string;
  coffeeBeanId: string | null;
  recipeId: string | null;
  grinderProfileId: string | null;
  grindSetting: number | null;
  coffeeDoseG: number;
  ratio: number;
  waterTempC: number;
  totalWaterG: number;
  bloomWaterG: number | null;
  totalTimeS: number;
  notes: string;
  ratings: BrewRatings;
  steps: PourStep[];
}

export interface BrewStats {
  sessionCount: number;
  averageRating: number | null;
  ratedCount: number;
  totalCoffeeG: number;
  totalWaterG: number;
  favouriteBean: { name: string; count: number } | null;
  favouriteGrinder: { name: string; count: number } | null;
  bestSession: { id: string; label: string; rating: number; brewedAt: string } | null;
  lastBrewedAt: string | null;
}

export interface SessionFilter {
  grinderProfileId?: string | null;
  coffeeBeanId?: string | null;
}
