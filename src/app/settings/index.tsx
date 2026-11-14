import { Button, SegmentedControl } from '@/components/common/button';
import { SwitchRow } from '@/components/common/field';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { APP_VERSION, DISCLAIMERS } from '@/constants/defaults';
import { Radius, Spacing, type ThemePreference } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { importBackupJson, readBackupFile, shareBackup } from '@/services/backup';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, type IconName } from '@/components/common/icon';

export default function SettingsScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const {
    preferences,
    setThemeMode,
    setHaptics,
    setKeepAwake,
    reload: reloadSettings,
  } = useSettings();
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const { data: counts, reload } = useFocusedQuery(async (database) => {
    const beans = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM coffee_beans'
    );
    const recipes = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM brew_recipes'
    );
    const sessions = await database.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM brew_sessions'
    );
    return {
      beans: beans?.count ?? 0,
      recipes: recipes?.count ?? 0,
      sessions: sessions?.count ?? 0,
    };
  });

  const exportData = async () => {
    setBusy('export');
    try {
      await shareBackup(db);
    } catch (caught) {
      Alert.alert(
        'Export failed',
        caught instanceof Error ? caught.message : 'Could not write the backup file.'
      );
    } finally {
      setBusy(null);
    }
  };

  const importData = async () => {
    setBusy('import');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const json = await readBackupFile(result.assets[0].uri);
      const summary = await importBackupJson(db, json);
      await reloadSettings();
      reload();
      Alert.alert(
        'Backup restored',
        `${summary.total} records were merged into this device. Existing rows with the same id were replaced.`
      );
    } catch (caught) {
      Alert.alert(
        'Import failed',
        caught instanceof Error ? caught.message : 'That file could not be read.'
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <StackScreen title="Settings" subtitle="Small app, few opinions">
      <View style={styles.section}>
        <SectionHeader title="Appearance" />
        <SegmentedControl<ThemePreference>
          stretch
          value={preferences.themeMode}
          onChange={setThemeMode}
          options={[
            { label: 'System', value: 'system' },
            { label: 'Light', value: 'light' },
            { label: 'Dark', value: 'dark' },
          ]}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="Brewing" />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SwitchRow
            icon="phone-portrait-outline"
            label="Keep the screen awake"
            description="The display stays on while a brew is running."
            value={preferences.keepAwake}
            onValueChange={setKeepAwake}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SwitchRow
            icon="pulse-outline"
            label="Haptic feedback"
            description="A light tap when a stage changes."
            value={preferences.haptics}
            onValueChange={setHaptics}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Library" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage coffees"
          onPress={() => router.push('/beans')}
          style={({ pressed }) => [
            styles.linkRow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Ionicons name="cafe-outline" size={18} color={theme.textMuted} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">Coffee beans</AppText>
            <AppText variant="caption" tone="muted">
              {counts?.beans ?? 0} saved · origin, roast, tasting notes
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Learn" subtitle="Short, sourced notes you can use offline" />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <GuideLink
            icon="book-outline"
            title="Brew guide"
            description="V60 basics, grind, water, taste, beans and the 4:6 method"
            onPress={() => router.push('/guide')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <GuideLink
            icon="options-outline"
            title="Dial in the grind"
            description="One click at a time, with a time and taste table"
            onPress={() => router.push('/guide/dial-in-grind')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <GuideLink
            icon="alert-circle-outline"
            title="Taste troubleshooting"
            description="Sour, bitter, weak or muddy: what to change first"
            onPress={() => router.push('/guide/taste-troubleshooting')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Backup" subtitle="Your data never leaves the phone unless you move it" />
        <View style={styles.libraryRow}>
          <Stat label="Coffees" value={counts?.beans ?? 0} />
          <Stat label="Recipes" value={counts?.recipes ?? 0} />
          <Stat label="Brews" value={counts?.sessions ?? 0} />
        </View>
        <Button
          label="Export JSON backup"
          icon="share-outline"
          variant="secondary"
          onPress={exportData}
          loading={busy === 'export'}
          style={styles.action}
          fullWidth
        />
        <Button
          label="Restore from backup"
          icon="download-outline"
          variant="secondary"
          onPress={importData}
          loading={busy === 'import'}
          style={styles.action}
          fullWidth
        />
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {DISCLAIMERS.offline}
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="About" />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.aboutRow}>
            <AppText variant="bodyStrong">Brewmate</AppText>
            <AppText variant="caption" tone="muted">
              v{APP_VERSION}
            </AppText>
          </View>
          <AppText variant="small" tone="muted">
            A V60 companion for TIMEMORE Chestnut S5 Pro and C5 Pro owners. Built offline-first:
            no account, no tracking, no network calls.
          </AppText>
        </View>
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {DISCLAIMERS.starterRecipes}
        </AppText>
      </View>
    </StackScreen>
  );
}

function GuideLink({
  icon,
  title,
  description,
  onPress,
}: {
  icon: IconName;
  title: string;
  description: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.guideRow, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={18} color={theme.textMuted} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.textFaint} />
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surfaceSunken }]}>
      <AppText variant="h3">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl },
  card: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 2,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  libraryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  stat: {
    flex: 1,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: 1,
  },
  action: { marginBottom: Spacing.sm },
  disclaimer: { marginTop: Spacing.sm },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
});
