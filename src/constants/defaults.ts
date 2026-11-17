import type { Language } from '@/i18n';
import type {
  BrewRecipe,
  BrewRatings,
  GrinderDraft,
  GrinderProfile,
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

const PROCESS_LABELS_ID: Record<ProcessMethod, string> = {
  Washed: 'Washed (Cuci)',
  Natural: 'Natural',
  Honey: 'Honey',
  Anaerobic: 'Anaerobik',
  'Carbonic Maceration': 'Maserasi Karbonat',
  Infused: 'Infused',
};

export function localizeProcessMethod(method: ProcessMethod, lang: Language): string {
  return lang === 'id' ? PROCESS_LABELS_ID[method] ?? method : method;
}

export const ROAST_LEVELS: RoastLevel[] = [
  'Light',
  'Medium-Light',
  'Medium',
  'Medium-Dark',
  'Dark',
];

const ROAST_LABELS_ID: Record<RoastLevel, string> = {
  Light: 'Light (Terang)',
  'Medium-Light': 'Medium-Light',
  Medium: 'Medium (Sedang)',
  'Medium-Dark': 'Medium-Dark',
  Dark: 'Dark (Gelap)',
};

export function localizeRoastLevel(level: RoastLevel, lang: Language): string {
  return lang === 'id' ? ROAST_LABELS_ID[level] ?? level : level;
}

export const RATING_CATEGORIES: RatingCategory[] = [
  { key: 'acidity', label: 'Acidity', hint: 'Bright, juicy lift' },
  { key: 'sweetness', label: 'Sweetness', hint: 'Ripe fruit, caramel' },
  { key: 'bitterness', label: 'Bitterness', hint: 'Higher means harsher' },
  { key: 'body', label: 'Body', hint: 'Weight and texture' },
  { key: 'clarity', label: 'Clarity', hint: 'Clean, defined finish' },
  { key: 'aftertaste', label: 'Aftertaste', hint: 'How long it lingers' },
];

const RATING_CATEGORIES_ID: RatingCategory[] = [
  { key: 'acidity', label: 'Keasaman', hint: 'Kesan cerah dan segar' },
  { key: 'sweetness', label: 'Kemanisan', hint: 'Buah matang, karamel' },
  { key: 'bitterness', label: 'Kepahitan', hint: 'Lebih tinggi berarti lebih getir' },
  { key: 'body', label: 'Body', hint: 'Bobot dan tekstur di mulut' },
  { key: 'clarity', label: 'Kejernihan', hint: 'Bersih dan tegas' },
  { key: 'aftertaste', label: 'Aftertaste', hint: 'Seberapa lama rasa bertahan' },
];

export function getRatingCategories(lang: Language): RatingCategory[] {
  return lang === 'id' ? RATING_CATEGORIES_ID : RATING_CATEGORIES;
}

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

const STAGE_LABELS_ID: Record<StepKind, string> = {
  bloom: 'Bloom',
  pour: 'Tuang',
  drawdown: 'Penirisan',
};

export function getStageLabels(lang: Language): Record<StepKind, string> {
  return lang === 'id' ? STAGE_LABELS_ID : STAGE_LABELS;
}

export const STAGE_INSTRUCTIONS: Record<StepKind, string> = {
  bloom: 'Saturate all the grounds, then give the bed a gentle swirl.',
  pour: 'Pour in slow spirals from the centre outwards.',
  drawdown: 'Stop pouring. Let the bed drain completely.',
};

const STAGE_INSTRUCTIONS_ID: Record<StepKind, string> = {
  bloom: 'Basahi seluruh bubuk kopi, lalu goyangkan dripper perlahan.',
  pour: 'Tuang memutar perlahan dari tengah ke arah luar.',
  drawdown: 'Berhenti menuang. Biarkan air turun hingga bed kopi kering.',
};

export function getStageInstructions(lang: Language): Record<StepKind, string> {
  return lang === 'id' ? STAGE_INSTRUCTIONS_ID : STAGE_INSTRUCTIONS;
}

const STEP_LABEL_TO_ID: Record<string, string> = {
  Bloom: 'Bloom',
  'First pour': 'Tuang pertama',
  'Second pour': 'Tuang kedua',
  'Third pour': 'Tuang ketiga',
  'Fourth pour': 'Tuang keempat',
  'Fifth pour': 'Tuang kelima',
  'Sixth pour': 'Tuang keenam',
  'Final pour': 'Tuang terakhir',
  'Single pour': 'Tuang tunggal',
  Pour: 'Tuang',
  Drawdown: 'Penirisan',
};

const STEP_LABEL_TO_EN: Record<string, string> = {
  Bloom: 'Bloom',
  'Tuang pertama': 'First pour',
  'Tuang kedua': 'Second pour',
  'Tuang ketiga': 'Third pour',
  'Tuang keempat': 'Fourth pour',
  'Tuang kelima': 'Fifth pour',
  'Tuang keenam': 'Sixth pour',
  'Tuang terakhir': 'Final pour',
  'Tuang tunggal': 'Single pour',
  Tuang: 'Pour',
  Penirisan: 'Drawdown',
};

export function localizeStepLabel(label: string, kind: StepKind, lang: Language): string {
  const trimmed = label.trim();
  if (lang === 'id') {
    if (STEP_LABEL_TO_ID[trimmed]) return STEP_LABEL_TO_ID[trimmed];
    const pourMatch = /^Pour\s+(\d+)$/i.exec(trimmed);
    if (pourMatch) return `Tuang ${pourMatch[1]}`;
    if (!trimmed) return STAGE_LABELS_ID[kind];
    return label;
  }
  if (STEP_LABEL_TO_EN[trimmed]) return STEP_LABEL_TO_EN[trimmed];
  const tuangMatch = /^Tuang\s+(\d+)$/i.exec(trimmed);
  if (tuangMatch) return `Pour ${tuangMatch[1]}`;
  if (!trimmed) return STAGE_LABELS[kind];
  return label;
}

export const MAX_POUR_STAGES = 6;

export const APP_NAME = 'Brewmate';
export const APP_VERSION = '1.3.0';

export const DISCLAIMERS = {
  starterRecipes:
    'Starter recipes are editable starting points, not universal brewing rules. Adjust them to your coffee, grinder and taste.',
  offline:
    'Everything is stored only on this device. Uninstalling the app removes your recipes, beans and brew journal unless you export a backup first.',
  grinder:
    'TIMEMORE grinders are not interchangeable click-for-click. Brewmate never converts settings between models.',
} as const;

const DISCLAIMERS_ID = {
  starterRecipes:
    'Resep bawaan hanyalah titik awal yang bisa diubah, bukan aturan mutlak. Sesuaikan dengan kopi, grinder, dan selera Anda.',
  offline:
    'Semua data hanya disimpan di perangkat ini. Menghapus aplikasi akan menghilangkan resep, biji kopi, dan jurnal seduh kecuali Anda mengekspor cadangan terlebih dahulu.',
  grinder:
    'Grinder TIMEMORE tidak bisa disamakan antar model klik-demi-klik. Brewmate tidak pernah mengonversi setelan antar model.',
} as const;

export function getDisclaimers(lang: Language) {
  return lang === 'id' ? DISCLAIMERS_ID : DISCLAIMERS;
}

const STARTER_COPY_ID: Record<string, { description: string; notes: string }> = {
  'recipe-starter-classic-4-pour': {
    description: 'Struktur acuan: bloom, tiga tuangan, dan penirisan perlahan.',
    notes: 'Titik awal yang seimbang untuk kopi washed sangrai medium-light.',
  },
  'recipe-starter-bright-and-sweet': {
    description: 'Dosis lebih kecil, rasio lebih longgar, cocok untuk filter roast yang floral.',
    notes: 'Coba air sedikit lebih dingin jika rasa terasa terlalu tajam.',
  },
  'recipe-starter-slow-single-pour': {
    description: 'Porsi lebih besar dengan tiga tahap tuangan yang merata.',
    notes: 'Gunakan gilingan lebih kasar jika waktu penirisan melewati 3:30.',
  },
};

export function localizeStarterRecipe<T extends { id: string; isStarter: boolean; description: string | null; notes?: string | null }>(
  recipe: T,
  lang: Language
): T {
  if (lang !== 'id' || !recipe.isStarter) return recipe;
  const copy = STARTER_COPY_ID[recipe.id];
  if (!copy) return recipe;
  return {
    ...recipe,
    description: copy.description,
    ...(recipe.notes !== undefined ? { notes: copy.notes } : {}),
  };
}

export function localizeGrinderReferenceNote(grinder: GrinderProfile, lang: Language): string | null {
  if (lang !== 'id') return grinder.referenceNote;
  if (grinder.id === BUILTIN_GRINDER_IDS.s5Pro) {
    return 'Referensi pour-over resmi pabrikan: 5.0–8.0 pada dial. Anggap sebagai rentang awal, lalu cicipi dan sesuaikan.';
  }
  if (grinder.id === BUILTIN_GRINDER_IDS.c5Pro) {
    return 'TIMEMORE tidak merilis rentang pour-over resmi untuk model ini. Grinder ini punya 48 klik per putaran (16 langkah makro), jadi catat rentang kerja Anda sendiri.';
  }
  return grinder.referenceNote;
}

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
    description: 'Smaller dose, higher ratio, built for floral filter roasts.',
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
