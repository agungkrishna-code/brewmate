import type { CoffeeBeanWithStats } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { useHaptics } from '@/hooks/use-haptics';
import { localizeProcessMethod, localizeRoastLevel } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort, formatRating, formatRoastDate } from '@/utils/formatting';
import { AppIcon } from '../common/icon';
import { AppText } from '../common/text';

interface BeanRowProps {
  bean: CoffeeBeanWithStats;
  onPress: () => void;
}

export function BeanRow({ bean, onPress }: BeanRowProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const origin = bean.origin || [bean.region, bean.country].filter(Boolean).join(', ');
  const brewMeta =
    bean.sessionCount === 0
      ? t.beans.notBrewedYet
      : t.beans.brewMeta(bean.sessionCount, formatDateShort(bean.lastBrewedAt, lang));
  const roastMeta = bean.roastDate
    ? t.beans.roastedPrefix(formatRoastDate(bean.roastDate, lang))
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.beans.rowA11y(bean.name)}
      onPress={onPress}
      onPressIn={() => haptics.fire('selection')}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View
        style={[
          styles.initial,
          { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
        ]}>
        <AppText variant="h3" color={theme.text}>
          {bean.name.trim().charAt(0).toUpperCase() || '?'}
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {bean.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {[
            origin,
            localizeProcessMethod(bean.process, lang),
            localizeRoastLevel(bean.roastLevel, lang),
          ]
            .filter(Boolean)
            .join(' · ') || t.beans.coffeeBagFallback}
        </AppText>
        <AppText variant="caption" tone="faint" tabular numberOfLines={1}>
          {[brewMeta, roastMeta].filter(Boolean).join(' · ')}
        </AppText>
      </View>

      <View style={styles.trailing}>
        {bean.averageRating != null ? (
          <View style={styles.rating}>
            <AppIcon name="star" size={12} color={theme.accent} filled />
            <AppText variant="metricSmall" tone="muted" tabular>
              {formatRating(bean.averageRating)}
            </AppText>
          </View>
        ) : null}
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  initial: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
