/**
 * Brewmate logic checks.
 *
 * Run with `npm test`. These cover the parts where a quiet bug would ruin a
 * brew: water arithmetic, the timed stage timeline and grinder click maths.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calculateBrew, pourLabel, stepAmountsFromSteps } from '@/services/calculator/v60';
import {
  brewProgress,
  buildTimeline,
  stageIndexAt,
  timelineDuration,
  waterTargetAt,
} from '@/services/brewing/timeline';
import {
  adjustStageAmount,
  bloomWaterFor,
  cumulative,
  distributeWater,
  normalizeToTotal,
  ratioFor,
  round1,
  sum,
  totalWaterFor,
} from '@/utils/calculations';
import { clicksForSetting, macroStepsFor, referenceStatus } from '@/utils/grinder';
import { formatDuration, formatRatio, formatStopwatch, formatWeight } from '@/utils/formatting';
import { validateBean, validateGrinder, validateRecipe } from '@/utils/validation';
import { EMPTY_GRINDER_DRAFT, STARTER_RECIPES } from '@/constants/defaults';
import { GUIDE_ARTICLES } from '@/constants/guide';
import { BUILTIN_GRINDERS } from '@/database/seed';
import type { CoffeeBeanDraft, PourStep } from '@/types';

test('total water and bloom follow the dose', () => {
  assert.equal(totalWaterFor(15, 16), 240);
  assert.equal(bloomWaterFor(15, 3), 45);
  assert.equal(totalWaterFor(12, 17), 204);
  assert.equal(totalWaterFor(18, 16), 288);
  assert.equal(ratioFor(15, 240), 16);
});

test('water distribution always lands exactly on the total', () => {
  for (const total of [195, 240, 203.7, 168.3, 99.9]) {
    for (const parts of [1, 2, 3, 4, 5, 6]) {
      const amounts = distributeWater(total, parts);
      assert.equal(amounts.length, parts);
      assert.equal(round1(sum(amounts)), round1(total), `${parts} parts of ${total}`);
      assert.ok(amounts.every((amount) => amount >= 0));
    }
  }
});

test('cumulative targets end on the total', () => {
  const targets = cumulative([45, 75, 70, 50]);
  assert.deepEqual(targets, [45, 120, 190, 240]);
  assert.equal(targets[targets.length - 1], 240);
});

test('editing one stage keeps the total intact', () => {
  const amounts = [75, 60, 60];
  const total = 195;
  const next = adjustStageAmount(amounts, 0, 100, total);
  assert.equal(round1(sum(next)), total);
  assert.equal(next[0], 100);
  assert.ok(next.every((amount) => amount >= 0.1));
});

test('a single pour is locked to the remaining water', () => {
  const next = adjustStageAmount([195], 0, 50, 195);
  assert.deepEqual(next, [195]);
});

test('normalizeToTotal absorbs rounding drift', () => {
  const normalised = normalizeToTotal([33.3, 33.3, 33.3], 100);
  assert.equal(round1(sum(normalised)), 100);
});

test('calculateBrew builds a coherent schedule', () => {
  const result = calculateBrew({
    doseG: 15,
    ratio: 16,
    bloomMultiplier: 3,
    bloomDurationS: 45,
    pourCount: 3,
    pourDurationS: 30,
    drawdownDurationS: 45,
  });

  assert.equal(result.totalWaterG, 240);
  assert.equal(result.bloomWaterG, 45);
  assert.equal(result.remainingWaterG, 195);
  assert.equal(result.steps.length, 5);

  const last = result.steps[result.steps.length - 1];
  assert.equal(last.targetWaterG, 240);
  assert.equal(last.kind, 'drawdown');
  assert.equal(result.totalTimeS, 45 + 30 * 3 + 45);

  // Cumulative targets must be monotonically increasing.
  for (let index = 1; index < result.steps.length; index += 1) {
    assert.ok(
      result.steps[index].targetWaterG >= result.steps[index - 1].targetWaterG,
      'targets never go backwards'
    );
  }
});

test('per-stage amounts round-trip through stored steps', () => {
  const result = calculateBrew({
    doseG: 12,
    ratio: 17,
    bloomMultiplier: 3,
    bloomDurationS: 40,
    pourCount: 2,
  });
  const amounts = stepAmountsFromSteps(result.bloomWaterG, result.steps);
  assert.deepEqual(amounts, result.pourAmounts);
  assert.equal(round1(sum(amounts)), result.remainingWaterG);
});

test('timeline maps elapsed time to the right stage', () => {
  const steps: PourStep[] = [
    { stepOrder: 0, label: 'Bloom', kind: 'bloom', targetWaterG: 45, durationS: 45 },
    { stepOrder: 1, label: 'First pour', kind: 'pour', targetWaterG: 120, durationS: 30 },
    { stepOrder: 2, label: 'Second pour', kind: 'pour', targetWaterG: 190, durationS: 40 },
    { stepOrder: 3, label: 'Final pour', kind: 'pour', targetWaterG: 240, durationS: 35 },
    { stepOrder: 4, label: 'Drawdown', kind: 'drawdown', targetWaterG: 240, durationS: 45 },
  ];
  const timeline = buildTimeline(steps);

  assert.equal(timeline.length, 5);
  assert.equal(timelineDuration(timeline), 195);
  assert.equal(timeline[1].startS, 45);
  assert.equal(timeline[1].endS, 75);
  assert.equal(timeline[1].addedWaterG, 75);

  assert.equal(stageIndexAt(0, timeline), 0);
  assert.equal(stageIndexAt(44.9, timeline), 0);
  assert.equal(stageIndexAt(45, timeline), 1);
  assert.equal(stageIndexAt(74.9, timeline), 1);
  assert.equal(stageIndexAt(75, timeline), 2);
  assert.equal(stageIndexAt(195, timeline), 4);
  assert.equal(stageIndexAt(999, timeline), 4);

  assert.equal(waterTargetAt(60, timeline), 120);
  assert.equal(waterTargetAt(120, timeline), 240);
  assert.equal(waterTargetAt(195, timeline), 240);
  assert.equal(brewProgress(97.5, timeline), 50);
});

test('starter recipes are internally consistent and clearly flagged', () => {
  for (const recipe of STARTER_RECIPES) {
    const total = totalWaterFor(recipe.coffeeDoseG, recipe.ratio);
    const last = recipe.steps[recipe.steps.length - 1];
    assert.equal(last.targetWaterG, total, `${recipe.name} reaches its total`);
    assert.equal(recipe.totalWaterG, total, `${recipe.name} stores its exact total`);
    assert.equal(recipe.isStarter, true);
    assert.equal(
      recipe.steps.reduce((seconds, step) => seconds + step.durationS, 0),
      recipe.targetTimeS,
      `${recipe.name} duration matches its stages`
    );
    const bloom = recipe.steps[0];
    assert.equal(bloom.kind, 'bloom');
    assert.equal(bloom.targetWaterG, bloomWaterFor(recipe.coffeeDoseG, recipe.bloomMultiplier));
  }
});

test('S5 Pro and C5 Pro clicks are not interchangeable', () => {
  const s5 = BUILTIN_GRINDERS.find((grinder) => grinder.model === 'timemore-s5-pro');
  const c5 = BUILTIN_GRINDERS.find((grinder) => grinder.model === 'timemore-c5-pro');
  if (!s5 || !c5) throw new Error('Both built-in grinders must exist');

  // 6.5 dial rotations on the S5 Pro is 585 clicks.
  assert.equal(clicksForSetting(s5, 6.5), 585);
  // 6.5 clicks on the C5 Pro is 6.5 clicks — never 585.
  assert.equal(clicksForSetting(c5, 6.5), 7);
  assert.notEqual(clicksForSetting(s5, 6.5), clicksForSetting(c5, 6.5));

  // 20 clicks on the C5 Pro is under half a rotation (48 per rotation).
  assert.equal(macroStepsFor(c5, 20), 6.7);
  assert.equal(s5.referenceMin, 5.0);
  assert.equal(s5.referenceMax, 8.0);
  assert.equal(c5.referenceMin, null);

  assert.equal(referenceStatus(s5, 6.5), 'inside');
  assert.equal(referenceStatus(s5, 4), 'below');
  assert.equal(referenceStatus(s5, 9), 'above');
  assert.equal(referenceStatus(c5, 20), 'unknown');
});

test('recipe validation catches impossible input', () => {
  const steps: PourStep[] = [
    { stepOrder: 0, label: 'Bloom', kind: 'bloom', targetWaterG: 45, durationS: 45 },
    { stepOrder: 1, label: 'Pour', kind: 'pour', targetWaterG: 240, durationS: 30 },
  ];
  const good = validateRecipe({
    name: 'Test',
    coffeeDoseG: 15,
    ratio: 16,
    waterTempC: 92,
    bloomMultiplier: 3,
    bloomDurationS: 45,
    steps,
    totalWaterG: 240,
  });
  assert.deepEqual(good, {});

  const bad = validateRecipe({
    name: '',
    coffeeDoseG: 0,
    ratio: 1,
    waterTempC: 40,
    bloomMultiplier: 0,
    bloomDurationS: 2,
    steps: [steps[0]],
    totalWaterG: 0,
  });
  assert.ok(bad.name);
  assert.ok(bad.coffeeDoseG);
  assert.ok(bad.ratio);
  assert.ok(bad.waterTempC);
  assert.ok(bad.bloomMultiplier);
  assert.ok(bad.bloomDurationS);
  assert.ok(bad.steps);
});

test('formatting reads like a recipe card', () => {
  assert.equal(formatWeight(240), '240');
  assert.equal(formatWeight(15.5, true), '15.5 g');
  assert.equal(formatRatio(16), '1:16');
  assert.equal(formatRatio(16.67), '1:16.67');
  assert.equal(formatDuration(195), '3:15');
  assert.equal(formatDuration(45), '0:45');
  assert.equal(formatStopwatch(134_600), '02:14');
  assert.equal(pourLabel(0, 3), 'First pour');
  assert.equal(pourLabel(0, 1), 'Single pour');
});

test('bean and grinder validation catches invalid dates and inverted ranges', () => {
  const baseBean: CoffeeBeanDraft = {
    name: 'Guji',
    origin: '',
    country: '',
    region: '',
    farm: '',
    variety: '',
    process: 'Washed',
    roastLevel: 'Light',
    roastDate: '2026-11-01',
    tastingNotes: '',
    notes: '',
  };
  assert.deepEqual(validateBean(baseBean), {});
  const badBean = validateBean({
    ...baseBean,
    roastDate: '2026-02-31',
  });
  assert.ok(badBean.roastDate);

  const badGrinder = validateGrinder({
    ...EMPTY_GRINDER_DRAFT,
    name: 'Custom',
    referenceMin: 8,
    referenceMax: 5,
    preferredMin: 20,
    preferredMax: 15,
  });
  assert.ok(badGrinder.referenceRange);
  assert.ok(badGrinder.preferredRange);
});

test('guide articles have unique routes, content and sources', () => {
  const slugs = new Set<string>();

  for (const article of GUIDE_ARTICLES) {
    assert.ok(article.slug.length > 0, 'every article needs a route');
    assert.ok(!slugs.has(article.slug), `duplicate guide route: ${article.slug}`);
    slugs.add(article.slug);

    assert.ok(article.title.length > 0, `${article.slug} needs a title`);
    assert.ok(article.summary.length > 0, `${article.slug} needs a summary`);
    assert.ok(article.sections.length >= 2, `${article.slug} needs at least two sections`);
    assert.ok(article.sources.length >= 1, `${article.slug} needs a source`);

    for (const section of article.sections) {
      assert.ok(section.heading.length > 0, `${article.slug} has an empty heading`);
      assert.ok(section.blocks.length > 0, `${article.slug} has an empty section`);
    }
  }

  assert.equal(GUIDE_ARTICLES.length, 8);
});
