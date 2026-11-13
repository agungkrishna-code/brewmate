import type {
  BrewRecipe,
  BrewRatings,
  GrinderDraft,
  PourStep,
  ProcessMethod,
  RatingCategory,
  RatingKey,
  RoastLevel,
  StepKind,
} from '@/types';

/** Fixed ids so seeded rows can be referenced from code and from seed recipes. */
export const BUILTIN_GRINDER_IDS = {
  s5Pro: 'grinder-timemore-s5-pro',
  c5Pro: 'grinder-timemore-c5-pro',
} as const;

export const PROCESS_METHODS: ProcessMethod[] = [
  'Washed',
  'Natural',
  'Honey',
  'Anaerobic',
  'Carbonic Maceration',
  'Infused',
];

export const ROAST_LEVELS: RoastLevel[] = [
  'Light',
  'Medium-Light',
  'Medium',
  'Medium-Dark',
  'Dark',
];

export const RATING_CATEGORIES: RatingCategory[] = [
  { key: 'acidity', label: 'Acidity', hint: 'Bright, juicy lift' },
  { key: 'sweetness', label: 'Sweetness', hint: 'Ripe fruit, caramel' },
  { key: 'bitterness', label: 'Bitterness', hint: 'Higher means harsher' },
  { key: 'body', label: 'Body', hint: 'Weight and texture' },
  { key: 'clarity', label: 'Clarity', hint: 'Clean, defined finish' },
  { key: 'aftertaste', label: 'Aftertaste', hint: 'How long it lingers' },
];

export const EMPTY_RATINGS: BrewRatings = {
  acidity: null,
  sweetness: null,
  bitterness: null,
  body: null,
  clarity: null,
  aftertaste: null,
};

export const DEFAULT_BREW = {
  coffeeDoseG: 15,
  ratio: 16,
  waterTempC: 92,
  bloomMultiplier: 3,
  bloomDurationS: 45,
  pourCount: 3,
} as const;

export const RATIO_PRESETS = [15, 16, 17] as const;

export const TEMPERATURE_PRESETS = [88, 90, 92, 94, 96] as const;

export const STAGE_LABELS: Record<StepKind, string> = {
  bloom: 'Bloom',
  pour: 'Pour',
  drawdown: 'Drawdown',
};

export const STAGE_INSTRUCTIONS: Record<StepKind, string> = {
  bloom: 'Saturate all the grounds, then give the bed a gentle swirl.',
  pour: 'Pour in slow spirals from the centre outwards.',
  drawdown: 'Stop pouring. Let the bed drain completely.',
};

export const MAX_POUR_STAGES = 6;

export const APP_NAME = 'Brewmate';
export const APP_VERSION = '1.0.0';

export const DISCLAIMERS = {
  starterRecipes:
    'Starter recipes are editable starting points, not universal brewing rules. Adjust them to your coffee, grinder and taste.',
  offline:
    'Everything is stored only on this device. Uninstalling the app removes your recipes, beans and brew journal unless you export a backup first.',
  grinder:
    'TIMEMORE grinders are not interchangeable click-for-click. Brewmate never converts settings between models.',
} as const;

type StepSeed = { label: string; kind: StepKind; add: number; durationS: number };

/** Builds cumulative pour steps from per-stage water additions. */
function buildSteps(pours: StepSeed[]): PourStep[] {
  let cumulative = 0;
  return pours.map((seed, index) => {
    cumulative += seed.add;
    return {
      stepOrder: index,
      label: seed.label,
      kind: seed.kind,
      targetWaterG: Math.round(cumulative * 10) / 10,
      durationS: seed.durationS,
    };
  });
}

const now = '2026-01-01T00:00:00.000Z';

const starterBase = {
  description: null,
  grinderProfileId: null,
  grindSetting: null,
  isFavorite: false,
  isStarter: true,
  createdAt: now,
  updatedAt: now,
} as const;

export const STARTER_RECIPES: Omit<BrewRecipe, 'id'>[] = [
  {
    ...starterBase,
    name: 'Classic 4-Pour',
    description: 'The reference structure: bloom, three pours, slow drawdown.',
    coffeeDoseG: 15,
    ratio: 16,
    totalWaterG: 240,
    waterTempC: 92,
    bloomMultiplier: 3,
    bloomDurationS: 45,
    targetTimeS: 195,
    notes: 'A balanced starting point for medium-light washed coffees.',
    steps: buildSteps([
      { label: 'Bloom', kind: 'bloom', add: 45, durationS: 45 },
      { label: 'First pour', kind: 'pour', add: 75, durationS: 30 },
      { label: 'Second pour', kind: 'pour', add: 70, durationS: 40 },
      { label: 'Final pour', kind: 'pour', add: 50, durationS: 35 },
      { label: 'Drawdown', kind: 'drawdown', add: 0, durationS: 45 },
    ]),
  },
  {
    ...starterBase,
    name: 'Bright & Sweet',
    description: 'Smaller dose, higher ratio — built for floral filter roasts.',
    coffeeDoseG: 12,
    ratio: 17,
    totalWaterG: 204,
    waterTempC: 94,
    bloomMultiplier: 3,
    bloomDurationS: 40,
    targetTimeS: 150,
    notes: 'Try slightly cooler water if the cup turns sharp.',
    steps: buildSteps([
      { label: 'Bloom', kind: 'bloom', add: 36, durationS: 40 },
      { label: 'First pour', kind: 'pour', add: 84, durationS: 40 },
      { label: 'Second pour', kind: 'pour', add: 84, durationS: 40 },
      { label: 'Drawdown', kind: 'drawdown', add: 0, durationS: 30 },
    ]),
  },
  {
    ...starterBase,
    name: 'Slow Single Pour',
    description: 'A larger cup with an even, three-stage pour.',
    coffeeDoseG: 18,
    ratio: 16,
    totalWaterG: 288,
    waterTempC: 93,
    bloomMultiplier: 2.5,
    bloomDurationS: 40,
    targetTimeS: 175,
    notes: 'Use a coarser grind if the drawdown runs past 3:30.',
    steps: buildSteps([
      { label: 'Bloom', kind: 'bloom', add: 45, durationS: 40 },
      { label: 'First pour', kind: 'pour', add: 81, durationS: 30 },
      { label: 'Second pour', kind: 'pour', add: 81, durationS: 30 },
      { label: 'Final pour', kind: 'pour', add: 81, durationS: 30 },
      { label: 'Drawdown', kind: 'drawdown', add: 0, durationS: 45 },
    ]),
  },
];

export const EMPTY_GRINDER_DRAFT: GrinderDraft = {
  name: '',
  brand: 'TIMEMORE',
  model: 'custom',
  clicksPerRotation: 60,
  settingUnit: 'clicks',
  micronsPerClick: 20,
  macroStepsPerRotation: null,
  referenceMin: null,
  referenceMax: null,
  referenceNote: null,
  preferredMin: null,
  preferredMax: null,
  notes: null,
};

export const RATING_KEYS: RatingKey[] = RATING_CATEGORIES.map((category) => category.key);
