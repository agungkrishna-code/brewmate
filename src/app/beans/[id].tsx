import { BeanForm } from '@/components/beans/bean-form';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-database';
import { useTranslation } from '@/hooks/use-language';
import { getBean } from '@/services/beans';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function BeanDetailScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const beanId = typeof id === 'string' ? id : '';

  const { data, loading, error, reload } = useQuery(
    async (db) => (beanId ? getBean(db, beanId) : null),
    beanId
  );

  if (loading) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <LoadingState label={t.beans.loadingSingle} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <ErrorState message={error} onRetry={reload} />
        </View>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <EmptyState
            icon="alert-circle"
            title={t.beans.notFoundTitle}
            description={t.beans.notFoundDesc}
            actionLabel={t.beans.backToCoffees}
            onAction={() => router.replace('/beans')}
          />
        </View>
      </Screen>
    );
  }

  return <BeanForm initialBean={data} />;
}
