import { Button, SegmentedControl } from '@/components/common/button';
import { SwitchRow } from '@/components/common/field';
import { AppIcon, type IconName } from '@/components/common/icon';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { MetricStrip } from '@/components/common/stat';
import { AppText } from '@/components/common/text';
import { APP_VERSION, getDisclaimers } from '@/constants/defaults';
import { Radius, Spacing, type ThemePreference } from '@/constants/theme';
import { useSettings } from '@/contexts/settings-context';
import { useDatabase, useFocusedQuery } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import type { LanguagePreference } from '@/i18n';
import { importBackupJson, readBackupFile, shareBackup } from '@/services/backup';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

export default function SettingsScreen() {
  const theme = useTheme();
  const db = useDatabase();
  const { lang, t } = useTranslation();
  const disclaimers = getDisclaimers(lang);
  const {
    preferences,
    setThemeMode,
    setLanguage,
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
        t.settings.exportFailedTitle,
        caught instanceof Error ? caught.message : t.settings.exportFailedMsg
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
      Alert.alert(t.settings.restoreSuccessTitle, t.settings.restoreSuccessMsg(summary.total));
    } catch (caught) {
      Alert.alert(
        t.settings.importFailedTitle,
        caught instanceof Error ? caught.message : t.settings.importFailedMsg
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <StackScreen title={t.settings.title} subtitle={t.settings.subtitle}>
      <View style={styles.firstSection}>
        <SectionHeader title={t.settings.appearance} />
        <SegmentedControl<ThemePreference>
          stretch
          value={preferences.themeMode}
          onChange={setThemeMode}
          options={[
            { label: t.settings.themeSystem, value: 'system' },
            { label: t.settings.themeLight, value: 'light' },
            { label: t.settings.themeDark, value: 'dark' },
          ]}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.language} subtitle={t.settings.languageSubtitle} />
        <SegmentedControl<LanguagePreference>
          stretch
          value={preferences.language}
          onChange={setLanguage}
          options={[
            { label: t.settings.langSystem, value: 'system' },
            { label: t.settings.langEn, value: 'en' },
            { label: t.settings.langId, value: 'id' },
          ]}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.brewing} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <SwitchRow
            icon="smartphone"
            label={t.settings.keepAwake}
            description={t.settings.keepAwakeDesc}
            value={preferences.keepAwake}
            onValueChange={setKeepAwake}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SwitchRow
            icon="activity"
            label={t.settings.haptics}
            description={t.settings.hapticsDesc}
            value={preferences.haptics}
            onValueChange={setHaptics}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.library} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.settings.manageCoffeesA11y}
          onPress={() => router.push('/beans')}
          style={({ pressed }) => [
            styles.linkRow,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.72 : 1,
            },
          ]}>
          <AppIcon name="coffee" size={18} color={theme.textMuted} />
          <View style={styles.flex}>
            <AppText variant="bodyStrong">{t.settings.coffeeBeans}</AppText>
            <AppText variant="caption" tone="muted" tabular>
              {t.settings.coffeeBeansSub(counts?.beans ?? 0)}
            </AppText>
          </View>
          <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.learn} subtitle={t.settings.learnSub} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <GuideLink
            icon="book-open"
            title={t.settings.brewGuide}
            description={t.settings.brewGuideDesc}
            onPress={() => router.push('/guide')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <GuideLink
            icon="sliders"
            title={t.settings.dialInGrind}
            description={t.settings.dialInGrindDesc}
            onPress={() => router.push('/guide/dial-in-grind')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <GuideLink
            icon="alert-circle"
            title={t.settings.tasteTroubleshooting}
            description={t.settings.tasteTroubleshootingDesc}
            onPress={() => router.push('/guide/taste-troubleshooting')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.backup} subtitle={t.settings.backupSub} />
        <MetricStrip
          style={styles.libraryStrip}
          items={[
            { value: String(counts?.beans ?? 0), label: t.settings.coffeesStat },
            { value: String(counts?.recipes ?? 0), label: t.settings.recipesStat },
            { value: String(counts?.sessions ?? 0), label: t.settings.brewsStat },
          ]}
        />
        <Button
          label={t.settings.exportBtn}
          icon="share"
          variant="secondary"
          onPress={exportData}
          loading={busy === 'export'}
          style={styles.action}
          fullWidth
        />
        <Button
          label={t.settings.restoreBtn}
          icon="download"
          variant="secondary"
          onPress={importData}
          loading={busy === 'import'}
          style={styles.action}
          fullWidth
        />
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {disclaimers.offline}
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.settings.about} />
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.aboutRow}>
            <AppText variant="bodyStrong">Brewmate</AppText>
            <AppText variant="caption" tone="muted" tabular>
              v{APP_VERSION}
            </AppText>
          </View>
          <AppText variant="small" tone="muted">
            {t.settings.aboutText}
          </AppText>
        </View>
        <AppText variant="caption" tone="faint" style={styles.disclaimer}>
          {disclaimers.starterRecipes}
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
      style={({ pressed }) => [styles.guideRow, { opacity: pressed ? 0.65 : 1 }]}>
      <AppIcon name={icon} size={18} color={theme.textMuted} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="caption" tone="muted">
          {description}
        </AppText>
      </View>
      <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  firstSection: { marginTop: Spacing.xs },
  section: { marginTop: Spacing.xxl },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth },
  guideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 44,
    paddingVertical: 4,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 56,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  libraryStrip: { marginBottom: Spacing.md },
  action: { marginBottom: Spacing.sm },
  disclaimer: { marginTop: Spacing.sm },
  aboutRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flex: { flex: 1 },
});
