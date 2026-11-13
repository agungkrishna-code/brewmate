/**
 * Grinder domain types.
 *
 * A grind "setting" is always stored in the grinder's own native unit. We never
 * convert a setting from one grinder model to another: one click on a TIMEMORE
 * S5 Pro is not one click on a C5 Pro (90 clicks/rotation vs 48).
 */

export type GrinderModel = 'timemore-s5-pro' | 'timemore-c5-pro' | 'custom';

/**
 * The unit a user types their grind setting in.
 * - `rotations`: dial rotations with clicks inside a rotation (S5 Pro).
 * - `clicks`: total clicks from the closed/zero position (C5 Pro).
 */
export type GrinderSettingUnit = 'rotations' | 'clicks';

export interface GrinderProfile {
  id: string;
  name: string;
  brand: string;
  model: GrinderModel;
  clicksPerRotation: number;
  settingUnit: GrinderSettingUnit;
  /** Burr gap change per click, in microns. */
  micronsPerClick: number;
  macroStepsPerRotation: number | null;
  /** Manufacturer's published reference range, expressed in `settingUnit`. */
  referenceMin: number | null;
  referenceMax: number | null;
  referenceNote: string | null;
  /** The user's own working range ("personal calibration"). */
  preferredMin: number | null;
  preferredMax: number | null;
  isBuiltin: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GrinderDraft {
  name: string;
  brand: string;
  model: GrinderModel;
  clicksPerRotation: number;
  settingUnit: GrinderSettingUnit;
  micronsPerClick: number;
  macroStepsPerRotation: number | null;
  referenceMin: number | null;
  referenceMax: number | null;
  referenceNote: string | null;
  preferredMin: number | null;
  preferredMax: number | null;
  notes: string | null;
}

export interface GrindSetting {
  id: string;
  grinderProfileId: string;
  coffeeBeanId: string | null;
  recipeId: string | null;
  settingValue: number;
  clicks: number | null;
  notes: string | null;
  createdAt: string;
}

/** A saved grind setting joined with the bean, recipe and latest tasting score. */
export interface GrindSettingDetail extends GrindSetting {
  grinderName: string;
  beanName: string | null;
  recipeName: string | null;
  lastRating: number | null;
  lastBrewedAt: string | null;
}
