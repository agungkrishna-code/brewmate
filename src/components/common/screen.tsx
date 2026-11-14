import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons } from './icon';
import { AppText } from './text';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Applies the standard horizontal page padding. */
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Fixed footer rendered outside the scroll view (e.g. a primary action). */
  footer?: ReactNode;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
  contentStyle,
  style,
  footer,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        padded && styles.padded,
        { paddingBottom: insets.bottom + Spacing.xxl },
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: theme.bg }, style]}>
      <View style={{ height: insets.top }} />
      {content}
      {footer ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, Spacing.sm) }}>{footer}</View>
      ) : null}
    </View>
  );
}

interface StackScreenProps extends Omit<ScreenProps, 'children'> {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  /** Shows a large serif title under the back row. */
  largeTitle?: boolean;
}

export function StackScreen({
  title,
  subtitle,
  children,
  right,
  onBack,
  scroll = true,
  padded = true,
  contentStyle,
  footer,
  largeTitle = true,
}: StackScreenProps) {
  const theme = useTheme();

  return (
    <Screen scroll={scroll} padded={padded} contentStyle={contentStyle} footer={footer}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: theme.surfaceSunken, opacity: pressed ? 0.6 : 1 },
          ]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.navSpacer} />
        {right}
      </View>

      {largeTitle ? (
        <View style={styles.titleBlock}>
          <AppText variant="h1">{title}</AppText>
          {subtitle ? (
            <AppText variant="small" tone="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
      ) : null}

      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: Spacing.lg },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    minHeight: 44,
  },
  navSpacer: { flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  subtitle: { marginTop: Spacing.xs },
});
