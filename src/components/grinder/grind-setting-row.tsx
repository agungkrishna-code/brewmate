import { IconButton } from '@/components/common/button';
import { Ionicons } from '@/components/common/icon';
import { AppText } from '@/components/common/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GrinderProfile, GrindSettingDetail } from '@/types';
import { formatDateShort, formatRating } from '@/utils/formatting';
import { formatSetting, settingDetail } from '@/utils/grinder';
import { StyleSheet, View } from 'react-native';

interface GrindSettingRowProps {
  setting: GrindSettingDetail;
  grinder: GrinderProfile | undefined;
  onDelete: () => void;
  showGrinder?: boolean;
}

export function GrindSettingRow({
  setting,
  grinder,
  onDelete,
  showGrinder,
}: GrindSettingRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.settingBadge, { backgroundColor: theme.primarySoft }]}>
        <AppText variant="h3" color={theme.primary} style={styles.settingValue}>
          {setting.settingValue}
        </AppText>
        <AppText variant="caption" tone="faint" style={styles.unit}>
          {grinder ? (grinder.settingUnit === 'rotations' ? 'rot' : 'clicks') : ''}
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {setting.beanName ?? 'No coffee attached'}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {showGrinder ? `${setting.grinderName} · ` : ''}
          {grinder
            ? formatSetting(grinder, setting.settingValue)
            : `Setting ${setting.settingValue}`}
        </AppText>
        {grinder ? (
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {settingDetail(grinder, setting.settingValue)}
          </AppText>
        ) : null}
        {setting.notes ? (
          <AppText variant="caption" tone="muted" numberOfLines={2}>
            {setting.notes}
          </AppText>
        ) : null}
        <View style={styles.meta}>
          {setting.recipeName ? (
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={11} color={theme.textFaint} />
              <AppText variant="caption" tone="faint" numberOfLines={1}>
                {setting.recipeName}
              </AppText>
            </View>
          ) : null}
          {setting.lastRating != null ? (
            <View style={styles.metaItem}>
              <Ionicons name="star" size={11} color={theme.gold} />
              <AppText variant="caption" tone="faint">
                {formatRating(setting.lastRating)} tasting
              </AppText>
            </View>
          ) : null}
          {setting.lastBrewedAt ? (
            <AppText variant="caption" tone="faint">
              {formatDateShort(setting.lastBrewedAt)}
            </AppText>
          ) : null}
        </View>
      </View>

      <IconButton icon="trash-outline" label="Delete grind setting" size={32} onPress={onDelete} />
    </View>
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
  settingBadge: {
    width: 56,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 0,
  },
  settingValue: { fontSize: 17 },
  unit: { fontSize: 9.5 },
  body: { flex: 1, gap: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
});
