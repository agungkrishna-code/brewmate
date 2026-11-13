/** Recipe and pour-step domain types. */

export type StepKind = 'bloom' | 'pour' | 'drawdown';

export interface PourStep {
  id?: string;
  stepOrder: number;
  label: string;
  kind: StepKind;
  /** Cumulative target weight on the scale, in grams. */
  targetWaterG: number;
  durationS: number;
}

export interface BrewRecipe {
  id: string;
  name: string;
  description: string | null;
  coffeeDoseG: number;
  /** Brew ratio expressed as the water part of 1:N. */
  ratio: number;
  /** Exact total water target, equal to the last pour step. */
  totalWaterG: number;
  waterTempC: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  grinderProfileId: string | null;
  grindSetting: number | null;
  targetTimeS: number;
  notes: string | null;
  isFavorite: boolean;
  isStarter: boolean;
  createdAt: string;
  updatedAt: string;
  steps: PourStep[];
}

export interface BrewRecipeSummary extends Omit<BrewRecipe, 'steps'> {
  stepCount: number;
  grinderName: string | null;
  brewCount: number;
}

export interface RecipeDraft {
  name: string;
  description: string;
  coffeeDoseG: number;
  ratio: number;
  waterTempC: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  grinderProfileId: string | null;
  grindSetting: number | null;
  notes: string;
  isFavorite: boolean;
  steps: PourStep[];
}
