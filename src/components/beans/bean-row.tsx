import type { CoffeeBeanWithStats } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDateShort, formatRating } from '@/utils/formatting';
import { Ionicons } from '../common/icon';
import { AppText } from '../common/text';

interface BeanRowProps {
  bean: CoffeeBeanWithStats;
  onPress: () => void;
}

export function BeanRow({ bean, onPress }: BeanRowProps) {
  const theme = useTheme();
  const origin = [bean.region, bean.country].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${bean.name} coffee details`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      <View style={[styles.initial, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="h3" color={theme.primary}>
          {bean.name.trim().charAt(0).toUpperCase() || '?'}
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {bean.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {[origin, bean.process, bean.roastLevel].filter(Boolean).join(' · ')}
        </AppText>
        <AppText variant="caption" tone="faint">
          {bean.sessionCount === 0
            ? 'Not brewed yet'
            : `${bean.sessionCount} brew${bean.sessionCount === 1 ? '' : 's'} · last ${formatDateShort(
                bean.lastBrewedAt
              )}`}
        </AppText>
      </View>

      <View style={styles.trailing}>
        {bean.averageRating != null ? (
          <View style={styles.rating}>
            <Ionicons name="star" size={12} color={theme.gold} />
            <AppText variant="caption" tone="muted">
              {formatRating(bean.averageRating)}
            </AppText>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  initial: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
