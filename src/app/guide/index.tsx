import { AppIcon, type IconName } from '@/components/common/icon';
import { StackScreen } from '@/components/common/screen';
import { Badge, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { getGuideArticles } from '@/constants/guide';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const ARTICLE_ICONS: Record<string, IconName> = {
  'v60-basics': 'coffee',
  'dial-in-grind': 'sliders',
  'water-and-ratio': 'droplets',
  'taste-troubleshooting': 'alert-circle',
  'beans-and-freshness': 'compass',
  'pour-technique': 'droplets',
  'grinder-calibration': 'disc',
  'four-six-method': 'layers',
};

export default function GuideScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { lang, t } = useTranslation();
  const articles = getGuideArticles(lang);

  return (
    <StackScreen
      title={t.guide.title}
      subtitle={t.guide.subtitle}
      right={<Badge label={t.guide.offlineBadge} />}>
      <AppText variant="small" tone="muted">
        {t.guide.intro}
      </AppText>

      <View
        style={[
          styles.quickCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}>
        <AppText variant="label" tone="accent">
          {t.guide.oneCupRef}
        </AppText>
        <View style={[styles.quickRow, { borderColor: theme.border }]}>
          <QuickFact value="15 g" label={t.guide.coffee} />
          <QuickFact value="250 g" label={t.guide.water} />
          <QuickFact value="1:16.7" label={t.guide.ratio} />
          <QuickFact value="3:00" label={t.guide.target} />
        </View>
        <AppText variant="caption" tone="muted">
          {t.guide.quickSummary}
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.guide.allGuides} subtitle={t.guide.articlesCount(articles.length)} />
        <View
          style={[
            styles.list,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}>
          {articles.map((article, index) => (
            <Pressable
              key={article.slug}
              accessibilityRole="button"
              accessibilityLabel={article.title}
              onPress={() => router.push(`/guide/${article.slug}`)}
              onPressIn={() => haptics.fire('selection')}
              style={({ pressed }) => [
                styles.row,
                {
                  borderTopColor: theme.border,
                  borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.surfaceSunken }]}>
                <AppIcon
                  name={ARTICLE_ICONS[article.slug] ?? 'book-open'}
                  size={17}
                  color={theme.accent}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{article.title}</AppText>
                <AppText variant="caption" tone="muted" style={styles.summary}>
                  {article.summary}
                </AppText>
              </View>
              <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title={t.guide.whereItComesFrom} />
        <AppText variant="small" tone="muted">
          {t.guide.sourcesSummary}
        </AppText>
        <AppText variant="caption" tone="faint" style={styles.footnote}>
          {t.guide.footnote}
        </AppText>
      </View>
    </StackScreen>
  );
}

function QuickFact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.quickFact}>
      <AppText variant="metricSmall" tabular>
        {value}
      </AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  quickCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  quickFact: { flex: 1, gap: 2 },
  section: { marginTop: Spacing.xxl },
  list: { borderWidth: 1, borderRadius: Radius.md, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: { marginTop: 2 },
  footnote: { marginTop: Spacing.md },
  flex: { flex: 1 },
});
