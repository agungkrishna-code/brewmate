/**
 * Brewing timer.
 *
 * Elapsed time is always derived from wall-clock timestamps rather than by
 * counting interval ticks, so pausing, backgrounding the app or a slow JS
 * thread can never make the brew drift. The interval only forces a re-render.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BrewTimerStatus, TimelineStage } from '@/types';
import {
  brewProgress,
  stageIndexAt,
  timelineDuration,
} from '@/services/brewing/timeline';

export interface BrewingTimerOptions {
  stages: TimelineStage[];
  hapticsEnabled?: boolean;
  onComplete?: () => void;
}

export interface BrewingTimer {
  status: BrewTimerStatus;
  elapsedMs: number;
  elapsedS: number;
  totalDurationS: number;
  activeIndex: number;
  activeStage: TimelineStage | null;
  nextStage: TimelineStage | null;
  stageRemainingS: number;
  totalRemainingS: number;
  progress: number;
  isRunning: boolean;
  isPaused: boolean;
  isFinished: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
  reset: () => void;
  skipStage: () => void;
  finish: () => void;
}

function hapticTap(enabled: boolean) {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function useBrewingTimer({
  stages,
  hapticsEnabled = true,
  onComplete,
}: BrewingTimerOptions): BrewingTimer {
  const [status, setStatus] = useState<BrewTimerStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);

  const runStartRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const previousStageRef = useRef(-1);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Kept in a ref so `finish` stays stable across renders without re-subscribing
  // every effect that can end the brew.
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const totalDurationS = useMemo(() => timelineDuration(stages), [stages]);

  const readElapsed = useCallback(() => {
    if (runStartRef.current == null) return offsetRef.current;
    return offsetRef.current + (Date.now() - runStartRef.current);
  }, []);

  const seek = useCallback(
    (nextMs: number) => {
      const clamped = Math.max(0, nextMs);
      offsetRef.current = clamped;
      runStartRef.current = runStartRef.current == null ? null : Date.now();
      setElapsedMs(clamped);
    },
    []
  );

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    runStartRef.current = null;
    offsetRef.current = totalDurationS * 1000;
    setElapsedMs(totalDurationS * 1000);
    setStatus('finished');
    if (hapticsEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }
    onCompleteRef.current?.();
  }, [hapticsEnabled, totalDurationS]);

  const start = useCallback(() => {
    completedRef.current = false;
    offsetRef.current = 0;
    runStartRef.current = Date.now();
    previousStageRef.current = -1;
    setElapsedMs(0);
    setStatus('running');
    hapticTap(hapticsEnabled);
  }, [hapticsEnabled]);

  const pause = useCallback(() => {
    if (runStartRef.current == null) return;
    offsetRef.current = readElapsed();
    runStartRef.current = null;
    setElapsedMs(offsetRef.current);
    setStatus('paused');
    hapticTap(hapticsEnabled);
  }, [hapticsEnabled, readElapsed]);

  const resume = useCallback(() => {
    if (runStartRef.current != null) return;
    runStartRef.current = Date.now();
    setStatus('running');
    hapticTap(hapticsEnabled);
  }, [hapticsEnabled]);

  const toggle = useCallback(() => {
    if (status === 'running') pause();
    else if (status === 'paused') resume();
    else start();
  }, [pause, resume, start, status]);

  const reset = useCallback(() => {
    completedRef.current = false;
    runStartRef.current = null;
    offsetRef.current = 0;
    previousStageRef.current = -1;
    setElapsedMs(0);
    setStatus('idle');
  }, []);

  const skipStage = useCallback(() => {
    if (stages.length === 0) return;
    const elapsedS = readElapsed() / 1000;
    const index = stageIndexAt(elapsedS, stages);
    const next = stages[index + 1];
    if (!next) {
      finish();
      return;
    }
    seek(next.startS * 1000);
    hapticTap(hapticsEnabled);
  }, [finish, hapticsEnabled, readElapsed, seek, stages]);

  // Re-render while running; the value itself comes from timestamps.
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => setElapsedMs(readElapsed()), 200);
    return () => clearInterval(interval);
  }, [readElapsed, status]);

  // Coming back from the background: recompute from timestamps immediately.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && runStartRef.current != null) {
        setElapsedMs(readElapsed());
      }
    });
    return () => subscription.remove();
  }, [readElapsed]);

  const elapsedS = elapsedMs / 1000;
  const activeIndex =
    status === 'finished'
      ? Math.max(0, stages.length - 1)
      : stageIndexAt(elapsedS, stages);
  const activeStage = stages[activeIndex] ?? null;
  const nextStage = stages[activeIndex + 1] ?? null;

  // Auto-advance to finished when the last stage has run out.
  useEffect(() => {
    if (status !== 'running' || stages.length === 0) return;
    if (elapsedS >= totalDurationS) finish();
  }, [elapsedS, finish, stages.length, status, totalDurationS]);

  // Tactile cue whenever the brew moves into a new stage.
  useEffect(() => {
    if (status !== 'running') return;
    const previous = previousStageRef.current;
    if (previous !== activeIndex) {
      previousStageRef.current = activeIndex;
      if (previous >= 0) hapticTap(hapticsEnabled);
    }
  }, [activeIndex, hapticsEnabled, status]);

  return {
    status,
    elapsedMs,
    elapsedS,
    totalDurationS,
    activeIndex,
    activeStage,
    nextStage,
    stageRemainingS: activeStage ? Math.max(0, activeStage.endS - elapsedS) : 0,
    totalRemainingS: Math.max(0, totalDurationS - elapsedS),
    progress: brewProgress(elapsedS, stages),
    isRunning: status === 'running',
    isPaused: status === 'paused',
    isFinished: status === 'finished',
    start,
    pause,
    resume,
    toggle,
    reset,
    skipStage,
    finish,
  };
}
