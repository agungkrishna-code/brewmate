/**
 * Grinder display maths.
 *
 * These helpers only describe a single grinder. Nothing here maps an S5 Pro
 * setting onto a C5 Pro setting — the two models have different click counts
 * per rotation and different burr travel per click.
 */

import type { GrinderProfile, GrinderSettingUnit } from '@/types';

export const SETTING_UNIT_LABEL: Record<GrinderSettingUnit, { singular: string; plural: string }> =
  {
    rotations: { singular: 'rotation', plural: 'rotations' },
    clicks: { singular: 'click', plural: 'clicks' },
  };

/** Number of clicks that a stored setting corresponds to on this grinder. */
export function clicksForSetting(profile: GrinderProfile, value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const clicks =
    profile.settingUnit === 'rotations' ? value * profile.clicksPerRotation : value;
  return Math.round(clicks);
}

export function settingFromClicks(profile: GrinderProfile, clicks: number): number {
  if (profile.settingUnit === 'rotations') {
    return Math.round((clicks / profile.clicksPerRotation) * 100) / 100;
  }
  return Math.round(clicks * 100) / 100;
}

/** Cumulative burr travel from the zero point, in millimetres. */
export function burrTravelMm(profile: GrinderProfile, value: number | null): number | null {
  const clicks = clicksForSetting(profile, value);
  if (clicks == null) return null;
  return Math.round(((clicks * profile.micronsPerClick) / 1000) * 100) / 100;
}

export function macroStepsFor(profile: GrinderProfile, value: number | null): number | null {
  if (!profile.macroStepsPerRotation) return null;
  const clicks = clicksForSetting(profile, value);
  if (clicks == null) return null;
  const clicksPerMacro = profile.clicksPerRotation / profile.macroStepsPerRotation;
  if (!Number.isFinite(clicksPerMacro) || clicksPerMacro <= 0) return null;
  return Math.round((clicks / clicksPerMacro) * 10) / 10;
}

export function unitLabel(profile: GrinderProfile, value: number | null): string {
  const unit = SETTING_UNIT_LABEL[profile.settingUnit];
  return value === 1 ? unit.singular : unit.plural;
}

export function formatSetting(profile: GrinderProfile, value: number | null): string {
  if (value == null) return 'Not set';
  return `${value} ${unitLabel(profile, value)}`;
}

/** Secondary technical line: clicks, rotations and burr travel. */
export function settingDetail(profile: GrinderProfile, value: number | null): string {
  const clicks = clicksForSetting(profile, value);
  if (clicks == null) return 'No setting recorded';
  const parts: string[] = [`${clicks} ${clicks === 1 ? 'click' : 'clicks'}`];

  if (profile.settingUnit === 'rotations') {
    const travel = burrTravelMm(profile, value);
    if (travel != null) parts.push(`${travel.toFixed(2)} mm from zero`);
  } else {
    const rotations = Math.floor(clicks / profile.clicksPerRotation);
    const rest = clicks % profile.clicksPerRotation;
    parts.push(`${rotations} rot ${rest} click${rest === 1 ? '' : 's'}`);
    const macro = macroStepsFor(profile, value);
    if (macro != null) parts.push(`${macro} macro steps`);
  }
  return parts.join(' · ');
}

export function referenceRangeLabel(profile: GrinderProfile): string | null {
  if (profile.referenceMin == null && profile.referenceMax == null) return null;
  const unit = SETTING_UNIT_LABEL[profile.settingUnit].plural;
  if (profile.referenceMin != null && profile.referenceMax != null) {
    return `${profile.referenceMin}–${profile.referenceMax} ${unit}`;
  }
  if (profile.referenceMin != null) return `from ${profile.referenceMin} ${unit}`;
  return `up to ${profile.referenceMax} ${unit}`;
}

export function preferredRangeLabel(profile: GrinderProfile): string | null {
  if (profile.preferredMin == null && profile.preferredMax == null) return null;
  const unit = SETTING_UNIT_LABEL[profile.settingUnit].plural;
  if (profile.preferredMin != null && profile.preferredMax != null) {
    return `${profile.preferredMin}–${profile.preferredMax} ${unit}`;
  }
  if (profile.preferredMin != null) return `from ${profile.preferredMin} ${unit}`;
  return `up to ${profile.preferredMax} ${unit}`;
}

export type ReferenceStatus = 'inside' | 'below' | 'above' | 'unknown';

/** Compares a setting against the user's preferred range first, then the published one. */
export function referenceStatus(profile: GrinderProfile, value: number | null): ReferenceStatus {
  if (value == null) return 'unknown';
  const min = profile.preferredMin ?? profile.referenceMin;
  const max = profile.preferredMax ?? profile.referenceMax;
  if (min == null && max == null) return 'unknown';
  if (min != null && value < min) return 'below';
  if (max != null && value > max) return 'above';
  return 'inside';
}
