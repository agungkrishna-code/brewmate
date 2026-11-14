import { Button, IconButton } from '@/components/common/button';
import { EmptyState } from '@/components/common/empty-state';
import { NumberField, TextField } from '@/components/common/field';
import { StackScreen } from '@/components/common/screen';
import { DataRow, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { GrindSettingRow } from '@/components/grinder/grind-setting-row';
import { GrindSettingSheet } from '@/components/grinder/grind-setting-sheet';
import { DISCLAIMERS } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
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
  const db = useDatabase();
  const { preferences, setLastGrinderId } = useSettings();
  const { id } = useLocalSearchParams<{ id: string }>();
  const grinderId = typeof id === 'string' ? id : '';
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, reload } = useFocusedQuery(
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
      'Delete this grinder?',
      'Its saved grind settings will be removed too. Brew sessions keep their snapshots.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGrinder(db, data.grinder.id);
            if (preferences.lastGrinderId === data.grinder.id) {
              await setLastGrinderId(null);
            }
            router.back();
          },
        },
      ]
    );
  }, [data, db, preferences.lastGrinderId, setLastGrinderId]);

  const confirmDeleteSetting = useCallback(
    (settingId: string) => {
      Alert.alert('Delete grind setting?', 'This only removes the saved note.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGrindSetting(db, settingId);
            reload();
          },
        },
      ]);
    },
    [db, reload]
  );

  if (!data) {
    return (
      <StackScreen title="Grinder">
        <EmptyState
          icon="alert-circle-outline"
          title="Grinder not found"
          description="It may have been deleted."
          actionLabel="Back to grinders"
          onAction={() => router.replace('/grinder')}
        />
      </StackScreen>
    );
  }

  const { grinder, settings, beans, recipes, grinders } = data;
  const published = referenceRangeLabel(grinder);

  return (
    <StackScreen
      title={grinder.name}
      subtitle={`${grinder.brand} · ${grinder.clicksPerRotation} clicks per rotation`}
      right={
        grinder.isBuiltin ? (
          <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
            <AppText variant="caption" color={theme.primary}>
              Built-in
            </AppText>
          </View>
        ) : (
          <IconButton icon="trash-outline" label="Delete grinder" onPress={confirmDeleteGrinder} />
        )
      }>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <DataRow label="Adjustment per click" value={`${grinder.micronsPerClick} µm`} emphasis />
        <DataRow label="Clicks per rotation" value={String(grinder.clicksPerRotation)} emphasis />
        {grinder.macroStepsPerRotation ? (
          <DataRow
            label="Macro steps per rotation"
            value={String(grinder.macroStepsPerRotation)}
          />
        ) : null}
        <DataRow
          label="Setting unit"
          value={grinder.settingUnit === 'rotations' ? 'Dial rotations' : 'Clicks from zero'}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Published reference" />
        <View style={[styles.note, { backgroundColor: theme.goldSoft }]}>
          <AppText variant="bodyStrong">{published ?? 'No published pour-over range'}</AppText>
          <AppText variant="small" tone="muted" style={styles.noteText}>
            {grinder.referenceNote ??
              'This model has no manufacturer pour-over reference. Use your own notes to build a range.'}
          </AppText>
        </View>
      </View>

      <CalibrationForm grinder={grinder} onSaved={reload} />

      <View style={styles.section}>
        <SectionHeader
          title="Saved settings"
          subtitle={`${settings.length} recorded`}
          actionLabel="Add"
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
            icon="bookmark-outline"
            title="Nothing saved yet"
            description="Save the setting you used for a coffee and it will show up here."
            actionLabel="Save a setting"
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

/**
 * The editable calibration block. It mounts with the loaded grinder, so its
 * local state starts from the database without an effect that writes state.
 */
function CalibrationForm({
  grinder,
  onSaved,
}: {
  grinder: GrinderProfile;
  onSaved: () => void;
}) {
  const db = useDatabase();
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
    const errors = validateGrinder(draft);
    if (errors.preferredRange) {
      setRangeError(errors.preferredRange);
      return;
    }
    setRangeError(null);
    setSaving(true);
    try {
      await updateGrinder(db, grinder.id, draft);
      setSavedFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1800);
      onSaved();
    } catch (caught) {
      Alert.alert(
        'Could not save',
        caught instanceof Error ? caught.message : 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Your calibration"
        subtitle="A working range in this grinder's own units"
      />
      <View style={styles.rangeRow}>
        <NumberField
          label="From"
          value={preferredMin}
          onChange={setPreferredMin}
          suffix={unitLabel(grinder, preferredMin)}
          step={0.5}
          min={0}
          decimals={2}
          placeholder="–"
          error={rangeError ?? undefined}
          style={styles.flex}
        />
        <NumberField
          label="To"
          value={preferredMax}
          onChange={setPreferredMax}
          suffix={unitLabel(grinder, preferredMax)}
          step={0.5}
          min={0}
          decimals={2}
          placeholder="–"
          style={styles.flex}
        />
      </View>
      <View style={styles.gap} />
      <TextField
        label="Calibration notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Zero point, burr touch, anything you learned"
        multiline
        maxLength={400}
      />
      <View style={styles.saveRow}>
        <Button
          label={savedFlash ? 'Saved' : 'Save calibration'}
          icon={savedFlash ? 'checkmark' : 'save-outline'}
          variant="secondary"
          onPress={save}
          loading={saving}
        />
        <AppText variant="caption" tone="faint">
          {DISCLAIMERS.grinder}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.md,
  },
  section: { marginTop: Spacing.xxl },
  note: { borderRadius: Radius.md, padding: Spacing.lg, gap: Spacing.xs },
  noteText: { marginTop: 2 },
  rangeRow: { flexDirection: 'row', gap: Spacing.md },
  gap: { height: Spacing.md },
  saveRow: { marginTop: Spacing.md, gap: Spacing.sm, alignItems: 'flex-start' },
  list: { gap: Spacing.sm },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill },
  flex: { flex: 1 },
});
