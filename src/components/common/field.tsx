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
import { useTheme } from '@/hooks/use-theme';
import { parseNumber } from '@/utils/calculations';
import { Ionicons, type IconName } from './icon';
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
          <AppText variant="label" tone="muted">
            {label}
          </AppText>
          {required ? <AppText variant="caption" tone="gold">•</AppText> : null}
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
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  prefixIcon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  required,
  multiline,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
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
          {
            backgroundColor: theme.surfaceSunken,
            borderColor: error ? theme.danger : focused ? theme.gold : theme.border,
            minHeight: multiline ? 96 : TouchTarget,
          },
        ]}>
        {prefixIcon ? <Ionicons name={prefixIcon} size={17} color={theme.textFaint} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textFaint}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          multiline={multiline}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: FontFamily.sans,
              minHeight: multiline ? 96 : undefined,
              textAlignVertical: multiline ? 'top' : 'center',
            },
          ]}
        />
      </View>
    </Field>
  );
}

interface NumberFieldProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  step?: number;
  decimals?: number;
  min?: number;
  max?: number;
  /** Shows minus/plus buttons next to the input. */
  stepper?: boolean;
  style?: StyleProp<ViewStyle>;
}

function formatValue(value: number | null, decimals: number): string {
  if (value == null) return '';
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
}

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  hint,
  error,
  required,
  step = 1,
  decimals = 1,
  min = 0,
  max = 9999,
  stepper,
  style,
}: NumberFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => formatValue(value, decimals));
  const emitted = useRef<number | null>(value ?? null);

  // Keep the draft in sync when the value is changed from outside (presets,
  // stepper buttons, or another field forcing a recalculation).
  useEffect(() => {
    if (value !== emitted.current) {
      setDraft(formatValue(value, decimals));
      emitted.current = value ?? null;
    }
  }, [decimals, value]);

  const commit = (next: number | null) => {
    emitted.current = next;
    onChange(next);
  };

  const handleText = (text: string) => {
    setDraft(text);
    const parsed = parseNumber(text);
    if (parsed == null) {
      if (text.trim() === '') commit(null);
      return;
    }
    commit(parsed);
  };

  const nudge = (direction: 1 | -1) => {
    const base = value ?? min;
    const next = Math.round((base + direction * step) * 10 ** decimals) / 10 ** decimals;
    const bounded = Math.min(Math.max(next, min), max);
    setDraft(formatValue(bounded, decimals));
    commit(bounded);
  };

  return (
    <Field label={label} hint={hint} error={error} required={required} style={style}>
      <View style={styles.numberRow}>
        {stepper ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease"
            onPress={() => nudge(-1)}
            style={({ pressed }) => [
              styles.stepButton,
              { backgroundColor: theme.surfaceSunken, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Ionicons name="remove" size={18} color={theme.text} />
          </Pressable>
        ) : null}
        <View
          style={[
            styles.inputShell,
            {
              flex: 1,
              backgroundColor: theme.surfaceSunken,
              borderColor: error ? theme.danger : focused ? theme.gold : theme.border,
            },
          ]}>
          {prefix ? (
            <AppText variant="small" tone="faint">
              {prefix}
            </AppText>
          ) : null}
          <TextInput
            value={draft}
            onChangeText={handleText}
            placeholder={placeholder}
            placeholderTextColor={theme.textFaint}
            keyboardType="decimal-pad"
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              setDraft(formatValue(value, decimals));
            }}
            style={[
              styles.input,
              { color: theme.text, fontFamily: FontFamily.sans, textAlign: 'left' },
            ]}
          />
          {suffix ? (
            <AppText variant="small" tone="faint">
              {suffix}
            </AppText>
          ) : null}
        </View>
        {stepper ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase"
            onPress={() => nudge(1)}
            style={({ pressed }) => [
              styles.stepButton,
              { backgroundColor: theme.surfaceSunken, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Ionicons name="add" size={18} color={theme.text} />
          </Pressable>
        ) : null}
      </View>
    </Field>
  );
}

interface SelectFieldProps {
  label?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  hint?: string;
  error?: string;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}

export function SelectField({
  label,
  value,
  placeholder = 'Select',
  onPress,
  hint,
  error,
  icon,
  style,
}: SelectFieldProps) {
  const theme = useTheme();
  const isEmpty = value.trim().length === 0;

  return (
    <Field label={label} hint={hint} error={error} style={style}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${value || placeholder}` : value || placeholder}
        onPress={onPress}
        style={({ pressed }) => [
          styles.inputShell,
          {
            minHeight: TouchTarget,
            backgroundColor: theme.surfaceSunken,
            borderColor: error ? theme.danger : theme.border,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        {icon ? <Ionicons name={icon} size={17} color={theme.textFaint} /> : null}
        <AppText
          variant="body"
          tone={isEmpty ? 'faint' : 'default'}
          numberOfLines={1}
          style={styles.flex}>
          {isEmpty ? placeholder : value}
        </AppText>
        <Ionicons name="chevron-down" size={16} color={theme.textFaint} />
      </Pressable>
    </Field>
  );
}

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: IconName;
}

export function SwitchRow({ label, description, value, onValueChange, icon }: SwitchRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.switchRow}>
      {icon ? (
        <View style={[styles.switchIcon, { backgroundColor: theme.surfaceSunken }]}>
          <Ionicons name={icon} size={17} color={theme.textMuted} />
        </View>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
        trackColor={{ false: theme.border, true: theme.gold }}
        thumbColor={value ? theme.surface : theme.surface}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.xs },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.md,
    padding: 0,
  },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepButton: {
    width: TouchTarget,
    height: TouchTarget,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  switchIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
