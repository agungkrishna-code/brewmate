/**
 * Grinder display maths.
 *
 * These helpers only describe a single grinder. Nothing here maps an S5 Pro
 * setting onto a C5 Pro setting — the two models have different click counts
 * per rotation and different burr travel per click.
 */

import type { Language } from '@/i18n';
import type { GrinderProfile, GrinderSettingUnit } from '@/types';

export const SETTING_UNIT_LABEL: Record<GrinderSettingUnit, { singular: string; plural: string }> =
  {
    rotations: { singular: 'rotation', plural: 'rotations' },
    clicks: { singular: 'click', plural: 'clicks' },
  };

const SETTING_UNIT_LABEL_BY_LANG: Record<
  Language,
  Record<GrinderSettingUnit, { singular: string; plural: string }>
> = {
  en: SETTING_UNIT_LABEL,
  id: {
    rotations: { singular: 'putaran', plural: 'putaran' },
    clicks: { singular: 'klik', plural: 'klik' },
  },
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

export function unitLabel(
  profile: GrinderProfile,
  value: number | null,
  lang: Language = 'en'
): string {
  const unit = SETTING_UNIT_LABEL_BY_LANG[lang][profile.settingUnit];
  return value === 1 ? unit.singular : unit.plural;
}

export function formatSetting(
  profile: GrinderProfile,
  value: number | null,
  lang: Language = 'en'
): string {
  if (value == null) return lang === 'id' ? 'Belum diatur' : 'Not set';
  return `${value} ${unitLabel(profile, value, lang)}`;
}

/** Secondary technical line: clicks, rotations and burr travel. */
export function settingDetail(
  profile: GrinderProfile,
  value: number | null,
  lang: Language = 'en'
): string {
  const clicks = clicksForSetting(profile, value);
  if (clicks == null) return lang === 'id' ? 'Belum ada setelan tercatat' : 'No setting recorded';

  if (lang === 'id') {
    const parts: string[] = [`${clicks} klik`];
    if (profile.settingUnit === 'rotations') {
      const travel = burrTravelMm(profile, value);
      if (travel != null) parts.push(`${travel.toFixed(2)} mm dari nol`);
    } else {
      const rotations = Math.floor(clicks / profile.clicksPerRotation);
      const rest = clicks % profile.clicksPerRotation;
      parts.push(`${rotations} putaran ${rest} klik`);
      const macro = macroStepsFor(profile, value);
      if (macro != null) parts.push(`${macro} langkah makro`);
    }
    return parts.join(' · ');
  }

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

export function referenceRangeLabel(
  profile: GrinderProfile,
  lang: Language = 'en'
): string | null {
  if (profile.referenceMin == null && profile.referenceMax == null) return null;
  const unit = SETTING_UNIT_LABEL_BY_LANG[lang][profile.settingUnit].plural;
  if (profile.referenceMin != null && profile.referenceMax != null) {
    return `${profile.referenceMin}–${profile.referenceMax} ${unit}`;
  }
  if (profile.referenceMin != null) {
    return lang === 'id' ? `mulai ${profile.referenceMin} ${unit}` : `from ${profile.referenceMin} ${unit}`;
  }
  return lang === 'id' ? `hingga ${profile.referenceMax} ${unit}` : `up to ${profile.referenceMax} ${unit}`;
}

export function preferredRangeLabel(
  profile: GrinderProfile,
  lang: Language = 'en'
): string | null {
  if (profile.preferredMin == null && profile.preferredMax == null) return null;
  const unit = SETTING_UNIT_LABEL_BY_LANG[lang][profile.settingUnit].plural;
  if (profile.preferredMin != null && profile.preferredMax != null) {
    return `${profile.preferredMin}–${profile.preferredMax} ${unit}`;
  }
  if (profile.preferredMin != null) {
    return lang === 'id' ? `mulai ${profile.preferredMin} ${unit}` : `from ${profile.preferredMin} ${unit}`;
  }
  return lang === 'id' ? `hingga ${profile.preferredMax} ${unit}` : `up to ${profile.preferredMax} ${unit}`;
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
