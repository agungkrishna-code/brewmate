import { IconButton } from '@/components/common/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { GrinderCard } from '@/components/grinder/grinder-card';
import { GrindSettingRow } from '@/components/grinder/grind-setting-row';
import { GrindSettingSheet } from '@/components/grinder/grind-setting-sheet';
import { getDisclaimers } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { deleteGrindSetting, listGrindSettings, listGrinders } from '@/services/grinders';
import { listRecipeSummaries } from '@/services/recipes';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

export default function GrinderScreen() {
  const db = useDatabase();
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, loading, error, reload } = useFocusedQuery(async (database) => {
    const [grinders, settings, beans, recipes] = await Promise.all([
      listGrinders(database),
      listGrindSettings(database),
      listBeans(database),
      listRecipeSummaries(database),
    ]);
    return { grinders, settings, beans, recipes };
  });

  const grinders = useMemo(() => data?.grinders ?? [], [data]);
  const settings = useMemo(() => data?.settings ?? [], [data]);

  const lastByGrinder = useMemo(() => {
    const map = new Map<string, (typeof settings)[number]>();
    for (const setting of settings) {
      if (!map.has(setting.grinderProfileId)) map.set(setting.grinderProfileId, setting);
    }
    return map;
  }, [settings]);

  const confirmDelete = (id: string) => {
    Alert.alert(t.grinder.deleteSettingTitle, t.grinder.deleteSettingMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          // Confirmation of a destructive action: the delete only lands
          // here, after the user has confirmed the alert.
          haptics.fire('heavy');
          await deleteGrindSetting(db, id);
          reload();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <AppText variant="display">{t.grinder.title}</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            {t.grinder.subtitle}
          </AppText>
        </View>
        <IconButton
          icon="plus"
          label={t.grinder.addCustomA11y}
          variant="accent"
          onPress={() => router.push('/grinders/new')}
        />
      </View>

      {error && !data ? (
        <View style={styles.section}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      ) : loading && !data ? (
        <LoadingState label={t.grinder.loading} />
      ) : (
        <>
          <View style={styles.cards}>
            {grinders.map((grinder) => (
              <GrinderCard
                key={grinder.id}
                grinder={grinder}
                lastSetting={lastByGrinder.get(grinder.id) ?? null}
                onPress={() => router.push(`/grinders/${grinder.id}`)}
              />
            ))}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title={t.grinder.savedSettings}
              subtitle={t.grinder.savedSettingsSub}
              actionLabel={t.common.add}
              onAction={() => setSheetOpen(true)}
            />
            {settings.length > 0 ? (
              <View style={styles.list}>
                {settings.map((setting) => (
                  <GrindSettingRow
                    key={setting.id}
                    setting={setting}
                    grinder={grinders.find((item) => item.id === setting.grinderProfileId)}
                    onDelete={() => confirmDelete(setting.id)}
                    showGrinder
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                compact
                icon="bookmark"
                title={t.grinder.nothingSavedTitle}
                description={t.grinder.nothingSavedDesc}
                actionLabel={t.common.save}
                onAction={() => setSheetOpen(true)}
              />
            )}
          </View>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.grinder.guideA11y}
        onPress={() => router.push('/guide/grinder-calibration')}
        onPressIn={() => haptics.fire('selection')}
        style={({ pressed }) => [
          styles.guideLink,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <AppIcon name="book-open" size={17} color={theme.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t.grinder.guideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.grinder.guideSub}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>

      <AppText variant="caption" tone="faint" style={styles.disclaimer}>
        {disclaimers.grinder}
      </AppText>

      <GrindSettingSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={reload}
        grinders={grinders}
        beans={data?.beans ?? []}
        recipes={data?.recipes ?? []}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  subtitle: { marginTop: Spacing.xs },
  cards: { gap: Spacing.md, marginTop: Spacing.xl },
  section: { marginTop: Spacing.xxl },
  list: { gap: Spacing.sm },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  disclaimer: { marginTop: Spacing.lg },
  flex: { flex: 1 },
});
