import type { BrewSessionDetail } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDuration, formatRatio, formatRating, formatWeight } from '@/utils/formatting';
import { Ionicons } from '../common/icon';
import { AppText } from '../common/text';

interface SessionCardProps {
  session: BrewSessionDetail;
  onPress: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export function SessionCard({ session, onPress, selected, selectionMode }: SessionCardProps) {
  const theme = useTheme();
  const title = session.beanNameSnapshot ?? session.recipeNameSnapshot ?? 'Brew session';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} brewed ${formatDate(session.brewedAt)}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: selected ? theme.gold : theme.border,
          borderWidth: selected ? 1.5 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {formatDate(session.brewedAt)}
            {session.recipeNameSnapshot && session.recipeNameSnapshot !== title
              ? ` · ${session.recipeNameSnapshot}`
              : ''}
          </AppText>
        </View>
        {selectionMode ? (
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={selected ? theme.gold : theme.borderStrong}
          />
        ) : session.averageRating != null ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={theme.gold} />
            <AppText variant="caption">{formatRating(session.averageRating)}</AppText>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
        )}
      </View>

      <View style={styles.metaRow}>
        <Meta label="Dose" value={formatWeight(session.coffeeDoseG, true)} />
        <Meta label="Ratio" value={formatRatio(session.ratio)} />
        <Meta label="Time" value={formatDuration(session.totalTimeS)} />
        {session.grindSetting != null ? (
          <Meta label="Grind" value={String(session.grindSetting)} />
        ) : null}
      </View>

      {session.grinderNameSnapshot || session.notes ? (
        <View style={styles.footer}>
          {session.grinderNameSnapshot ? (
            <View style={styles.grinderTag}>
              <Ionicons name="settings-outline" size={11} color={theme.textFaint} />
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
      <AppText variant="label" tone="faint" style={styles.metaLabel}>
        {label}
      </AppText>
      <AppText variant="caption">{value}</AppText>
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
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaRow: { flexDirection: 'row', gap: Spacing.lg },
  meta: { gap: 1 },
  metaLabel: { fontSize: 9.5 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  grinderTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  flex: { flex: 1 },
});
