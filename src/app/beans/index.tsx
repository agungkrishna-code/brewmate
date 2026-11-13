import { BeanRow } from '@/components/beans/bean-row';
import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState } from '@/components/common/empty-state';
import { StackScreen } from '@/components/common/screen';
import { SectionHeader } from '@/components/common/section';
import { AppText } from '@/components/common/text';
import { Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { listBeans } from '@/services/beans';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function BeansScreen() {
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
        <SectionHeader title="Why bother?" />
        <AppText variant="small" tone="muted">
          A bean record ties your grinder settings, recipes and tasting notes to one bag. When
          you buy it again, the journal already knows how you liked it.
        </AppText>
      </View>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm, marginTop: Spacing.lg },
  section: { marginTop: Spacing.xxl },
});
