import { NumberField, SelectField, TextField } from '@/components/common/field';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { Button } from '@/components/common/button';
import { Ionicons } from '@/components/common/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { saveGrindSetting } from '@/services/grinders';
import type { BrewRecipeSummary, CoffeeBeanWithStats, GrinderProfile } from '@/types';
import { clicksForSetting, referenceRangeLabel, settingDetail, unitLabel } from '@/utils/grinder';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface GrindSettingSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  grinders: GrinderProfile[];
  beans: CoffeeBeanWithStats[];
  recipes: BrewRecipeSummary[];
  /** Locks the grinder when opened from a grinder detail screen. */
  fixedGrinderId?: string | null;
  initialBeanId?: string | null;
}

type PickerMode = 'grinder' | 'bean' | 'recipe' | null;

export function GrindSettingSheet(props: GrindSettingSheetProps) {
  // Mounting only while open lets the form start from fresh initial values
  // without an effect that writes state.
  if (!props.visible) return null;
  return <GrindSettingSheetBody {...props} />;
}

function GrindSettingSheetBody({
  visible,
  onClose,
  onSaved,
  grinders,
  beans,
  recipes,
  fixedGrinderId,
  initialBeanId,
}: GrindSettingSheetProps) {
  const theme = useTheme();
  const db = useDatabase();

  const [grinderId, setGrinderId] = useState(fixedGrinderId ?? grinders[0]?.id ?? '');
  const [setting, setSetting] = useState<number | null>(null);
  const [beanId, setBeanId] = useState<string | null>(initialBeanId ?? null);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [picker, setPicker] = useState<PickerMode>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grinder = grinders.find((item) => item.id === grinderId) ?? null;
  const bean = beans.find((item) => item.id === beanId) ?? null;
  const recipe = recipes.find((item) => item.id === recipeId) ?? null;

  const save = async () => {
    if (!grinder) {
      setError('Choose a grinder first.');
      return;
    }
    if (setting == null || setting <= 0) {
      setError('Enter the setting you used on the grinder.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveGrindSetting(db, {
        grinderProfileId: grinder.id,
        coffeeBeanId: beanId,
        recipeId,
        settingValue: setting,
        clicks: clicksForSetting(grinder, setting),
        notes: notes || null,
      });
      onSaved();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the setting.');
    } finally {
      setSaving(false);
    }
  };

  const options: { label: string; value: string; detail?: string }[] =
    picker === 'grinder'
      ? grinders.map((item) => ({
          label: item.name,
          value: item.id,
          detail: `${item.clicksPerRotation} clicks/rotation`,
        }))
      : picker === 'bean'
        ? [
            { label: 'No coffee', value: 'none', detail: 'Keep it generic' },
            ...beans.map((item) => ({
              label: item.name,
              value: item.id,
              detail: [item.process, item.roastLevel].filter(Boolean).join(' · '),
            })),
          ]
        : picker === 'recipe'
          ? [
              { label: 'No recipe', value: 'none' },
              ...recipes.map((item) => ({
                label: item.name,
                value: item.id,
                detail: `${item.coffeeDoseG} g · 1:${item.ratio}`,
              })),
            ]
          : [];

  const pick = (value: string) => {
    if (picker === 'grinder') {
      if (value !== grinderId) setSetting(null);
      setGrinderId(value);
    }
    if (picker === 'bean') setBeanId(value === 'none' ? null : value);
    if (picker === 'recipe') setRecipeId(value === 'none' ? null : value);
    setPicker(null);
  };

  const currentValue =
    picker === 'grinder' ? grinderId : picker === 'bean' ? (beanId ?? 'none') : (recipeId ?? 'none');

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={picker ? 'Choose' : 'Save a grind setting'}
      subtitle={
        picker
          ? undefined
          : 'Record what worked for a coffee, with no conversion between models.'
      }
      footer={
        picker ? undefined : (
          <Button
            label="Save setting"
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
          />
        )
      }>
      {picker ? (
        <View style={styles.optionList}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to the form"
            onPress={() => setPicker(null)}
            style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="chevron-back" size={16} color={theme.textMuted} />
            <AppText variant="small" tone="muted">
              Back
            </AppText>
          </Pressable>
          {options.length === 0 ? (
            <AppText variant="small" tone="muted">
              Nothing to choose yet.
            </AppText>
          ) : null}
          {options.map((option) => {
            const selected = option.value === currentValue;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => pick(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.primarySoft : theme.surface,
                    borderColor: selected ? theme.borderStrong : theme.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <View style={styles.flex}>
                  <AppText variant="bodyStrong">{option.label}</AppText>
                  {option.detail ? (
                    <AppText variant="caption" tone="muted">
                      {option.detail}
                    </AppText>
                  ) : null}
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.gold} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.form}>
          <SelectField
            label="Grinder"
            value={grinder?.name ?? 'Choose a grinder'}
            icon="disc-outline"
            onPress={() => setPicker('grinder')}
          />
          <NumberField
            label="Grind setting"
            value={setting}
            onChange={setSetting}
            suffix={grinder ? unitLabel(grinder, setting) : undefined}
            step={0.5}
            decimals={2}
            placeholder="e.g. 6.5"
            hint={
              grinder
                ? [
                    setting != null ? settingDetail(grinder, setting) : null,
                    referenceRangeLabel(grinder)
                      ? `Published: ${referenceRangeLabel(grinder)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
          />
          <SelectField
            label="Coffee"
            value={bean?.name ?? 'No coffee'}
            icon="cafe-outline"
            onPress={() => setPicker('bean')}
          />
          <SelectField
            label="Recipe"
            value={recipe?.name ?? 'No recipe'}
            icon="book-outline"
            onPress={() => setPicker('recipe')}
          />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. 2 clicks coarser than last time"
            multiline
            maxLength={300}
          />
          {error ? (
            <AppText variant="caption" tone="danger">
              {error}
            </AppText>
          ) : null}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.md },
  optionList: { gap: Spacing.sm },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingBottom: Spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
