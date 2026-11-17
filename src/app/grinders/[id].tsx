import { Button, IconButton } from '@/components/common/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { NumberField, TextField } from '@/components/common/field';
import { StackScreen } from '@/components/common/screen';
import { Badge, DataRow, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { GrindSettingRow } from '@/components/grinder/grind-setting-row';
import { GrindSettingSheet } from '@/components/grinder/grind-setting-sheet';
import { getDisclaimers, localizeGrinderReferenceNote } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import {
  deleteGrinder,
  deleteGrindSetting,
  getGrinder,
  listGrindSettings,
  listGrinders,
  updateGrinder,
} from '@/services/grinders';
import { listRecipeSummaries } from '@/services/recipes';
import type { GrinderDraft, GrinderProfile } from '@/types';
import { referenceRangeLabel, unitLabel } from '@/utils/grinder';
import { validateGrinder } from '@/utils/validation';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

export default function GrinderDetailScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const db = useDatabase();
  const { lang, t } = useTranslation();
  const { preferences, setLastGrinderId } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const grinderId = typeof id === 'string' ? id : '';
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, loading, error, reload } = useFocusedQuery(
    async (database) => {
      const grinder = grinderId ? await getGrinder(database, grinderId) : null;
      if (!grinder) return null;
      const [settings, beans, recipes, grinders] = await Promise.all([
        listGrindSettings(database, grinder.id),
        listBeans(database),
        listRecipeSummaries(database),
        listGrinders(database),
      ]);
      return { grinder, settings, beans, recipes, grinders };
    },
    grinderId
  );

  const confirmDeleteGrinder = useCallback(() => {
    if (!data) return;
    Alert.alert(
      t.grinder.deleteGrinderTitle,
      t.grinder.deleteGrinderMsg,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            haptics.fire('heavy');
            await deleteGrinder(db, data.grinder.id);
            if (preferences.lastGrinderId === data.grinder.id) {
              await setLastGrinderId(null);
            }
            router.back();
          },
        },
      ]
    );
  }, [data, db, haptics, preferences.lastGrinderId, setLastGrinderId, t]);

  const confirmDeleteSetting = useCallback(
    (settingId: string) => {
      Alert.alert(t.grinder.deleteSettingTitle, t.grinder.deleteSettingMsg, [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.common.delete,
          style: 'destructive',
          onPress: async () => {
            haptics.fire('heavy');
            await deleteGrindSetting(db, settingId);
            reload();
          },
        },
      ]);
    },
    [db, haptics, reload, t]
  );

  if (loading && !data) {
    return (
      <StackScreen title={t.grinder.title}>
        <LoadingState label={t.grinder.loadingSingle} />
      </StackScreen>
    );
  }

  if (error && !data) {
    return (
      <StackScreen title={t.grinder.title}>
        <ErrorState message={error} onRetry={reload} />
      </StackScreen>
    );
  }

  if (!data) {
    return (
      <StackScreen title={t.grinder.title}>
        <EmptyState
          icon="alert-circle"
          title={t.grinder.notFoundTitle}
          description={t.grinder.notFoundDesc}
          actionLabel={t.grinder.backToGrinders}
          onAction={() => router.replace('/grinder')}
        />
      </StackScreen>
    );
  }

  const { grinder, settings, beans, recipes, grinders } = data;
  const published = referenceRangeLabel(grinder, lang);
  const referenceNote = localizeGrinderReferenceNote(grinder, lang);

  return (
    <StackScreen
      title={grinder.name}
      subtitle={`${grinder.brand} · ${t.grinder.clicksPerRotationSub(grinder.clicksPerRotation)}`}
      right={
        grinder.isBuiltin ? (
          <Badge label={t.grinder.builtInBadge} />
        ) : (
          <IconButton
            icon="trash"
            label={t.grinder.deleteGrinderA11y}
            onPress={confirmDeleteGrinder}
            // Heavy thud lands on the confirmed delete inside the alert.
          />
        )
      }>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <DataRow label={t.grinder.adjustmentPerClick} tabular value={`${grinder.micronsPerClick} µm`} emphasis />
        <DataRow label={t.grinder.clicksPerRotation} tabular value={String(grinder.clicksPerRotation)} emphasis />
        {grinder.macroStepsPerRotation ? (
          <DataRow
            label={t.grinder.macroStepsPerRotation}
            tabular
            value={String(grinder.macroStepsPerRotation)}
          />
        ) : null}
        <DataRow
          label={t.grinder.settingUnit}
          last
          value={
            grinder.settingUnit === 'rotations'
              ? t.grinder.dialRotations
              : t.grinder.clicksFromZero
          }
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.grinder.publishedRefSection} />
        <View
          style={[
            styles.note,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          <AppText variant="bodyStrong" tabular>
            {published ?? t.grinder.noPublishedRange}
          </AppText>
          <AppText variant="small" tone="muted" style={styles.noteText}>
            {referenceNote ?? t.grinder.noPublishedNote}
          </AppText>
        </View>
      </View>

      <CalibrationForm grinder={grinder} onSaved={reload} />

      <View style={styles.section}>
        <SectionHeader
          title={t.grinder.savedSettings}
          subtitle={t.grinder.savedSettingsCount(settings.length)}
          actionLabel={t.common.add}
          onAction={() => setSheetOpen(true)}
        />
        {settings.length > 0 ? (
          <View style={styles.list}>
            {settings.map((setting) => (
              <GrindSettingRow
                key={setting.id}
                setting={setting}
                grinder={grinder}
                onDelete={() => confirmDeleteSetting(setting.id)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            compact
            icon="bookmark"
            title={t.grinder.nothingSavedYet}
            description={t.grinder.nothingSavedDesc}
            actionLabel={t.grinder.saveSettingBtn}
            onAction={() => setSheetOpen(true)}
          />
        )}
      </View>

      <GrindSettingSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={reload}
        grinders={grinders}
        fixedGrinderId={grinder.id}
        beans={beans}
        recipes={recipes}
      />
    </StackScreen>
  );
}

function CalibrationForm({
  grinder,
  onSaved,
}: {
  grinder: GrinderProfile;
  onSaved: () => void;
}) {
  const db = useDatabase();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);
  const [preferredMin, setPreferredMin] = useState<number | null>(grinder.preferredMin);
  const [preferredMax, setPreferredMax] = useState<number | null>(grinder.preferredMax);
  const [notes, setNotes] = useState(grinder.notes ?? '');
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const save = async () => {
    const draft: GrinderDraft = {
      name: grinder.name,
      brand: grinder.brand,
      model: grinder.model,
      clicksPerRotation: grinder.clicksPerRotation,
      settingUnit: grinder.settingUnit,
      micronsPerClick: grinder.micronsPerClick,
      macroStepsPerRotation: grinder.macroStepsPerRotation,
      referenceMin: grinder.referenceMin,
      referenceMax: grinder.referenceMax,
      referenceNote: grinder.referenceNote,
      preferredMin,
      preferredMax,
      notes: notes.trim() || null,
    };
    const errors = validateGrinder(draft, lang);
    if (errors.preferredRange) {
      haptics.error();
      setRangeError(errors.preferredRange);
      return;
    }
    setRangeError(null);
    setSaving(true);
    try {
      await updateGrinder(db, grinder.id, draft);
      haptics.success();
      setSavedFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1800);
      onSaved();
    } catch (caught) {
      haptics.error();
      Alert.alert(
        t.grinder.saveError,
        caught instanceof Error ? caught.message : t.timer.tryAgain
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title={t.grinder.yourCalibration}
        subtitle={t.grinder.yourCalibrationSub}
      />
      <View style={styles.rangeRow}>
        <NumberField
          label={t.grinder.from}
          value={preferredMin}
          onChange={setPreferredMin}
          suffix={unitLabel(grinder, preferredMin, lang)}
          step={0.5}
          min={0}
          decimals={2}
          stepper
          allowEmpty
          placeholder="–"
          error={rangeError ?? undefined}
          style={styles.flex}
        />
        <NumberField
          label={t.grinder.to}
          value={preferredMax}
          onChange={setPreferredMax}
          suffix={unitLabel(grinder, preferredMax, lang)}
          step={0.5}
          min={0}
          decimals={2}
          stepper
          allowEmpty
          placeholder="–"
          style={styles.flex}
        />
      </View>
      <View style={styles.gap} />
      <TextField
        label={t.grinder.calibrationNotes}
        value={notes}
        onChangeText={setNotes}
        placeholder={t.grinder.calibrationNotesPlaceholder}
        multiline
        maxLength={400}
      />
      <View style={styles.saveRow}>
        <Button
          label={savedFlash ? t.common.saved : t.grinder.saveCalibration}
          icon={savedFlash ? 'check' : 'save'}
          variant="secondary"
          onPress={save}
          loading={saving}
          // Result feedback comes from the save handler.
          haptic="none"
        />
        <AppText variant="caption" tone="faint">
          {disclaimers.grinder}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  section: { marginTop: Spacing.xxl },
  note: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  noteText: { marginTop: 2 },
  rangeRow: { flexDirection: 'row', gap: Spacing.md },
  gap: { height: Spacing.md },
  saveRow: { marginTop: Spacing.md, gap: Spacing.sm, alignItems: 'flex-start' },
  list: { gap: Spacing.sm },
  flex: { flex: 1 },
});
