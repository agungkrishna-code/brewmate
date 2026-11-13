import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from './icon';
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
          hitSlop={8}
          style={({ pressed }) => [styles.action, { opacity: pressed ? 0.6 : 1 }]}>
          <AppText variant="caption" color={theme.primary} style={styles.actionLabel}>
            {actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={13} color={theme.primary} />
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
  /** Hide the label and render the value full width. */
  stacked?: boolean;
}

export function DataRow({ label, value, emphasis, stacked }: DataRowProps) {
  const theme = useTheme();

  if (stacked) {
    return (
      <View style={styles.dataStacked}>
        <AppText variant="label" tone="faint">
          {label}
        </AppText>
        {typeof value === 'string' ? <AppText variant="body">{value}</AppText> : value}
      </View>
    );
  }

  return (
    <View style={[styles.dataRow, { borderBottomColor: theme.border }]}>
      <AppText variant="small" tone="muted" style={styles.flex}>
        {label}
      </AppText>
      {typeof value === 'string' ? (
        <AppText variant={emphasis ? 'bodyStrong' : 'small'} align="right" style={styles.value}>
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
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: theme.border }, style]} />;
}

export function Dot({ color, size = 6 }: { color?: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color ?? theme.gold,
      }}
    />
  );
}

interface BadgeProps {
  label: string;
  tone?: 'neutral' | 'gold' | 'success' | 'danger';
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const theme = useTheme();
  const palette = {
    neutral: { bg: theme.surfaceSunken, fg: theme.textMuted },
    gold: { bg: theme.goldSoft, fg: theme.mode === 'dark' ? theme.gold : '#7A5A2E' },
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
  action: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingBottom: 2 },
  actionLabel: { fontFamily: FontFamily.sansMedium },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataStacked: { gap: 2, paddingVertical: Spacing.sm },
  value: { flexShrink: 1 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  badgeLabel: { fontSize: 11, fontFamily: FontFamily.sansMedium },
});
