import { Button } from '@/components/common/button';
import { Screen } from '@/components/common/screen';
import { AppText } from '@/components/common/text';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-language';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <View style={styles.root}>
        <AppText variant="label" tone="faint" tabular>
          404
        </AppText>
        <AppText variant="display" style={styles.title}>
          {t.notFound.title}
        </AppText>
        <AppText variant="small" tone="muted" style={styles.body}>
          {t.notFound.body}
        </AppText>
        <Button
          label={t.notFound.backHome}
          variant="accent"
          onPress={() => router.replace('/')}
          style={styles.button}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', paddingTop: Spacing.xxxl, gap: Spacing.sm },
  title: { marginTop: Spacing.xs },
  body: { maxWidth: 280 },
  button: { alignSelf: 'flex-start', marginTop: Spacing.lg },
});
