import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon } from './icon';
import { AppText } from './text';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: object;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.flex}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          onPressIn={() => haptics.fire('selection')}
          hitSlop={10}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="small" color={theme.accent} style={styles.actionLabel}>
            {actionLabel}
          </AppText>
          <AppIcon name="chevron-right" size={14} color={theme.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

interface DataRowProps {
  label: string;
  value: ReactNode;
  /** Renders the value with more weight. */
  emphasis?: boolean;
  /** Render the value with tabular numbers. */
  tabular?: boolean;
  /** Hide the horizontal alignment and stack label above value. */
  stacked?: boolean;
  /** Omit bottom hairline on the last row of a group. */
  last?: boolean;
}

export function DataRow({ label, value, emphasis, tabular, stacked, last }: DataRowProps) {
  const theme = useTheme();

  if (stacked) {
    return (
      <View style={styles.dataStacked}>
        <AppText variant="fieldLabel" tone="faint">
          {label}
        </AppText>
        {typeof value === 'string' ? (
          <AppText variant="body" tabular={tabular}>
            {value}
          </AppText>
        ) : (
          value
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dataRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
      ]}>
      <AppText variant="small" tone="muted" style={styles.flex}>
        {label}
      </AppText>
      {typeof value === 'string' ? (
        <AppText
          variant={emphasis ? 'bodyStrong' : 'small'}
          tabular={tabular}
          align="right"
          style={styles.value}>
          {value}
        </AppText>
      ) : (
        value
      )}
    </View>
  );
}

export function Divider({ style }: { style?: object }) {
  const theme = useTheme();
  return (
    <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }, style]} />
  );
}

export function Dot({ color, size = 6 }: { color?: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? theme.accent,
      }}
    />
  );
}

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'accent' | 'gold' | 'success' | 'danger';
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const palette = {
    neutral: { bg: theme.surfaceSunken, fg: theme.textMuted },
    accent: { bg: theme.accentSoft, fg: theme.accent },
    gold: { bg: theme.accentSoft, fg: theme.accent },
    success: { bg: theme.primarySoft, fg: theme.success },
    danger: { bg: theme.dangerSoft, fg: theme.danger },
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <AppText variant="caption" color={palette.fg} style={styles.badgeLabel}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  subtitle: { marginTop: 2 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: FontFamily.sansMedium },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 3,
  },
  dataStacked: { gap: 4, paddingVertical: Spacing.sm },
  value: { flexShrink: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    alignSelf: 'flex-start',
  },
  badgeLabel: { fontSize: 11, fontFamily: FontFamily.sansMedium },
});
