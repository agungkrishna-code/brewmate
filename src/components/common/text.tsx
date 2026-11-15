import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant = keyof typeof Typography;
export type TextTone =
  | 'default'
  | 'muted'
  | 'faint'
  | 'primary'
  | 'accent'
  | 'gold'
  | 'inverse'
  | 'danger';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Shorthand for a single colour override. */
  color?: string;
  align?: TextStyle['textAlign'];
  /** Enforce tabular numbers on any variant (e.g. inline weights, times, ratios). */
  tabular?: boolean;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  color,
  align,
  tabular,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const tones: Record<TextTone, string> = {
    default: theme.text,
    muted: theme.textMuted,
    faint: theme.textFaint,
    primary: theme.primary,
    accent: theme.accent,
    gold: theme.accent,
    inverse: theme.onPrimary,
    danger: theme.danger,
  };

  return (
    <Text
      {...rest}
      style={[
        Typography[variant],
        { color: color ?? tones[tone] },
        align ? { textAlign: align } : null,
        tabular ? styles.tabular : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
