/**
 * Bridges the persisted `preferences.haptics` flag to the central haptic
 * engine. All UI haptics must go through here so a single setting gates
 * every pulse in the app, including ones fired outside the timer.
 */

import { useCallback } from 'react';
import { useSettings } from '@/contexts/settings-context';
import {
  triggerHaptic,
  hapticSuccess,
  hapticTick,
  hapticWarning,
  hapticError,
  type HapticLevel,
} from '@/utils/haptics';

export function useHaptics() {
  const { preferences, ready } = useSettings();
  const enabled = ready && preferences.haptics;

  const fire = useCallback(
    (level: HapticLevel) => {
      if (enabled) triggerHaptic(level);
    },
    [enabled]
  );

  const success = useCallback(() => {
    if (enabled) hapticSuccess();
  }, [enabled]);

  const warning = useCallback(() => {
    if (enabled) hapticWarning();
  }, [enabled]);

  const error = useCallback(() => {
    if (enabled) hapticError();
  }, [enabled]);

  /** Very soft cue for controls tapped in rapid succession (steppers). */
  const tick = useCallback(() => {
    if (enabled) hapticTick();
  }, [enabled]);

  return { fire, success, warning, error, tick };
}
