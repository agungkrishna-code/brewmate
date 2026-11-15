import { EmptyState } from '@/components/common/empty-state';
import { StackScreen } from '@/components/common/screen';
import { Dot, SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { getGuideArticle, type GuideBlock } from '@/constants/guide';
import { Radius, Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function GuideArticleScreen() {
  const theme = useTheme();
  const { lang, t } = useTranslation();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = getGuideArticle(typeof slug === 'string' ? slug : '', lang);

  if (!article) {
    return (
      <StackScreen title={t.guide.pageTitle}>
        <EmptyState
          icon="alert-circle"
          title={t.guide.articleNotFoundTitle}
          description={t.guide.articleNotFoundDesc}
          actionLabel={t.guide.backToGuide}
          onAction={() => router.replace('/guide')}
        />
      </StackScreen>
    );
  }

  return (
    <StackScreen title={article.title} subtitle={article.summary}>
      {article.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <SectionHeader title={section.heading} />
          <View style={styles.blocks}>
            {section.blocks.map((block, index) => (
              <GuideBlockView
                key={`${section.heading}-${index}`}
                block={block}
                theme={theme}
              />
            ))}
          </View>
        </View>
      ))}

      <View style={styles.section}>
        <SectionHeader title={t.guide.sourcesTitle} />
        <View style={[styles.sources, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {article.sources.map((source, index) => (
            <View
              key={source.label}
              style={[
                styles.sourceRow,
                index === article.sources.length - 1
                  ? null
                  : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
              ]}>
              <AppText variant="small" style={styles.sourceLabel}>
                {source.label}
              </AppText>
              <AppText variant="caption" tone="muted">
                {source.detail}
              </AppText>
            </View>
          ))}
        </View>
        <AppText variant="caption" tone="faint" style={styles.footnote}>
          {t.guide.articleFootnote}
        </AppText>
      </View>
    </StackScreen>
  );
}

function GuideBlockView({
  block,
  theme,
}: {
  block: GuideBlock;
  theme: ReturnType<typeof useTheme>;
}) {
  if (block.type === 'paragraph') {
    return (
      <AppText variant="body" style={styles.paragraph}>
        {block.text}
      </AppText>
    );
  }

  if (block.type === 'bullets') {
    return (
      <View style={styles.bullets}>
        {block.items.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <View style={styles.dot}>
              <Dot size={5} />
            </View>
            <AppText variant="small" style={styles.flex}>
              {item}
            </AppText>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'steps') {
    return (
      <View style={styles.steps}>
        {block.items.map((item) => (
          <View key={`${item.label}-${item.title}`} style={styles.stepRow}>
            <View
              style={[
                styles.stepLabel,
                { backgroundColor: theme.surfaceSunken, borderColor: theme.border },
              ]}>
              <AppText variant="caption" tabular color={theme.text}>
                {item.label}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="small" tone="muted">
                {item.text}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (block.type === 'table') {
    return (
      <View style={[styles.table, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {block.rows.map((row, index) => (
          <View
            key={row.label}
            style={[
              styles.tableRow,
              index === block.rows.length - 1
                ? null
                : { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
            ]}>
            <View style={styles.tableTop}>
              <AppText variant="small" tone="muted" style={styles.flex}>
                {row.label}
              </AppText>
              <AppText variant="metricSmall" tabular style={styles.tableValue}>
                {row.value}
              </AppText>
            </View>
            {row.hint ? (
              <AppText variant="caption" tone="faint" style={styles.tableHint}>
                {row.hint}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.note,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderLeftColor: theme.accent,
        },
      ]}>
      <AppText variant="small">{block.text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xxl },
  blocks: { gap: Spacing.md },
  paragraph: { marginBottom: Spacing.xs },
  bullets: { gap: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm },
  dot: { paddingTop: 7 },
  steps: { gap: Spacing.md },
  stepRow: { flexDirection: 'row', gap: Spacing.md },
  stepLabel: {
    minWidth: 46,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.xs,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  table: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  tableRow: { paddingVertical: Spacing.sm + 3, gap: 2 },
  tableTop: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.md },
  tableValue: { flexShrink: 1, textAlign: 'right' },
  tableHint: { marginTop: 1 },
  note: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: Spacing.md,
  },
  sources: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  sourceRow: { paddingVertical: Spacing.md, gap: 2 },
  sourceLabel: { lineHeight: 18 },
  footnote: { marginTop: Spacing.md },
  flex: { flex: 1 },
});
