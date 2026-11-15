import type { BrewSessionDetail } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDuration, formatRatio, formatRating, formatWeight } from '@/utils/formatting';
import { AppIcon } from '../common/icon';
import { AppText } from '../common/text';

interface SessionCardProps {
  session: BrewSessionDetail;
  onPress: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export function SessionCard({ session, onPress, selected, selectionMode }: SessionCardProps) {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const title = session.beanNameSnapshot ?? session.recipeNameSnapshot ?? t.journal.defaultSessionTitle;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.journal.cardA11y(title, formatDate(session.brewedAt, lang))}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? theme.accentSoft : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
          borderWidth: selected ? 1.5 : 1,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {formatDate(session.brewedAt, lang)}
            {session.recipeNameSnapshot && session.recipeNameSnapshot !== title
              ? ` · ${session.recipeNameSnapshot}`
              : ''}
          </AppText>
        </View>
        {selectionMode ? (
          <View
            style={[
              styles.checkbox,
              {
                borderColor: selected ? theme.accent : theme.textFaint,
                backgroundColor: selected ? theme.accent : 'transparent',
              },
            ]}>
            {selected ? (
              <AppIcon name="check" size={13} color={theme.onAccent} strokeWidth={2.4} />
            ) : null}
          </View>
        ) : session.averageRating != null ? (
          <View style={styles.rating}>
            <AppIcon name="star" size={12} color={theme.accent} filled />
            <AppText variant="metricSmall" tabular>
              {formatRating(session.averageRating)}
            </AppText>
          </View>
        ) : (
          <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
        )}
      </View>

      <View style={[styles.metaRow, { borderTopColor: theme.border }]}>
        <Meta label={t.common.dose} value={formatWeight(session.coffeeDoseG, true)} />
        <Meta label={t.common.ratio} value={formatRatio(session.ratio)} />
        <Meta label={t.common.time} value={formatDuration(session.totalTimeS)} />
        {session.grindSetting != null ? (
          <Meta label={t.common.grind} value={String(session.grindSetting)} />
        ) : null}
      </View>

      {session.grinderNameSnapshot || session.notes ? (
        <View style={styles.footer}>
          {session.grinderNameSnapshot ? (
            <View style={styles.grinderTag}>
              <AppIcon name="disc" size={11} color={theme.textFaint} />
              <AppText variant="caption" tone="faint">
                {session.grinderNameSnapshot}
              </AppText>
            </View>
          ) : null}
          {session.notes ? (
            <AppText variant="caption" tone="faint" numberOfLines={1} style={styles.flex}>
              {session.notes}
            </AppText>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.meta}>
      <AppText variant="caption" tone="faint">
        {label}
      </AppText>
      <AppText variant="metricSmall" tabular>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  meta: { gap: 1 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  grinderTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flex: { flex: 1 },
});
