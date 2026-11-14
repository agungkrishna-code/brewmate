import { BeanRow } from '@/components/beans/bean-row';
import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState } from '@/components/common/empty-state';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function BeansScreen() {
  const theme = useTheme();
  const [showArchived, setShowArchived] = useState(false);
  const { data } = useFocusedQuery(async (db) => listBeans(db, { includeArchived: true }));

  const beans = data ?? [];
  const active = beans.filter((bean) => !bean.isArchived);
  const archived = beans.filter((bean) => bean.isArchived);

  return (
    <StackScreen
      title="Coffees"
      subtitle={`${active.length} active ${active.length === 1 ? 'bag' : 'bags'}`}
      right={<IconButton icon="add" label="Add a coffee" variant="inverse" onPress={() => router.push('/beans/new')} />}>
      <ChipRow>
        <Chip
          label={`Active ${active.length}`}
          selected={!showArchived}
          onPress={() => setShowArchived(false)}
        />
        <Chip
          label={`Archived ${archived.length}`}
          selected={showArchived}
          onPress={() => setShowArchived(true)}
        />
      </ChipRow>

      <View style={styles.list}>
        {showArchived ? (
          archived.length > 0 ? (
            archived.map((bean) => (
              <BeanRow key={bean.id} bean={bean} onPress={() => router.push(`/beans/${bean.id}`)} />
            ))
          ) : (
            <EmptyState
              compact
              icon="archive-outline"
              title="Nothing archived"
              description="Archived coffees stay in your history but hide from pickers."
            />
          )
        ) : active.length > 0 ? (
          active.map((bean) => (
            <BeanRow key={bean.id} bean={bean} onPress={() => router.push(`/beans/${bean.id}`)} />
          ))
        ) : (
          <EmptyState
            icon="cafe-outline"
            title="No coffees yet"
            description="Add the bag you are brewing now so every cup has a name and a roast date."
            actionLabel="Add a coffee"
            onAction={() => router.push('/beans/new')}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Bean basics"
          actionLabel="Guide"
          onAction={() => router.push('/guide/beans-and-freshness')}
        />
        <View style={[styles.tipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TipRow
            label="Roast date"
            text="Filter coffee usually tastes best from about 5 days to 6 weeks after roast. Dark roasts settle faster."
          />
          <TipRow
            label="Storage"
            text="Airtight, cool, dark and dry. Keep beans out of the fridge and grind just before brewing."
          />
          <TipRow
            label="Why record it"
            text="A bean record ties your grind settings, recipes and tasting notes to one bag, so the next purchase starts with evidence."
          />
        </View>
      </View>
    </StackScreen>
  );
}

function TipRow({ label, text }: { label: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <AppText variant="caption" tone="faint">
        {label}
      </AppText>
      <AppText variant="small">{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm, marginTop: Spacing.lg },
  section: { marginTop: Spacing.xxl },
  tipCard: {
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  tipRow: { gap: 2 },
});
