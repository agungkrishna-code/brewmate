import { Button } from '@/components/common/button';
import { SelectField, SwitchRow, TextField } from '@/components/common/field';
import { Chip, ChipRow } from '@/components/common/chip';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { OptionSheet } from '@/components/common/sheet';
import { AppText } from '@/components/common/text';
import { PROCESS_METHODS, ROAST_LEVELS } from '@/constants/defaults';
import { Radius, Spacing } from '@/constants/theme';
import { useDatabase } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { createBean, deleteBean, setBeanArchived, updateBean } from '@/services/beans';
import type { CoffeeBeanWithStats, ProcessMethod, RoastLevel } from '@/types';
import { todayIsoDate } from '@/utils/formatting';
import { validateBean } from '@/utils/validation';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

interface BeanFormProps {
  initialBean?: CoffeeBeanWithStats | null;
}

export function BeanForm({ initialBean }: BeanFormProps) {
  const theme = useTheme();
  const db = useDatabase();

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
    const errors = validateBean(draft);
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
      setError(caught instanceof Error ? caught.message : 'Could not save the coffee.');
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!initialBean) return;
    Alert.alert(
      'Delete this coffee?',
      'Brew sessions keep their recorded bean name. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBean(db, initialBean.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <StackScreen
      title={isEditing ? 'Coffee' : 'Add a coffee'}
      subtitle={isEditing ? initialBean?.name : 'Keep the details you will forget by Friday'}
      footer={
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Button
            label={isEditing ? 'Save changes' : 'Add coffee'}
            onPress={save}
            loading={saving}
            size="lg"
            fullWidth
          />
        </View>
      }>
      {error ? (
        <View style={[styles.banner, { backgroundColor: theme.dangerSoft }]}>
          <AppText variant="small" tone="danger">
            {error}
          </AppText>
        </View>
      ) : null}

      <TextField
        label="Coffee name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Guji Hambela"
        required
        maxLength={80}
      />

      <View style={styles.section}>
        <SectionHeader title="Origin" subtitle="As much or as little as you know" />
        <View style={styles.row}>
          <TextField
            label="Country"
            value={country}
            onChangeText={setCountry}
            placeholder="Ethiopia"
            style={styles.flex}
            maxLength={50}
          />
          <TextField
            label="Region"
            value={region}
            onChangeText={setRegion}
            placeholder="Guji"
            style={styles.flex}
            maxLength={50}
          />
        </View>
        <View style={styles.gap} />
        <View style={styles.row}>
          <TextField
            label="Farm / station"
            value={farm}
            onChangeText={setFarm}
            placeholder="Optional"
            style={styles.flex}
            maxLength={60}
          />
          <TextField
            label="Variety"
            value={variety}
            onChangeText={setVariety}
            placeholder="Heirloom"
            style={styles.flex}
            maxLength={60}
          />
        </View>
        <View style={styles.gap} />
        <TextField
          label="Origin label"
          value={origin}
          onChangeText={setOrigin}
          placeholder="What the bag says"
          hint="Free text, shown on the coffee list."
          maxLength={80}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Processing & roast" />
        <SelectField
          label="Processing method"
          value={process}
          icon="water-outline"
          onPress={() => setProcessSheet(true)}
        />
        <View style={styles.gap} />
        <SelectField
          label="Roast level"
          value={roastLevel}
          icon="flame-outline"
          onPress={() => setRoastSheet(true)}
        />
        <View style={styles.gap} />
        <TextField
          label="Roast date"
          value={roastDate}
          onChangeText={setRoastDate}
          placeholder="yyyy-mm-dd"
          keyboardType="numbers-and-punctuation"
          hint="Used to show how many days off roast the coffee is."
          maxLength={10}
        />
        <ChipRow>
          <Chip label="Today" onPress={() => setRoastDate(todayIsoDate())} />
          {roastDate ? <Chip label="Clear" icon="close" onPress={() => setRoastDate('')} /> : null}
        </ChipRow>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Taste" />
        <TextField
          label="Tasting notes"
          value={tastingNotes}
          onChangeText={setTastingNotes}
          placeholder="Jasmine, peach, honey"
          multiline
          maxLength={400}
        />
        <View style={styles.gap} />
        <TextField
          label="Personal notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Recipe tweaks, resting time, anything useful"
          multiline
          maxLength={600}
        />
      </View>

      {isEditing ? (
        <View style={styles.section}>
          <SectionHeader title="Manage" />
          <SwitchRow
            label="Archive this coffee"
            description="Hidden from pickers but kept in your history."
            value={archived}
            onValueChange={setArchived}
          />
          <Button
            label="Delete coffee"
            icon="trash-outline"
            variant="danger"
            onPress={confirmDelete}
            style={styles.deleteButton}
          />
        </View>
      ) : null}

      <OptionSheet
        visible={processSheet}
        onClose={() => setProcessSheet(false)}
        title="Processing method"
        options={PROCESS_METHODS.map((method) => ({ label: method, value: method }))}
        selected={process}
        onSelect={(value) => setProcess(value as ProcessMethod)}
      />
      <OptionSheet
        visible={roastSheet}
        onClose={() => setRoastSheet(false)}
        title="Roast level"
        options={ROAST_LEVELS.map((level) => ({ label: level, value: level }))}
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
  banner: { padding: Spacing.md, borderRadius: Radius.md, marginBottom: Spacing.lg },
  deleteButton: { marginTop: Spacing.lg, alignSelf: 'flex-start' },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
});
