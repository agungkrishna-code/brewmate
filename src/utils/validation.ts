/** Validation shared by forms and by the brewing engine. */

import type { BrewRecipe, CoffeeBeanDraft, GrinderDraft, PourStep } from '@/types';

export type ValidationErrors<T extends string = string> = Partial<Record<T, string>>;

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

export interface RecipeValidationInput {
  name: string;
  coffeeDoseG: number | null;
  ratio: number | null;
  waterTempC: number | null;
  bloomMultiplier: number | null;
  bloomDurationS: number | null;
  steps: PourStep[];
  totalWaterG: number | null;
}

export type RecipeErrorKey =
  | 'name'
  | 'coffeeDoseG'
  | 'ratio'
  | 'waterTempC'
  | 'bloomMultiplier'
  | 'bloomDurationS'
  | 'steps';

export function validateRecipe(input: RecipeValidationInput): ValidationErrors<RecipeErrorKey> {
  const errors: ValidationErrors<RecipeErrorKey> = {};

  if (input.name.trim().length === 0) errors.name = 'Give the recipe a name.';
  if (input.coffeeDoseG == null || input.coffeeDoseG <= 0) {
    errors.coffeeDoseG = 'Dose must be greater than 0 g.';
  } else if (input.coffeeDoseG > 100) {
    errors.coffeeDoseG = 'That dose is too large for a V60.';
  }
  if (input.ratio == null || input.ratio < 5 || input.ratio > 30) {
    errors.ratio = 'Use a ratio between 1:5 and 1:30.';
  }
  if (input.waterTempC == null || input.waterTempC < 60 || input.waterTempC > 100) {
    errors.waterTempC = 'Water temperature must be 60–100 °C.';
  }
  if (input.bloomMultiplier == null || input.bloomMultiplier < 1 || input.bloomMultiplier > 6) {
    errors.bloomMultiplier = 'Bloom multiplier must be between 1× and 6×.';
  }
  if (input.bloomDurationS == null || input.bloomDurationS < 10 || input.bloomDurationS > 120) {
    errors.bloomDurationS = 'Bloom time must be 10–120 s.';
  }

  const steps = input.steps;
  if (steps.length < 2) {
    errors.steps = 'Add at least a bloom and one pour.';
  } else if (steps.some((step) => step.durationS <= 0)) {
    errors.steps = 'Every stage needs a duration.';
  } else if (input.totalWaterG != null) {
    const last = steps[steps.length - 1];
    if (Math.abs(last.targetWaterG - input.totalWaterG) > 0.05) {
      errors.steps = 'The final stage must reach the total water weight.';
    }
  }

  return errors;
}

export type BeanErrorKey = 'name' | 'roastDate';

export function validateBean(input: CoffeeBeanDraft): ValidationErrors<BeanErrorKey> {
  const errors: ValidationErrors<BeanErrorKey> = {};
  if (input.name.trim().length === 0) errors.name = 'Coffee name is required.';
  if (input.roastDate) {
    const date = new Date(input.roastDate);
    if (Number.isNaN(date.getTime())) errors.roastDate = 'Use a valid date.';
  }
  return errors;
}

export type GrinderErrorKey = 'name' | 'clicksPerRotation' | 'micronsPerClick';

export function validateGrinder(input: GrinderDraft): ValidationErrors<GrinderErrorKey> {
  const errors: ValidationErrors<GrinderErrorKey> = {};
  if (input.name.trim().length === 0) errors.name = 'Grinder name is required.';
  if (input.clicksPerRotation <= 0) errors.clicksPerRotation = 'Must be greater than 0.';
  if (input.micronsPerClick <= 0) errors.micronsPerClick = 'Must be greater than 0 µm.';
  return errors;
}

/** True when a recipe's steps add up to its own total water. */
export function recipeIsCoherent(recipe: BrewRecipe): boolean {
  const total = recipe.coffeeDoseG * recipe.ratio;
  const last = recipe.steps[recipe.steps.length - 1];
  return Boolean(last) && Math.abs(last.targetWaterG - total) <= 0.05;
}
