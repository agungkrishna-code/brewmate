import { Ionicons, type IconName } from '@/components/common/icon';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { GUIDE_ARTICLES } from '@/constants/guide';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const ARTICLE_ICONS: Record<string, IconName> = {
  'v60-basics': 'cafe-outline',
  'dial-in-grind': 'options-outline',
  'water-and-ratio': 'water-outline',
  'taste-troubleshooting': 'alert-circle-outline',
  'beans-and-freshness': 'leaf-outline',
  'pour-technique': 'water-outline',
  'grinder-calibration': 'disc-outline',
  'four-six-method': 'grid-outline',
};

export default function GuideScreen() {
  const theme = useTheme();

  return (
    <StackScreen
      title="Brew guide"
      subtitle="Short, sourced notes for better V60"
      right={
        <View style={[styles.badge, { backgroundColor: theme.primarySoft }]}>
          <AppText variant="caption" color={theme.primary}>
            Offline
          </AppText>
        </View>
      }>
      <AppText variant="small" tone="muted">
        These notes assume the one-cup V60 workflow the app is built around. The numbers are
        starting points. Taste is the final judge.
      </AppText>

      <View style={[styles.quickCard, { backgroundColor: theme.goldSoft }]}>
        <AppText variant="label" tone="faint">
          One cup reference
        </AppText>
        <View style={styles.quickRow}>
          <QuickFact value="15 g" label="Coffee" />
          <QuickFact value="250 g" label="Water" />
          <QuickFact value="1:16.7" label="Ratio" />
          <QuickFact value="3:00" label="Target" />
        </View>
        <AppText variant="caption" tone="muted">
          Medium-fine grind, 92 to 96°C water, bloom at 50 g for 45 seconds.
        </AppText>
      </View>

      <View style={styles.section}>
        <SectionHeader title="All guides" subtitle={`${GUIDE_ARTICLES.length} short reads`} />
        <View style={[styles.list, { borderColor: theme.border }]}>
          {GUIDE_ARTICLES.map((article, index) => (
            <Pressable
              key={article.slug}
              accessibilityRole="button"
              accessibilityLabel={article.title}
              onPress={() => router.push(`/guide/${article.slug}`)}
              style={({ pressed }) => [
                styles.row,
                {
                  borderTopColor: theme.border,
                  borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <View style={[styles.iconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons
                  name={ARTICLE_ICONS[article.slug] ?? 'book-outline'}
                  size={18}
                  color={theme.primary}
                />
              </View>
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{article.title}</AppText>
                <AppText variant="caption" tone="muted" style={styles.summary}>
                  {article.summary}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={15} color={theme.textFaint} />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader title="Where this comes from" />
        <AppText variant="small" tone="muted">
          The guide draws on James Hoffmann’s one-cup V60 method, the Specialty Coffee
          Association’s brewing and water references, TIMEMORE’s published grinder
          specifications, and practical dial-in notes from specialty roasters and brewing
          guides. Each article lists its own sources.
        </AppText>
        <AppText variant="caption" tone="faint" style={styles.footnote}>
          Brewing is personal. Use these notes to make your next cup easier to repeat, not to
          chase someone else’s numbers.
        </AppText>
      </View>
    </StackScreen>
  );
}

function QuickFact({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.quickFact}>
      <AppText variant="bodyStrong">{value}</AppText>
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.pill },
  quickCard: {
    marginTop: Spacing.xl,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  quickRow: { flexDirection: 'row', gap: Spacing.sm },
  quickFact: { flex: 1, gap: 1 },
  section: { marginTop: Spacing.xxl },
  list: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
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
