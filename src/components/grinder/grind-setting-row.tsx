import { IconButton } from '@/components/common/button';
import { AppIcon } from '@/components/common/icon';
import { AppText } from '@/components/common/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
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
  const { lang, t } = useTranslation();

  return (
    <View
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View
        style={[
          styles.settingBadge,
          { backgroundColor: theme.accentSoft, borderColor: theme.border },
        ]}>
        <AppText variant="metric" color={theme.accent} style={styles.settingValue}>
          {setting.settingValue}
        </AppText>
        <AppText variant="caption" tone="muted" style={styles.unit}>
          {grinder
            ? grinder.settingUnit === 'rotations'
              ? t.grinder.rotUnitShort
              : t.grinder.clicksUnitShort
            : ''}
        </AppText>
      </View>

      <View style={styles.body}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {setting.beanName ?? t.grinder.noCoffeeAttached}
        </AppText>
        <AppText variant="caption" tone="muted" tabular numberOfLines={1}>
          {showGrinder ? `${setting.grinderName} · ` : ''}
          {grinder
            ? formatSetting(grinder, setting.settingValue, lang)
            : t.grinder.settingFallback(setting.settingValue)}
        </AppText>
        {grinder ? (
          <AppText variant="caption" tone="faint" tabular numberOfLines={1}>
            {settingDetail(grinder, setting.settingValue, lang)}
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
              <AppIcon name="book-open" size={11} color={theme.textFaint} />
              <AppText variant="caption" tone="faint" numberOfLines={1}>
                {setting.recipeName}
              </AppText>
            </View>
          ) : null}
          {setting.lastRating != null ? (
            <View style={styles.metaItem}>
              <AppIcon name="star" size={11} color={theme.accent} filled />
              <AppText variant="caption" tone="faint" tabular>
                {t.grinder.tastingSuffix(formatRating(setting.lastRating))}
              </AppText>
            </View>
          ) : null}
          {setting.lastBrewedAt ? (
            <AppText variant="caption" tone="faint" tabular>
              {formatDateShort(setting.lastBrewedAt, lang)}
            </AppText>
          ) : null}
        </View>
      </View>

      <IconButton
        icon="trash"
        label={t.grinder.deleteSettingA11y}
        variant="plain"
        color={theme.textMuted}
        size={44}
        onPress={onDelete}
        // Opens a confirmation; the heavy thud lands on the confirmed delete.
      />
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
    borderWidth: 1,
  },
  settingBadge: {
    width: 58,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    gap: 0,
  },
  settingValue: { fontSize: 18, lineHeight: 22 },
  unit: { fontSize: 10 },
  body: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap', marginTop: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
