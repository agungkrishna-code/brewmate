import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FontFamily, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type IconName } from './icon';
import { AppText } from './text';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'accent'
  | 'gold'
  | 'inverseSecondary'
  | 'inverseGhost';
export type ButtonSize = 'sm' | 'md' | 'lg';
/**
 * Haptic weight of a press. Defaults to `medium` (a primary action) unless
 * the call site says otherwise; `none` opts out for actions whose handler
 * already fires its own result pulse (success/error).
 */
export type ButtonHaptic = 'selection' | 'light' | 'medium' | 'heavy' | 'none';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  haptic?: ButtonHaptic;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 44, md: TouchTarget, lg: 56 };
const PADDING: Record<ButtonSize, number> = { sm: Spacing.md, md: Spacing.lg, lg: Spacing.xl };

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled,
  loading,
  fullWidth,
  style,
  accessibilityHint,
  haptic = 'medium',
}: ButtonProps) {
  const theme = useTheme();
  const haptics = useHaptics();

  const palettes: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary },
    secondary: { bg: theme.surface, fg: theme.text, border: theme.borderStrong },
    ghost: { bg: 'transparent', fg: theme.textMuted },
    danger: { bg: theme.dangerSoft, fg: theme.danger, border: theme.danger },
    accent: { bg: theme.accent, fg: theme.onAccent },
    gold: { bg: theme.accent, fg: theme.onAccent },
    inverseSecondary: {
      bg: '#26221E',
      fg: '#F5F2EC',
      border: 'rgba(245, 242, 236, 0.22)',
    },
    inverseGhost: {
      bg: 'transparent',
      fg: '#D6CFC7',
    },
  };
  const palette = palettes[variant];
  const isDisabled = disabled || loading;
  const iconSize = size === 'lg' ? 19 : 16;
  // Fire on touch-down, not on release: the buzz must land the millisecond
  // the finger hits the glass, before the action's own result feedback.
  const onPressIn = () => {
    if (isDisabled || haptic === 'none') return;
    haptics.fire(haptic);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      disabled={isDisabled}
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHTS[size],
          paddingHorizontal: PADDING[size],
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1 : 0,
          opacity: isDisabled ? 0.45 : pressed ? 0.82 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' ? (
            <AppIcon name={icon} size={iconSize} color={palette.fg} />
          ) : null}
          <AppText
            variant="bodyStrong"
            color={palette.fg}
            style={size === 'sm' ? styles.smallLabel : undefined}>
            {label}
          </AppText>
          {icon && iconPosition === 'right' ? (
            <AppIcon name={icon} size={iconSize} color={palette.fg} />
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  label: string;
  size?: number;
  color?: string;
  variant?: 'plain' | 'surface' | 'accent' | 'instrument';
  disabled?: boolean;
  /** Haptic weight; defaults to `light` since most icon buttons are secondary. */
  haptic?: ButtonHaptic;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 44,
  color,
  variant = 'surface',
  disabled,
  haptic = 'light',
}: IconButtonProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const onPressIn = () => {
    if (disabled || haptic === 'none') return;
    haptics.fire(haptic);
  };
  const backgrounds = {
    plain: 'transparent',
    surface: theme.surface,
    accent: theme.accent,
    instrument: '#26221E',
  };
  const borders = {
    plain: 'transparent',
    surface: theme.border,
    accent: 'transparent',
    instrument: 'rgba(245, 242, 236, 0.16)',
  };
  const resolved =
    color ??
    (variant === 'accent'
      ? theme.onAccent
      : variant === 'instrument'
        ? '#F5F2EC'
        : theme.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={Math.max(4, Math.ceil((TouchTarget - size) / 2))}
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: Radius.md,
          backgroundColor: backgrounds[variant],
          borderColor: borders[variant],
          borderWidth: variant === 'plain' ? 0 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
        },
      ]}>
      <AppIcon name={icon} size={Math.round(size * 0.43)} color={resolved} />
    </Pressable>
  );
}

interface Option<T> {
  label: string;
  value: T;
}

interface SegmentedControlProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Stretch to fill the available width. */
  stretch?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  stretch,
}: SegmentedControlProps<T>) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <View
      style={[
        styles.segmentTrack,
        { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
        stretch && styles.fullWidth,
      ]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => onChange(option.value)}
            onPressIn={() => haptics.fire('selection')}
            style={({ pressed }) => [
              styles.segment,
              stretch && styles.flex,
              selected && { backgroundColor: theme.surface, borderColor: theme.borderStrong },
              pressed && !selected ? { opacity: 0.7 } : null,
            ]}>
            <AppText
              variant="small"
              color={selected ? theme.text : theme.textMuted}
              style={selected ? styles.segmentLabelActive : undefined}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  smallLabel: { fontSize: 13.5 },
  fullWidth: { alignSelf: 'stretch' },
  flex: { flex: 1 },
  segmentTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 3,
  },
  segment: {
    minHeight: 40,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabelActive: { fontFamily: FontFamily.sansMedium },
});
