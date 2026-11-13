import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextVariant = keyof typeof Typography;
export type TextTone = 'default' | 'muted' | 'faint' | 'primary' | 'gold' | 'inverse' | 'danger';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Shorthand for a single colour override. */
  color?: string;
  align?: TextStyle['textAlign'];
}

export function AppText({
  variant = 'body',
  tone = 'default',
  color,
  align,
  style,
  ...rest
}: AppTextProps) {
  const theme = useTheme();
  const tones: Record<TextTone, string> = {
    default: theme.text,
    muted: theme.textMuted,
    faint: theme.textFaint,
    primary: theme.primary,
    gold: theme.gold,
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
        style,
      ]}
    />
  );
}

export const styles = StyleSheet.create({});
