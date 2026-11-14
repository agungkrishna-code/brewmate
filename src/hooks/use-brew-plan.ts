/**
 * Single source of truth for a brew plan while the user edits it.
 *
 * Both the calculator tab and the recipe editor use this hook, so the "water
 * must always add up" rules live in exactly one place.
 */

import { useCallback, useMemo, useState } from 'react';
import { STAGE_LABELS, DEFAULT_BREW, MAX_POUR_STAGES } from '@/constants/defaults';
import type { BrewRecipe, PourStep } from '@/types';
import {
  adjustStageAmount,
  bloomWaterFor,
  distributeWater,
  round1,
  roundTo,
  sum,
} from '@/utils/calculations';
import { pourLabel } from '@/services/calculator/v60';

export interface PourDraft {
  label: string;
  amountG: number;
  durationS: number;
}

interface PlanState {
  doseG: number;
  totalWaterG: number;
  tempC: number;
  bloomMultiplier: number;
  bloomDurationS: number;
  pours: PourDraft[];
  drawdownEnabled: boolean;
  drawdownDurationS: number;
}

export interface BrewPlan extends PlanState {
  /** Derived 1:N ratio, rounded for display. */
  ratio: number;
  bloomWaterG: number;
  remainingWaterG: number;
  pourAmounts: number[];
  steps: PourStep[];
  totalTimeS: number;
  setDose: (dose: number) => void;
  setRatio: (ratio: number) => void;
  setTotalWater: (water: number) => void;
  setTemp: (celsius: number) => void;
  setBloomMultiplier: (multiplier: number) => void;
  setBloomDuration: (seconds: number) => void;
  setPourAmount: (index: number, amount: number) => void;
  setPourDuration: (index: number, seconds: number) => void;
  setPourLabel: (index: number, label: string) => void;
  addPour: () => void;
  removePour: (index: number) => void;
  setDrawdownEnabled: (enabled: boolean) => void;
  setDrawdownDuration: (seconds: number) => void;
  reset: () => void;
}

const DEFAULT_POUR_LABEL_RE =
  /^(?:(?:Single|Final|First|Second|Third|Fourth|Fifth|Sixth)\s+pour|Pour\s+\d+)$/i;

function syncPourLabel(currentLabel: string, index: number, count: number): string {
  const trimmed = currentLabel.trim();
  if (!trimmed || DEFAULT_POUR_LABEL_RE.test(trimmed)) {
    return pourLabel(index, count);
  }
  return currentLabel;
}

function remainingFor(state: PlanState): number {
  return round1(state.totalWaterG - bloomWaterFor(state.doseG, state.bloomMultiplier));
}

function rescalePours(pours: PourDraft[], oldRemaining: number, newRemaining: number): PourDraft[] {
  if (pours.length === 0) return pours;
  if (oldRemaining <= 0.2 || newRemaining <= 0.2) {
    const even = distributeWater(Math.max(0, newRemaining), pours.length);
    return pours.map((pour, index) => ({ ...pour, amountG: even[index] }));
  }

  const factor = newRemaining / oldRemaining;
  const scaled = pours.map((pour) => round1(pour.amountG * factor));
  const drift = round1(newRemaining - sum(scaled));
  if (Math.abs(drift) > 0.001) {
    let largest = 0;
    scaled.forEach((amount, index) => {
      if (amount > scaled[largest]) largest = index;
    });
    scaled[largest] = round1(scaled[largest] + drift);
  }
  if (scaled.some((amount) => amount < 0.1)) {
    const even = distributeWater(newRemaining, pours.length);
    return pours.map((pour, index) => ({ ...pour, amountG: even[index] }));
  }
  return pours.map((pour, index) => ({ ...pour, amountG: scaled[index] }));
}

function composeSteps(state: PlanState): PourStep[] {
  const blooms = bloomWaterFor(state.doseG, state.bloomMultiplier);
  const steps: PourStep[] = [
    {
      stepOrder: 0,
      label: STAGE_LABELS.bloom,
      kind: 'bloom',
      targetWaterG: blooms,
      durationS: Math.max(1, Math.round(state.bloomDurationS)),
    },
  ];

  let cumulative = blooms;
  state.pours.forEach((pour, index) => {
    cumulative = round1(cumulative + pour.amountG);
    steps.push({
      stepOrder: index + 1,
      label: pour.label || `Pour ${index + 1}`,
      kind: 'pour',
      targetWaterG: cumulative,
      durationS: Math.max(1, Math.round(pour.durationS)),
    });
  });

  if (state.drawdownEnabled) {
    steps.push({
      stepOrder: steps.length,
      label: STAGE_LABELS.drawdown,
      kind: 'drawdown',
      targetWaterG: cumulative,
      durationS: Math.max(1, Math.round(state.drawdownDurationS)),
    });
  }

  return steps;
}

function initialPlan(recipe?: BrewRecipe | null): PlanState {
  if (!recipe) {
    const total = round1(DEFAULT_BREW.coffeeDoseG * DEFAULT_BREW.ratio);
    const blooms = bloomWaterFor(DEFAULT_BREW.coffeeDoseG, DEFAULT_BREW.bloomMultiplier);
    const amounts = distributeWater(round1(total - blooms), DEFAULT_BREW.pourCount);
    return {
      doseG: DEFAULT_BREW.coffeeDoseG,
      totalWaterG: total,
      tempC: DEFAULT_BREW.waterTempC,
      bloomMultiplier: DEFAULT_BREW.bloomMultiplier,
      bloomDurationS: DEFAULT_BREW.bloomDurationS,
      pours: amounts.map((amount, index) => ({
        label: pourLabel(index, amounts.length),
        amountG: amount,
        durationS: 30,
      })),
      drawdownEnabled: true,
      drawdownDurationS: 45,
    };
  }

  const pours = recipe.steps.filter((step) => step.kind === 'pour');
  const drawdown = recipe.steps.find((step) => step.kind === 'drawdown');
  const blooms = bloomWaterFor(recipe.coffeeDoseG, recipe.bloomMultiplier);
  let previous = blooms;
  const pourDrafts: PourDraft[] = pours.map((step, index) => {
    const amount = round1(step.targetWaterG - previous);
    previous = step.targetWaterG;
    return {
      label: step.label || pourLabel(index, pours.length),
      amountG: Math.max(0, amount),
      durationS: step.durationS,
    };
  });

  return {
    doseG: recipe.coffeeDoseG,
    totalWaterG: round1(recipe.coffeeDoseG * recipe.ratio),
    tempC: recipe.waterTempC,
    bloomMultiplier: recipe.bloomMultiplier,
    bloomDurationS: recipe.bloomDurationS,
    pours: pourDrafts,
    drawdownEnabled: Boolean(drawdown),
    drawdownDurationS: drawdown?.durationS ?? 45,
  };
}

export function useBrewPlan(recipe?: BrewRecipe | null): BrewPlan {
  const [state, setState] = useState<PlanState>(() => initialPlan(recipe));

  const ratio = useMemo(
    () => (state.doseG > 0 ? roundTo(state.totalWaterG / state.doseG, 2) : 0),
    [state.doseG, state.totalWaterG]
  );
  const bloomWaterG = useMemo(
    () => bloomWaterFor(state.doseG, state.bloomMultiplier),
    [state.doseG, state.bloomMultiplier]
  );
  const remainingWaterG = useMemo(
    () => round1(state.totalWaterG - bloomWaterG),
    [bloomWaterG, state.totalWaterG]
  );

  /** Applies a new total + bloom, keeping the shape of the pour split. */
  const commitWater = useCallback(
    (updater: (previous: PlanState) => PlanState) => {
      setState((previous) => {
        const oldRemaining = remainingFor(previous);
        const next = updater(previous);
        const newRemaining = remainingFor(next);
        if (Math.abs(newRemaining - oldRemaining) < 0.001) return next;
        return { ...next, pours: rescalePours(next.pours, oldRemaining, newRemaining) };
      });
    },
    []
  );

  const setDose = useCallback(
    (dose: number) => {
      commitWater((previous) => {
        const safe = Math.max(0.1, dose);
        const currentRatio = previous.totalWaterG / previous.doseG;
        return {
          ...previous,
          doseG: safe,
          totalWaterG: round1(safe * (Number.isFinite(currentRatio) ? currentRatio : 16)),
        };
      });
    },
    [commitWater]
  );

  const setRatio = useCallback(
    (nextRatio: number) => {
      commitWater((previous) => ({
        ...previous,
        totalWaterG: round1(previous.doseG * Math.max(1, nextRatio)),
      }));
    },
    [commitWater]
  );

  const setTotalWater = useCallback(
    (water: number) => {
      commitWater((previous) => ({
        ...previous,
        totalWaterG: round1(Math.max(previous.doseG * 2, water)),
      }));
    },
    [commitWater]
  );

  const setTemp = useCallback((celsius: number) => {
    setState((previous) => ({ ...previous, tempC: celsius }));
  }, []);

  const setBloomMultiplier = useCallback(
    (multiplier: number) => {
      commitWater((previous) => ({
        ...previous,
        bloomMultiplier: Math.min(6, Math.max(1, multiplier)),
      }));
    },
    [commitWater]
  );

  const setBloomDuration = useCallback((seconds: number) => {
    setState((previous) => ({ ...previous, bloomDurationS: Math.max(1, seconds) }));
  }, []);

  const setPourAmount = useCallback((index: number, amount: number) => {
    setState((previous) => {
      if (!previous.pours[index]) return previous;
      const remaining = remainingFor(previous);
      const nextAmounts = adjustStageAmount(
        previous.pours.map((pour) => pour.amountG),
        index,
        amount,
        remaining
      );
      return {
        ...previous,
        pours: previous.pours.map((pour, position) => ({
          ...pour,
          amountG: nextAmounts[position] ?? pour.amountG,
        })),
      };
    });
  }, []);

  const setPourDuration = useCallback((index: number, seconds: number) => {
    setState((previous) => {
      if (!previous.pours[index]) return previous;
      const pours = [...previous.pours];
      pours[index] = { ...pours[index], durationS: Math.max(1, seconds) };
      return { ...previous, pours };
    });
  }, []);

  const setPourLabel = useCallback((index: number, label: string) => {
    setState((previous) => {
      if (!previous.pours[index]) return previous;
      const pours = [...previous.pours];
      pours[index] = { ...pours[index], label };
      return { ...previous, pours };
    });
  }, []);

  const addPour = useCallback(() => {
    setState((previous) => {
      if (previous.pours.length >= MAX_POUR_STAGES) return previous;
      const remaining = remainingFor(previous);
      const count = previous.pours.length + 1;
      const even = distributeWater(remaining, count);
      const pours = [...previous.pours, { label: '', amountG: 0, durationS: 30 }];
      return {
        ...previous,
        pours: pours.map((pour, index) => ({
          label: syncPourLabel(pour.label, index, count),
          amountG: even[index],
          durationS: pour.durationS,
        })),
      };
    });
  }, []);

  const removePour = useCallback((index: number) => {
    setState((previous) => {
      if (previous.pours.length <= 1) return previous;
      const remaining = remainingFor(previous);
      const pours = previous.pours.filter((_, position) => position !== index);
      const count = pours.length;
      const even = distributeWater(remaining, count);
      return {
        ...previous,
        pours: pours.map((pour, position) => ({
          ...pour,
          label: syncPourLabel(pour.label, position, count),
          amountG: even[position],
        })),
      };
    });
  }, []);

  const setDrawdownEnabled = useCallback((enabled: boolean) => {
    setState((previous) => ({ ...previous, drawdownEnabled: enabled }));
  }, []);

  const setDrawdownDuration = useCallback((seconds: number) => {
    setState((previous) => ({ ...previous, drawdownDurationS: Math.max(1, seconds) }));
  }, []);

  const reset = useCallback(() => setState(initialPlan(recipe ?? null)), [recipe]);

  const steps = useMemo(() => composeSteps(state), [state]);
  const totalTimeS = useMemo(
    () => steps.reduce((total, step) => total + step.durationS, 0),
    [steps]
  );

  return {
    ...state,
    ratio,
    bloomWaterG,
    remainingWaterG,
    pourAmounts: state.pours.map((pour) => pour.amountG),
    steps,
    totalTimeS,
    setDose,
    setRatio,
    setTotalWater,
    setTemp,
    setBloomMultiplier,
    setBloomDuration,
    setPourAmount,
    setPourDuration,
    setPourLabel,
    addPour,
    removePour,
    setDrawdownEnabled,
    setDrawdownDuration,
    reset,
  };
}
