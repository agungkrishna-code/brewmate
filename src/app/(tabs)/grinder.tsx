import { Button, IconButton } from '@/components/common/button';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { GrinderCard } from '@/components/grinder/grinder-card';
import { GrindSettingRow } from '@/components/grinder/grind-setting-row';
import { GrindSettingSheet } from '@/components/grinder/grind-setting-sheet';
import { DISCLAIMERS } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { deleteGrindSetting, listGrindSettings, listGrinders } from '@/services/grinders';
import { listRecipeSummaries } from '@/services/recipes';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function GrinderScreen() {
  const db = useDatabase();
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, reload } = useFocusedQuery(async (database) => {
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
    Alert.alert('Delete grind setting?', 'This only removes the saved note.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
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
          <AppText variant="display">Grinder</AppText>
          <AppText variant="small" tone="muted" style={styles.subtitle}>
            Two models, two click systems, zero guesswork.
          </AppText>
        </View>
        <IconButton
          icon="add"
          label="Add a custom grinder"
          variant="inverse"
          onPress={() => router.push('/grinders/new')}
        />
      </View>

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
          title="Saved grind settings"
          subtitle="Bean by bean, in each grinder's own units"
          actionLabel="Add"
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
            icon="compass-outline"
            title="No settings recorded"
            description="Save the setting you used for a coffee so the next cup starts from somewhere real."
            actionLabel="Save a setting"
            onAction={() => setSheetOpen(true)}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Dialing in"
          subtitle="One change at a time"
          actionLabel="Guide"
          onAction={() => router.push('/guide/grinder-calibration')}
        />
        <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TipRow
            label="1. Start in range"
            text="Use the published window if the model has one. If not, start in the middle of what feels medium-fine and adjust from there."
          />
          <TipRow
            label="2. Change one click"
            text="Sour and thin means finer. Bitter and dry means coarser. Keep dose, water and temperature fixed."
          />
          <TipRow
            label="3. Record the window"
            text="Save the low and high ends for each coffee. A click on the S5 Pro is 15 microns; on the C5 Pro it is 31 microns."
          />
        </View>
      </View>

      <View style={styles.section}>
        <Button
          label="Add a custom grinder"
          icon="add-circle-outline"
          variant="secondary"
          onPress={() => router.push('/grinders/new')}
          fullWidth
        />
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {DISCLAIMERS.grinder}
        </AppText>
      </View>

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

function TipRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <AppText variant="caption" tone="faint">
        {label}
      </AppText>
      <AppText variant="small">{text}</AppText>
    </View>
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
  tipCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipRow: { gap: 2 },
  disclaimer: { marginTop: Spacing.md },
  flex: { flex: 1 },
});
