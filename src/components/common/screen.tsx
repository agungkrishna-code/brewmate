import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing, TouchTarget } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon } from './icon';
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
  const [footerHeight, setFooterHeight] = useState(0);

  const content = scroll ? (
    <ScrollView
      style={styles.flex}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        padded && styles.padded,
        {
          paddingBottom:
            insets.bottom + Spacing.xxl + (footer ? footerHeight : 0),
        },
        contentStyle,
      ]}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[{ flex: 1, backgroundColor: theme.bg }, style]}>
      <View style={{ height: insets.top }} />
      {content}
      {footer ? (
        <View
          onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
          style={{ paddingBottom: Math.max(insets.bottom, Spacing.sm) }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

interface StackScreenProps extends Omit<ScreenProps, 'children'> {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  onBack?: () => void;
  /** Shows a serif title under the back row. */
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
  const haptics = useHaptics();
  const { t } = useTranslation();

  return (
    <Screen scroll={scroll} padded={padded} contentStyle={contentStyle} footer={footer}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.back}
          hitSlop={6}
          onPress={onBack ?? (() => router.back())}
          onPressIn={() => haptics.fire('selection')}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}>
          <AppIcon name="chevron-left" size={20} color={theme.text} />
        </Pressable>
        <View style={styles.navSpacer} />
        {right}
      </View>

      {largeTitle ? (
        <View style={[styles.titleBlock, { borderBottomColor: theme.border }]}>
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
    minHeight: TouchTarget,
  },
  navSpacer: { flex: 1 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  subtitle: { marginTop: Spacing.xs },
});
