import { Button } from '@/components/common/button';
import { SelectField, SwitchRow, TextField } from '@/components/common/field';
import { Chip, ChipRow } from '@/components/common/chip';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import {
  PROCESS_METHODS,
  ROAST_LEVELS,
  localizeProcessMethod,
  localizeRoastLevel,
} from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { createBean, deleteBean, setBeanArchived, updateBean } from '@/services/beans';
import type { CoffeeBeanWithStats, ProcessMethod, RoastLevel } from '@/types';
import { formatRoastDate, parseIsoDateOnly, todayIsoDate } from '@/utils/formatting';
import {
  validateBean,
  type BeanErrorKey,
  type ValidationErrors,
} from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

interface BeanFormProps {
  initialBean?: CoffeeBeanWithStats | null;
}

export function BeanForm({ initialBean }: BeanFormProps) {
  const theme = useTheme();
  const db = useDatabase();
  const { lang, t } = useTranslation();

  const [name, setName] = useState(initialBean?.name ?? '');
  const [origin, setOrigin] = useState(initialBean?.origin ?? '');
  const [country, setCountry] = useState(initialBean?.country ?? '');
  const [region, setRegion] = useState(initialBean?.region ?? '');
  const [farm, setFarm] = useState(initialBean?.farm ?? '');
  const [variety, setVariety] = useState(initialBean?.variety ?? '');
  const [process, setProcess] = useState<ProcessMethod>(initialBean?.process ?? 'Washed');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>(initialBean?.roastLevel ?? 'Light');
  const [roastDate, setRoastDate] = useState(initialBean?.roastDate ?? '');
  const [tastingNotes, setTastingNotes] = useState(initialBean?.tastingNotes ?? '');
  const [notes, setNotes] = useState(initialBean?.notes ?? '');
  const [archived, setArchived] = useState(initialBean?.isArchived ?? false);
  const [processSheet, setProcessSheet] = useState(false);
  const [roastSheet, setRoastSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationErrors<BeanErrorKey>>({});
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialBean);

  const save = async () => {
    const draft = {
      name,
      origin,
      country,
      region,
      farm,
      variety,
      process,
      roastLevel,
      roastDate: roastDate.trim() || null,
      tastingNotes,
      notes,
    };
    const errors = validateBean(draft, lang);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      setError(Object.values(errors).filter(Boolean).join(' '));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (initialBean) {
        await updateBean(db, initialBean.id, draft);
        if (archived !== initialBean.isArchived) {
          await setBeanArchived(db, initialBean.id, archived);
        }
        router.back();
      } else {
        await createBean(db, draft);
        router.back();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t.beans.saveError);
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!initialBean) return;
    Alert.alert(t.beans.deleteTitle, t.beans.deleteMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete,
        style: 'destructive',
        onPress: async () => {
          await deleteBean(db, initialBean.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <StackScreen
      title={isEditing ? t.beans.editTitle : t.beans.newTitle}
      subtitle={isEditing ? initialBean?.name : t.beans.newSubtitle}
      footer={
        <View style={[styles.footer, { backgroundColor: theme.bg, borderTopColor: theme.border }]}>
          <Button
            label={isEditing ? t.beans.saveChanges : t.beans.addCoffeeBtn}
            variant="accent"
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      }>
      {error ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}>
          <AppText variant="small" tone="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <TextField
        label={t.beans.coffeeName}
        value={name}
        onChangeText={setName}
        placeholder={t.beans.coffeeNamePlaceholder}
        error={fieldErrors.name}
        required
        maxLength={80}
      />

      <View style={styles.section}>
        <SectionHeader title={t.beans.originSection} subtitle={t.beans.originSectionSub} />
        <View style={styles.row}>
          <TextField
            label={t.beans.country}
            value={country}
            onChangeText={setCountry}
            placeholder={t.beans.countryPlaceholder}
            style={styles.flex}
            maxLength={50}
          />
          <TextField
            label={t.beans.region}
            value={region}
            onChangeText={setRegion}
            placeholder={t.beans.regionPlaceholder}
            style={styles.flex}
            maxLength={50}
          />
        </View>
        <View style={styles.gap} />
        <View style={styles.row}>
          <TextField
            label={t.beans.farm}
            value={farm}
            onChangeText={setFarm}
            placeholder={t.common.optional}
            style={styles.flex}
            maxLength={60}
          />
          <TextField
            label={t.beans.variety}
            value={variety}
            onChangeText={setVariety}
            placeholder={t.beans.varietyPlaceholder}
            style={styles.flex}
            maxLength={60}
          />
        </View>
        <View style={styles.gap} />
        <TextField
          label={t.beans.originLabel}
          value={origin}
          onChangeText={setOrigin}
          placeholder={t.beans.originPlaceholder}
          hint={t.beans.originHint}
          maxLength={80}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.beans.processingSection} />
        <SelectField
          label={t.beans.processingMethod}
          value={localizeProcessMethod(process, lang)}
          icon="droplets"
          onPress={() => setProcessSheet(true)}
        />
        <View style={styles.gap} />
        <SelectField
          label={t.beans.roastLevel}
          value={localizeRoastLevel(roastLevel, lang)}
          icon="flame"
          onPress={() => setRoastSheet(true)}
        />
        <View style={styles.gap} />
        <TextField
          label={t.beans.roastDate}
          value={roastDate}
          onChangeText={setRoastDate}
          placeholder={t.beans.roastDatePlaceholder}
          keyboardType="numbers-and-punctuation"
          error={fieldErrors.roastDate}
          hint={
            roastDate.trim() && parseIsoDateOnly(roastDate.trim())
              ? t.beans.roastedPrefix(formatRoastDate(roastDate.trim(), lang))
              : t.beans.roastDateHint
          }
          maxLength={10}
        />
        <ChipRow>
          <Chip label={t.common.today} onPress={() => setRoastDate(todayIsoDate())} />
          {roastDate ? <Chip label={t.common.clear} icon="close" onPress={() => setRoastDate('')} /> : null}
        </ChipRow>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.beans.tasteSection} />
        <TextField
          label={t.beans.tastingNotes}
          value={tastingNotes}
          onChangeText={setTastingNotes}
          placeholder={t.beans.tastingNotesPlaceholder}
          multiline
          maxLength={400}
        />
        <View style={styles.gap} />
        <TextField
          label={t.beans.personalNotes}
          value={notes}
          onChangeText={setNotes}
          placeholder={t.beans.personalNotesPlaceholder}
          multiline
          maxLength={600}
        />
      </View>

      {isEditing ? (
        <View style={styles.section}>
          <SectionHeader title={t.beans.manageSection} />
          <SwitchRow
            label={t.beans.archiveLabel}
            description={t.beans.archiveDesc}
            value={archived}
            onValueChange={setArchived}
          />
          <Button
            label={t.beans.deleteBtn}
            icon="trash"
            variant="danger"
            onPress={confirmDelete}
            style={styles.deleteButton}
          />
        </View>
      ) : null}

      <OptionSheet
        visible={processSheet}
        onClose={() => setProcessSheet(false)}
        title={t.beans.processingMethod}
        options={PROCESS_METHODS.map((method) => ({
          label: localizeProcessMethod(method, lang),
          value: method,
        }))}
        selected={process}
        onSelect={(value) => setProcess(value as ProcessMethod)}
      />
      <OptionSheet
        visible={roastSheet}
        onClose={() => setRoastSheet(false)}
        title={t.beans.roastLevel}
        options={ROAST_LEVELS.map((level) => ({
          label: localizeRoastLevel(level, lang),
          value: level,
        }))}
        selected={roastLevel}
        onSelect={(value) => setRoastLevel(value as RoastLevel)}
      />
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl },
  row: { flexDirection: 'row', gap: Spacing.md },
  gap: { height: Spacing.md },
  banner: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  deleteButton: { marginTop: Spacing.lg, alignSelf: 'flex-start' },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
