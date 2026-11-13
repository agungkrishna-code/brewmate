import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FontFamily, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, type IconName } from './icon';
import { AppText } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

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
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 38, md: TouchTarget, lg: 56 };
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
}: ButtonProps) {
  const theme = useTheme();

  const palettes: Record<ButtonVariant, { bg: string; fg: string; border?: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary },
    secondary: { bg: theme.surface, fg: theme.text, border: theme.borderStrong },
    ghost: { bg: 'transparent', fg: theme.textMuted },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
    gold: { bg: theme.gold, fg: theme.mode === 'dark' ? '#20160F' : '#2A1E17' },
  };
  const palette = palettes[variant];
  const isDisabled = disabled || loading;
  const iconSize = size === 'lg' ? 20 : 17;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(isDisabled) }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: HEIGHTS[size],
          paddingHorizontal: PADDING[size],
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1 : 0,
          opacity: isDisabled ? 0.45 : pressed ? 0.8 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {icon && iconPosition === 'left' ? (
            <Ionicons name={icon} size={iconSize} color={palette.fg} />
          ) : null}
          <AppText
            variant="bodyStrong"
            color={palette.fg}
            style={size === 'sm' ? styles.smallLabel : undefined}>
            {label}
          </AppText>
          {icon && iconPosition === 'right' ? (
            <Ionicons name={icon} size={iconSize} color={palette.fg} />
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
  variant?: 'plain' | 'surface' | 'inverse';
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  label,
  size = 40,
  color,
  variant = 'surface',
  disabled,
}: IconButtonProps) {
  const theme = useTheme();
  const backgrounds = {
    plain: 'transparent',
    surface: theme.surfaceSunken,
    inverse: theme.primary,
  };
  const resolved = color ?? (variant === 'inverse' ? theme.onPrimary : theme.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: Radius.pill,
          backgroundColor: backgrounds[variant],
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
        },
      ]}>
      <Ionicons name={icon} size={size * 0.46} color={resolved} />
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
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  smallLabel: { fontSize: 14 },
  fullWidth: { alignSelf: 'stretch' },
  flex: { flex: 1 },
  segmentTrack: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    gap: 2,
  },
  segment: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabelActive: { fontFamily: FontFamily.sansMedium },
});
