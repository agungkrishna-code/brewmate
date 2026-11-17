import type { GrinderProfile, GrindSettingDetail } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { useHaptics } from '@/hooks/use-haptics';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import {
  formatSetting,
  preferredRangeLabel,
  referenceRangeLabel,
  settingDetail,
} from '@/utils/grinder';
import { AppIcon } from '../common/icon';
import { Badge, Divider } from '../common/section';
import { AppText } from '../common/text';

interface GrinderCardProps {
  grinder: GrinderProfile;
  lastSetting?: GrindSettingDetail | null;
  onPress: () => void;
}

export function GrinderCard({ grinder, lastSetting, onPress }: GrinderCardProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const reference = referenceRangeLabel(grinder, lang);
  const preferred = preferredRangeLabel(grinder, lang);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.grinder.cardA11y(grinder.name)}
      onPress={onPress}
      onPressIn={() => haptics.fire('selection')}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          opacity: pressed ? 0.88 : 1,
        },
      ]}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="caption" tone="faint">
            {grinder.brand}
          </AppText>
          <AppText variant="h2" style={styles.name}>
            {grinder.name}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </View>

      <AppText variant="caption" tone="muted" tabular>
        {t.grinder.cardSpecs(
          grinder.clicksPerRotation,
          (grinder.micronsPerClick / 1000).toFixed(3),
          grinder.macroStepsPerRotation
        )}
      </AppText>

      <Divider style={styles.divider} />

      {reference ? (
        <View style={styles.row}>
          <AppText variant="caption" tone="muted" style={styles.flex}>
            {t.grinder.publishedRefLabel}
          </AppText>
          <AppText variant="caption" tabular style={styles.value}>
            {reference}
          </AppText>
        </View>
      ) : null}
      <View style={styles.row}>
        <AppText variant="caption" tone="muted" style={styles.flex}>
          {t.grinder.workingRangeLabel}
        </AppText>
        <AppText variant="caption" tabular tone={preferred ? 'default' : 'faint'} style={styles.value}>
          {preferred ?? t.common.notSet}
        </AppText>
      </View>

      {lastSetting ? (
        <View
          style={[
            styles.lastSetting,
            { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
          ]}>
          <View style={styles.flex}>
            <AppText variant="caption" tone="muted">
              {t.grinder.lastSavedLabel}
            </AppText>
            <AppText variant="bodyStrong" tabular>
              {formatSetting(grinder, lastSetting.settingValue, lang)}
            </AppText>
            <AppText variant="caption" tone="faint" tabular>
              {settingDetail(grinder, lastSetting.settingValue, lang)}
            </AppText>
          </View>
          {lastSetting.beanName ? <Badge label={lastSetting.beanName} tone="accent" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  name: { marginTop: 1 },
  divider: { marginVertical: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lastSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.xs,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  flex: { flex: 1 },
});
