import { BeanRow } from '@/components/beans/bean-row';
import { IconButton } from '@/components/common/button';
import { Chip, ChipRow } from '@/components/common/chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { AppIcon } from '@/components/common/icon';
import { StackScreen } from '@/components/common/screen';
import { AppText } from '@/components/common/text';
import { Radius, Spacing } from '@/constants/theme';
import { useFocusedQuery } from '@/hooks/use-database';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { listBeans } from '@/services/beans';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export default function BeansScreen() {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const [showArchived, setShowArchived] = useState(false);
  const { data, loading, error, reload } = useFocusedQuery(async (db) =>
    listBeans(db, { includeArchived: true })
  );

  const beans = data ?? [];
  const active = beans.filter((bean) => !bean.isArchived);
  const archived = beans.filter((bean) => bean.isArchived);

  return (
    <StackScreen
      title={t.beans.title}
      subtitle={t.beans.activeSubtitle(active.length)}
      right={
        <IconButton
          icon="plus"
          label={t.beans.addCoffee}
          variant="accent"
          onPress={() => router.push('/beans/new')}
        />
      }>
      {error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading && !data ? (
        <LoadingState label={t.beans.loading} />
      ) : (
        <>
          <ChipRow>
            <Chip
              label={t.beans.activeChip(active.length)}
              selected={!showArchived}
              onPress={() => setShowArchived(false)}
            />
            <Chip
              label={t.beans.archivedChip(archived.length)}
              selected={showArchived}
              onPress={() => setShowArchived(true)}
            />
          </ChipRow>

          <View style={styles.list}>
            {showArchived ? (
              archived.length > 0 ? (
                archived.map((bean) => (
                  <BeanRow
                    key={bean.id}
                    bean={bean}
                    onPress={() => router.push(`/beans/${bean.id}`)}
                  />
                ))
              ) : (
                <EmptyState
                  compact
                  icon="archive"
                  title={t.beans.nothingArchivedTitle}
                  description={t.beans.nothingArchivedDesc}
                />
              )
            ) : active.length > 0 ? (
              active.map((bean) => (
                <BeanRow
                  key={bean.id}
                  bean={bean}
                  onPress={() => router.push(`/beans/${bean.id}`)}
                />
              ))
            ) : (
              <EmptyState
                icon="coffee"
                title={t.beans.emptyTitle}
                description={t.beans.emptyDesc}
                actionLabel={t.beans.addCoffee}
                onAction={() => router.push('/beans/new')}
              />
            )}
          </View>
        </>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.beans.guideA11y}
        onPress={() => router.push('/guide/beans-and-freshness')}
        onPressIn={() => haptics.fire('selection')}
        style={({ pressed }) => [
          styles.guideLink,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <AppIcon name="book-open" size={17} color={theme.accent} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{t.beans.guideTitle}</AppText>
          <AppText variant="caption" tone="muted">
            {t.beans.guideSub}
          </AppText>
        </View>
        <AppIcon name="chevron-right" size={16} color={theme.textFaint} />
      </Pressable>
    </StackScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.sm, marginTop: Spacing.lg },
  guideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xxl,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  flex: { flex: 1 },
});
