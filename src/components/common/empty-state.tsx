import { StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Button, type ButtonVariant } from './button';
import { Ionicons, type IconName } from './icon';
import { AppText } from './text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  compact,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          padding: compact ? Spacing.lg : Spacing.xxl,
        },
      ]}>
      <View style={[styles.iconRing, { backgroundColor: theme.primarySoft }]}>
        <Ionicons name={icon} size={compact ? 20 : 26} color={theme.primary} />
      </View>
      <AppText variant={compact ? 'bodyStrong' : 'h2'} align="center">
        {title}
      </AppText>
      <AppText variant="small" tone="muted" align="center" style={styles.description}>
        {description}
      </AppText>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant={actionVariant}
          size="sm"
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  description: { maxWidth: 280 },
  action: { marginTop: Spacing.sm },
});
