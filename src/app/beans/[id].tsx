import { BeanForm } from '@/components/beans/bean-form';
import { EmptyState } from '@/components/common/empty-state';
import { Screen } from '@/components/common/screen';
import { Spacing } from '@/constants/theme';
import { useQuery } from '@/hooks/use-database';
import { getBean } from '@/services/beans';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

export default function BeanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const beanId = typeof id === 'string' ? id : '';

  const { data, loading } = useQuery(
    async (db) => (beanId ? getBean(db, beanId) : null),
    beanId
  );

  if (loading) {
    return <Screen>{null}</Screen>;
  }

  if (!data) {
    return (
      <Screen>
        <View style={{ paddingTop: Spacing.xxxl }}>
          <EmptyState
            icon="alert-circle-outline"
            title="Coffee not found"
            description="It may have been deleted."
            actionLabel="Back to coffees"
            onAction={() => router.replace('/beans')}
          />
        </View>
      </Screen>
    );
  }

  return <BeanForm initialBean={data} />;
}
