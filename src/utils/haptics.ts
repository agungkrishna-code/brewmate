/**
 * Central haptic engine.
 *
 * On Android every press uses the framework's `performHapticFeedback`, which
 * respects the system "touch feedback" setting and needs no `VIBRATE`
 * permission. On other platforms the call is skipped rather than simulated,
 * because emulators and devices without a haptic engine make the promise a
 * lie. Every helper is fire-and-forget: failures (no motor, unsupported
 * effect, native hiccup) are swallowed so a tap never blocks or crashes.
 *
 * Callers gate everything through `useHaptics()`, so a disabled in-app
 * preference stops all of these at the source.
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type AndroidHaptics = typeof Haptics.AndroidHaptics;

export type HapticLevel = 'selection' | 'light' | 'medium' | 'heavy';

/**
 * Fires a haptic pulse. Safe on any platform, including emulators and
 * devices with no vibration or haptics hardware.
 */
export function triggerHaptic(level: HapticLevel): void {
  if (Platform.OS !== 'android') return;
  const type = ANDROID_LEVELS[level];
  if (!type) return;
  try {
    Haptics.performAndroidHapticsAsync(type).catch(() => undefined);
  } catch {
    // Missing hardware, unsupported effect or a broken native bridge must
    // never take a tap down with it.
  }
}

/** Fires the completion pulse once work actually succeeded. */
export function hapticSuccess(): void {
  fireNotification(Haptics.AndroidHaptics.Confirm);
}

/** Fires a distinct alert pulse for recoverable warnings (e.g. timer cue). */
export function hapticWarning(): void {
  fireNotification(Haptics.AndroidHaptics.Long_Press);
}

/** Fires the failure pulse for validation errors and failed operations. */
export function hapticError(): void {
  fireNotification(Haptics.AndroidHaptics.Reject);
}

function fireNotification(type: AndroidHaptics[keyof AndroidHaptics]): void {
  if (Platform.OS !== 'android') return;
  try {
    Haptics.performAndroidHapticsAsync(type).catch(() => undefined);
  } catch {
    // Swallowed: see triggerHaptic.
  }
}

const ANDROID_LEVELS: Record<HapticLevel, AndroidHaptics[keyof AndroidHaptics]> = {
  // Segment_Tick is the framework's own "switching between choices" cue; it
  // stays soft so rapid use never feels like a drum roll. Ration steppers
  // get an even softer effect, see hapticTick() below.
  selection: Haptics.AndroidHaptics.Segment_Tick,
  light: Haptics.AndroidHaptics.Virtual_Key,
  medium: Haptics.AndroidHaptics.Context_Click,
  // Long_Press doubles as the warning cue: a single, unmistakable thud.
  heavy: Haptics.AndroidHaptics.Long_Press,
};

/**
 * Softer than `selection`: built for controls tapped many times in a row
 * (dose/water steppers), where Android itself expects an "expected to be
 * very soft" effect so it does not become uncomfortable.
 */
export function hapticTick(): void {
  if (Platform.OS !== 'android') return;
  try {
    Haptics.performAndroidHapticsAsync(
      Haptics.AndroidHaptics.Segment_Frequent_Tick
    ).catch(() => undefined);
  } catch {
    // Swallowed: see triggerHaptic.
  }
}

/** Semantic aliases so call sites read as intent, not effect name. */
export const hapticSelection = () => triggerHaptic('selection');
export const hapticLight = () => triggerHaptic('light');
export const hapticMedium = () => triggerHaptic('medium');
export const hapticHeavy = () => triggerHaptic('heavy');
