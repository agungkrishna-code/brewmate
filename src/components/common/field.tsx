import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { FontFamily, Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { parseNumber } from '@/utils/calculations';
import { AppIcon, type IconName } from './icon';
import { AppText } from './text';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Field({ label, hint, error, required, children, style }: FieldProps) {
  return (
    <View style={[styles.field, style]}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText variant="fieldLabel" tone="muted">
            {label}
          </AppText>
          {required ? (
            <AppText variant="fieldLabel" tone="accent">
              *
            </AppText>
          ) : null}
        </View>
      ) : null}
      {children}
      {error ? (
        <AppText variant="caption" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="faint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

interface TextFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  suffix?: string;
  prefixIcon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  hint,
  error,
  required,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  keyboardType,
  autoCapitalize = 'sentences',
  suffix,
  prefixIcon,
  style,
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Field label={label} hint={hint} error={error} required={required} style={style}>
      <View
        style={[
          styles.inputShell,
          multiline && styles.multilineShell,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}>
        {prefixIcon ? <AppIcon name={prefixIcon} size={17} color={theme.textFaint} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          multiline={multiline}
          maxLength={maxLength}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            multiline && styles.multilineInput,
            { color: theme.text },
          ]}
        />
        {suffix ? (
          <AppText variant="small" tone="faint" tabular>
            {suffix}
          </AppText>
        ) : null}
      </View>
    </Field>
  );
}

interface NumberFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  allowEmpty?: boolean;
  /** Optional +/- stepper buttons docked inside the input shell. */
  stepper?: boolean;
  step?: number;
  min?: number;
  max?: number;
  style?: StyleProp<ViewStyle>;
}

function formatNumeric(value: number | null, decimals = 1): string {
  if (value == null || !Number.isFinite(value)) return '';
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

export function NumberField({
  label,
  hint,
  error,
  required,
  value,
  onChange,
  placeholder,
  suffix,
  prefix,
  decimals = 1,
  allowEmpty = false,
  stepper = false,
  step = 1,
  // Defaults restored from the pre-redesign field: a stepper must never emit a
  // value below the minimum (it used to produce settings like -0.5).
  min = 0,
  max = 9999,
  style,
}: NumberFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [text, setText] = useState(() => formatNumeric(value, decimals));
  const [focused, setFocused] = useState(false);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(formatNumeric(value, decimals));
    }
  }, [value, decimals]);

  const clamp = (n: number) => {
    let next = n;
    if (min != null) next = Math.max(min, next);
    if (max != null) next = Math.min(max, next);
    return next;
  };

  const handleChangeText = (raw: string) => {
    setText(raw);
    const trimmed = raw.trim();
    if (!trimmed) {
      if (allowEmpty) onChange(null);
      return;
    }
    const parsed = parseNumber(trimmed);
    if (parsed != null) onChange(parsed);
  };

  const handleBlur = () => {
    focusedRef.current = false;
    setFocused(false);
    const parsed = parseNumber(text);
    if (parsed == null) {
      if (allowEmpty) {
        setText('');
        onChange(null);
      } else {
        setText(formatNumeric(value, decimals));
      }
      return;
    }
    const bounded = clamp(parsed);
    const factor = 10 ** decimals;
    const rounded = Math.round(bounded * factor) / factor;
    onChange(rounded);
    setText(formatNumeric(rounded, decimals));
  };

  const nudge = (direction: 1 | -1) => {
    const base = value ?? min ?? 0;
    const factor = 10 ** decimals;
    const next = Math.round(clamp(base + direction * step) * factor) / factor;
    onChange(next);
    setText(formatNumeric(next, decimals));
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} style={style}>
      <View
        style={[
          styles.dockedShell,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : focused ? theme.accent : theme.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}>
        {stepper ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.decrease(label ?? '')}
            onPress={() => nudge(-1)}
            style={({ pressed }) => [
              styles.dockedBtn,
              {
                borderRightColor: theme.border,
                backgroundColor: pressed ? theme.surfaceSunken : 'transparent',
              },
            ]}>
            <AppIcon name="minus" size={16} color={theme.textMuted} />
          </Pressable>
        ) : null}

        <View style={[styles.dockedCenter, !stepper && styles.dockedCenterUnstepped]}>
          {prefix ? (
            <AppText variant="small" tone="faint" tabular>
              {prefix}
            </AppText>
          ) : null}
          <TextInput
            value={text}
            onChangeText={handleChangeText}
            onFocus={() => {
              focusedRef.current = true;
              setFocused(true);
            }}
            onBlur={handleBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textFaint}
            keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
            style={[
              styles.input,
              styles.numberInput,
              stepper ? styles.centeredNumber : undefined,
              { color: theme.text },
            ]}
          />
          {suffix ? (
            <AppText variant="small" tone="faint" tabular>
              {suffix}
            </AppText>
          ) : null}
        </View>

        {stepper ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.increase(label ?? '')}
            onPress={() => nudge(1)}
            style={({ pressed }) => [
              styles.dockedBtn,
              styles.dockedBtnRight,
              {
                borderLeftColor: theme.border,
                backgroundColor: pressed ? theme.surfaceSunken : 'transparent',
              },
            ]}>
            <AppIcon name="plus" size={16} color={theme.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </Field>
  );
}

interface SelectFieldProps {
  label?: string;
  hint?: string;
  error?: string;
  value: string | null;
  placeholder?: string;
  icon?: IconName;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SelectField({
  label,
  hint,
  error,
  value,
  placeholder,
  icon,
  disabled,
  onPress,
  style,
}: SelectFieldProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder ?? t.common.selectPlaceholder;

  return (
    <Field label={label} hint={hint} error={error} style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Option'}: ${value ?? resolvedPlaceholder}`}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          {
            backgroundColor: disabled ? theme.surfaceSunken : theme.surface,
            borderColor: error ? theme.danger : theme.border,
            opacity: disabled ? 0.65 : pressed ? 0.78 : 1,
          },
        ]}>
        {icon ? <AppIcon name={icon} size={17} color={theme.textFaint} /> : null}
        <AppText
          variant="body"
          color={value ? theme.text : theme.textFaint}
          numberOfLines={1}
          style={styles.flex}>
          {value ?? resolvedPlaceholder}
        </AppText>
        {!disabled ? <AppIcon name="chevron-down" size={16} color={theme.textMuted} /> : null}
      </Pressable>
    </Field>
  );
}

interface SwitchRowProps {
  label: string;
  hint?: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  icon?: IconName;
}

export function SwitchRow({
  label,
  hint,
  description,
  value,
  onValueChange,
  icon,
}: SwitchRowProps) {
  const theme = useTheme();
  const sub = hint ?? description;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => onValueChange(!value)}
      style={styles.switchRow}>
      {icon ? (
        <View style={[styles.switchIcon, { backgroundColor: theme.surfaceSunken }]}>
          <AppIcon name={icon} size={17} color={theme.textMuted} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {sub ? (
          <AppText variant="caption" tone="muted">
            {sub}
          </AppText>
        ) : null}
      </View>
      {/* The row owns the press. Without this the switch would fire its own
          handler *and* the row's, toggling twice so the tap looks ignored. */}
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: theme.borderStrong, true: theme.accent }}
          thumbColor={theme.switchThumb}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.xs + 2 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  multilineShell: {
    minHeight: 96,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.sans,
    fontSize: 15,
    paddingVertical: 0,
  },
  numberInput: {
    fontFamily: FontFamily.sansMedium,
    fontVariant: ['tabular-nums'],
    minWidth: 28,
  },
  centeredNumber: {
    textAlign: 'center',
  },
  multilineInput: { minHeight: 76 },
  dockedShell: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: TouchTarget,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  dockedBtn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  dockedBtnRight: {
    borderRightWidth: 0,
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  dockedCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.xs,
  },
  dockedCenterUnstepped: {
    justifyContent: 'flex-start',
    paddingHorizontal: Spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: TouchTarget,
    paddingVertical: Spacing.sm,
  },
  switchIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
