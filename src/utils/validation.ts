/** Validation shared by forms and by the brewing engine. */

import type { Language } from '@/i18n';
import type { BrewRecipe, CoffeeBeanDraft, GrinderDraft, PourStep } from '@/types';
import { parseIsoDateOnly } from './formatting';

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

export function validateRecipe(
  input: RecipeValidationInput,
  lang: Language = 'en'
): ValidationErrors<RecipeErrorKey> {
  const errors: ValidationErrors<RecipeErrorKey> = {};
  const isId = lang === 'id';

  if (input.name.trim().length === 0) {
    errors.name = isId ? 'Beri nama resep ini.' : 'Give the recipe a name.';
  }
  if (input.coffeeDoseG == null || input.coffeeDoseG <= 0) {
    errors.coffeeDoseG = isId ? 'Dosis harus lebih dari 0 g.' : 'Dose must be greater than 0 g.';
  } else if (input.coffeeDoseG > 100) {
    errors.coffeeDoseG = isId ? 'Dosis terlalu besar untuk V60.' : 'That dose is too large for a V60.';
  }
  if (input.ratio == null || input.ratio < 5 || input.ratio > 30) {
    errors.ratio = isId ? 'Gunakan rasio antara 1:5 hingga 1:30.' : 'Use a ratio between 1:5 and 1:30.';
  }
  if (input.waterTempC == null || input.waterTempC < 60 || input.waterTempC > 100) {
    errors.waterTempC = isId ? 'Suhu air harus antara 60–100 °C.' : 'Water temperature must be 60–100 °C.';
  }
  if (input.bloomMultiplier == null || input.bloomMultiplier < 1 || input.bloomMultiplier > 6) {
    errors.bloomMultiplier = isId
      ? 'Pengali bloom harus antara 1× hingga 6×.'
      : 'Bloom multiplier must be between 1× and 6×.';
  } else if (input.ratio != null && input.bloomMultiplier >= input.ratio) {
    // Bloom water = dose × multiplier and total water = dose × ratio, so a bloom
    // multiplier at or above the ratio leaves nothing for the pours.
    errors.bloomMultiplier = isId
      ? 'Air bloom harus lebih kecil dari total air — naikkan rasio.'
      : 'Bloom water must be smaller than the total water — raise the ratio.';
  }
  if (input.bloomDurationS == null || input.bloomDurationS < 10 || input.bloomDurationS > 120) {
    errors.bloomDurationS = isId ? 'Durasi bloom harus 10–120 dtk.' : 'Bloom time must be 10–120 s.';
  }

  const steps = input.steps;
  if (steps.length < 2) {
    errors.steps = isId ? 'Tambahkan minimal satu bloom dan satu tuangan.' : 'Add at least a bloom and one pour.';
  } else if (steps.some((step) => step.durationS <= 0)) {
    errors.steps = isId ? 'Setiap tahap harus memiliki durasi.' : 'Every stage needs a duration.';
  } else if (input.totalWaterG != null) {
    const last = steps[steps.length - 1];
    if (Math.abs(last.targetWaterG - input.totalWaterG) > 0.05) {
      errors.steps = isId
        ? 'Tahap akhir harus mencapai total berat air.'
        : 'The final stage must reach the total water weight.';
    }
  }

  return errors;
}

export type BeanErrorKey = 'name' | 'roastDate';

export function validateBean(
  input: CoffeeBeanDraft,
  lang: Language = 'en'
): ValidationErrors<BeanErrorKey> {
  const errors: ValidationErrors<BeanErrorKey> = {};
  const isId = lang === 'id';
  if (input.name.trim().length === 0) {
    errors.name = isId ? 'Nama kopi wajib diisi.' : 'Coffee name is required.';
  }
  if (input.roastDate && input.roastDate.trim().length > 0) {
    if (!parseIsoDateOnly(input.roastDate.trim())) {
      errors.roastDate = isId
        ? 'Gunakan tanggal yang valid (yyyy-mm-dd).'
        : 'Use a valid date (yyyy-mm-dd).';
    }
  }
  return errors;
}

export type GrinderErrorKey =
  | 'name'
  | 'clicksPerRotation'
  | 'micronsPerClick'
  | 'referenceRange'
  | 'preferredRange';

export function validateGrinder(
  input: GrinderDraft,
  lang: Language = 'en'
): ValidationErrors<GrinderErrorKey> {
  const errors: ValidationErrors<GrinderErrorKey> = {};
  const isId = lang === 'id';
  if (input.name.trim().length === 0) {
    errors.name = isId ? 'Nama grinder wajib diisi.' : 'Grinder name is required.';
  }
  if (input.clicksPerRotation <= 0) {
    errors.clicksPerRotation = isId ? 'Harus lebih dari 0.' : 'Must be greater than 0.';
  }
  if (input.micronsPerClick <= 0) {
    errors.micronsPerClick = isId ? 'Harus lebih dari 0 µm.' : 'Must be greater than 0 µm.';
  }
  if (
    (input.referenceMin != null && input.referenceMin < 0) ||
    (input.referenceMax != null && input.referenceMax < 0)
  ) {
    errors.referenceRange = isId
      ? 'Nilai referensi tidak boleh negatif.'
      : 'Reference values cannot be negative.';
  } else if (
    input.referenceMin != null &&
    input.referenceMax != null &&
    input.referenceMin > input.referenceMax
  ) {
    errors.referenceRange = isId
      ? 'Nilai Dari harus lebih kecil atau sama dengan Hingga.'
      : 'From must be less than or equal to To.';
  }
  if (
    (input.preferredMin != null && input.preferredMin < 0) ||
    (input.preferredMax != null && input.preferredMax < 0)
  ) {
    errors.preferredRange = isId
      ? 'Nilai kalibrasi tidak boleh negatif.'
      : 'Calibration values cannot be negative.';
  } else if (
    input.preferredMin != null &&
    input.preferredMax != null &&
    input.preferredMin > input.preferredMax
  ) {
    errors.preferredRange = isId
      ? 'Nilai Dari harus lebih kecil atau sama dengan Hingga.'
      : 'From must be less than or equal to To.';
  }
  return errors;
}

/** True when a recipe's steps add up to its own total water. */
export function recipeIsCoherent(recipe: BrewRecipe): boolean {
  const total = recipe.coffeeDoseG * recipe.ratio;
  const last = recipe.steps[recipe.steps.length - 1];
  return Boolean(last) && Math.abs(last.targetWaterG - total) <= 0.05;
}
