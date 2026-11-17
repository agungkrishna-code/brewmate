import { NumberField, SelectField, TextField } from '@/components/common/field';
import { BottomSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { Button } from '@/components/common/button';
import { AppIcon } from '@/components/common/icon';
import { localizeProcessMethod, localizeRoastLevel } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
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
  const haptics = useHaptics();
  const db = useDatabase();
  const { lang, t } = useTranslation();
  const { preferences, setLastGrinderId } = useSettings();

  const initialGrinder =
    fixedGrinderId ??
    grinders.find((item) => item.id === preferences.lastGrinderId)?.id ??
    grinders[0]?.id ??
    '';
  const [grinderId, setGrinderId] = useState(initialGrinder);
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
      haptics.error();
      setError(t.grinder.sheetChooseGrinderErr);
      return;
    }
    if (setting == null || setting <= 0) {
      haptics.error();
      setError(t.grinder.sheetEnterSettingErr);
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
      await setLastGrinderId(grinder.id);
      // Saved: confirm with the success pulse, not the button tap.
      haptics.success();
      onSaved();
      onClose();
    } catch (caught) {
      haptics.error();
      setError(caught instanceof Error ? caught.message : t.grinder.sheetSaveErr);
    } finally {
      setSaving(false);
    }
  };

  const options: { label: string; value: string; detail?: string }[] =
    picker === 'grinder'
      ? grinders.map((item) => ({
          label: item.name,
          value: item.id,
          detail: t.brew.clicksPerRotation(item.clicksPerRotation),
        }))
      : picker === 'bean'
        ? [
            { label: t.grinder.noCoffee, value: 'none', detail: t.grinder.noCoffeeDetail },
            ...beans.map((item) => ({
              label: item.name,
              value: item.id,
              detail: [
                localizeProcessMethod(item.process, lang),
                localizeRoastLevel(item.roastLevel, lang),
              ]
                .filter(Boolean)
                .join(' · '),
            })),
          ]
        : picker === 'recipe'
          ? [
              { label: t.grinder.noRecipe, value: 'none' },
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
  const publishedRef = grinder ? referenceRangeLabel(grinder, lang) : null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={picker ? t.grinder.sheetChooseTitle : t.grinder.sheetTitle}
      subtitle={picker ? undefined : t.grinder.sheetSub}
      footer={
        picker ? undefined : (
          <Button
            label={t.grinder.sheetSaveBtn}
            variant="accent"
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
            // Result feedback (success/error) comes from the save handler.
            haptic="none"
          />
        )
      }>
      {picker ? (
        <View style={styles.optionList}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
            hitSlop={6}
            onPress={() => setPicker(null)}
            onPressIn={() => haptics.fire('selection')}
            style={({ pressed }) => [styles.backRow, { opacity: pressed ? 0.6 : 1 }]}>
            <AppIcon name="chevron-left" size={16} color={theme.textMuted} />
            <AppText variant="small" tone="muted">
              {t.common.back}
            </AppText>
          </Pressable>
          {options.length === 0 ? (
            <AppText variant="small" tone="muted">
              {t.grinder.nothingToChoose}
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
                onPressIn={() => haptics.fire('selection')}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: selected ? theme.accentSoft : theme.surface,
                    borderColor: selected ? theme.accent : theme.border,
                    opacity: pressed ? 0.72 : 1,
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
                  <AppIcon name="check" size={18} color={theme.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.form}>
          <SelectField
            label={t.journal.grinder}
            value={grinder?.name ?? t.grinder.chooseGrinder}
            icon="disc"
            disabled={Boolean(fixedGrinderId)}
            onPress={() => setPicker('grinder')}
          />
          <NumberField
            label={t.brew.grindSetting}
            value={setting}
            onChange={setSetting}
            suffix={grinder ? unitLabel(grinder, setting, lang) : undefined}
            step={0.5}
            decimals={2}
            stepper
            placeholder={t.brew.grindPlaceholder}
            hint={
              grinder
                ? [
                    setting != null ? settingDetail(grinder, setting, lang) : null,
                    publishedRef ? t.grinder.publishedPrefix(publishedRef) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')
                : undefined
            }
          />
          <SelectField
            label={t.journal.coffee}
            value={bean?.name ?? t.grinder.noCoffee}
            icon="coffee"
            onPress={() => setPicker('bean')}
          />
          <SelectField
            label={t.tabs.recipes}
            value={recipe?.name ?? t.grinder.noRecipe}
            icon="book-open"
            onPress={() => setPicker('recipe')}
          />
          <TextField
            label={t.journal.notes}
            value={notes}
            onChangeText={setNotes}
            placeholder={t.grinder.sheetNotesPlaceholder}
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
    gap: 4,
    minHeight: 36,
    paddingBottom: Spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 52,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
