import type { GrinderProfile, GrindSettingDetail } from '@/types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  formatSetting,
  preferredRangeLabel,
  referenceRangeLabel,
  settingDetail,
} from '@/utils/grinder';
import { Ionicons } from '../common/icon';
import { Badge, Divider } from '../common/section';
import { AppText } from '../common/text';

interface GrinderCardProps {
  grinder: GrinderProfile;
  lastSetting?: GrindSettingDetail | null;
  onPress: () => void;
}

export function GrinderCard({ grinder, lastSetting, onPress }: GrinderCardProps) {
  const theme = useTheme();
  const reference = referenceRangeLabel(grinder);
  const preferred = preferredRangeLabel(grinder);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${grinder.name} grinder settings`}
      onPress={onPress}
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
          <AppText variant="label" tone="faint">
            {grinder.brand}
          </AppText>
          <AppText variant="h2" style={styles.name}>
            {grinder.name}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
      </View>

      <View style={styles.specRow}>
        <AppText variant="caption" tone="muted">
          {grinder.clicksPerRotation} clicks/rotation · {(grinder.micronsPerClick / 1000).toFixed(3)}{' '}
          mm/click
          {grinder.macroStepsPerRotation ? ` · ${grinder.macroStepsPerRotation} macro steps` : ''}
        </AppText>
      </View>

      <Divider style={styles.divider} />

      {reference ? (
        <View style={styles.row}>
          <AppText variant="caption" tone="muted" style={styles.flex}>
            Published pour-over reference
          </AppText>
          <AppText variant="caption" style={styles.value}>
            {reference}
          </AppText>
        </View>
      ) : null}
      <View style={styles.row}>
        <AppText variant="caption" tone="muted" style={styles.flex}>
          Your working range
        </AppText>
        <AppText variant="caption" tone={preferred ? 'default' : 'faint'} style={styles.value}>
          {preferred ?? 'Not set yet'}
        </AppText>
      </View>

      {lastSetting ? (
        <View style={[styles.lastSetting, { backgroundColor: theme.surfaceSunken }]}>
          <View style={styles.flex}>
            <AppText variant="caption" tone="muted">
              Last saved setting
            </AppText>
            <AppText variant="bodyStrong">{formatSetting(grinder, lastSetting.settingValue)}</AppText>
            <AppText variant="caption" tone="faint">
              {settingDetail(grinder, lastSetting.settingValue)}
            </AppText>
          </View>
          {lastSetting.beanName ? <Badge label={lastSetting.beanName} tone="gold" /> : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  name: { marginTop: 2 },
  specRow: { marginTop: -2 },
  divider: { marginVertical: Spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  lastSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  value: { flexShrink: 1, textAlign: 'right' },
  flex: { flex: 1 },
});
