import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { Button, type ButtonVariant } from './button';
import { AppIcon, type IconName } from './icon';
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
  actionVariant = 'secondary',
  compact,
}: EmptyStateProps) {
  const theme = useTheme();
  const haptics = useHaptics();

  if (compact) {
    return (
      <View
        style={[
          styles.compactRoot,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <View style={[styles.compactIcon, { backgroundColor: theme.surfaceSunken }]}>
          <AppIcon name={icon} size={17} color={theme.textMuted} />
        </View>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{title}</AppText>
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        </View>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={8}
            onPress={onAction}
            onPressIn={() => haptics.fire('light')}
            style={({ pressed }) => [styles.compactAction, { opacity: pressed ? 0.65 : 1 }]}>
            <AppText variant="small" tone="accent">
              {actionLabel}
            </AppText>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceSunken }]}>
        <AppIcon name={icon} size={20} color={theme.textMuted} />
      </View>
      <AppText variant="h3" align="center">
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

interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View style={styles.statusBox}>
      <ActivityIndicator size="small" color={theme.accent} />
      <AppText variant="small" tone="muted">
        {label ?? t.common.loading}
      </AppText>
    </View>
  );
}

interface ErrorStateProps {
  message?: string | null;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <View
      style={[
        styles.errorBox,
        { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
      ]}>
      <AppIcon name="alert-circle" size={18} color={theme.danger} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong" color={theme.danger}>
          {t.common.errorTitle}
        </AppText>
        <AppText variant="caption" color={theme.danger}>
          {message || t.common.errorFallback}
        </AppText>
      </View>
      {onRetry ? (
        <Button label={t.common.retry} size="sm" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  compactRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  compactIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAction: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  root: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  description: { maxWidth: 290 },
  action: { marginTop: Spacing.sm },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
});
