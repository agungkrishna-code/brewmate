import { Button } from '@/components/common/button';
import { Screen } from '@/components/common/screen';
import { AppText } from '@/components/common/text';
import { Spacing } from '@/constants/theme';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={styles.root}>
        <AppText variant="label" tone="faint">
          404
        </AppText>
        <AppText variant="display" style={styles.title}>
          This cup went missing
        </AppText>
        <AppText variant="small" tone="muted" style={styles.body}>
          That link does not point anywhere in Brewmate.
        </AppText>
        <Button
          label="Back to home"
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
  body: { marginBottom: Spacing.lg },
  button: { alignSelf: 'flex-start' },
});
