import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTranslation } from '@/hooks/use-language';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon } from './icon';
import { AppText } from './text';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Renders action buttons pinned under the scroll area. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  style,
}: BottomSheetProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        // Android already resizes the window (`softwareKeyboardLayoutMode:
        // "resize"`); adding "height" here resized twice and pushed the footer
        // buttons out of the sheet when the keyboard opened.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          style={[styles.backdrop, { backgroundColor: theme.overlay }]}
          onPress={onClose}
          onPressIn={() => haptics.fire('light')}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, Spacing.lg),
            },
            style,
          ]}>
          <View style={[styles.handle, { backgroundColor: theme.borderStrong }]} />
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerText}>
              <AppText variant="h2">{title}</AppText>
              {subtitle ? (
                <AppText variant="small" tone="muted" style={styles.subtitle}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.common.close}
              hitSlop={4}
              onPress={onClose}
              onPressIn={() => haptics.fire('light')}
              style={({ pressed }) => [
                styles.close,
                {
                  backgroundColor: theme.surfaceSunken,
                  borderColor: theme.border,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}>
              <AppIcon name="close" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface OptionSheetProps<T extends string> {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: { label: string; value: T; detail?: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function OptionSheet<T extends string>({
  visible,
  title,
  subtitle,
  options,
  selected,
  onSelect,
  onClose,
}: OptionSheetProps<T>) {
  const theme = useTheme();
  const haptics = useHaptics();

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle}>
      <View style={[styles.optionList, { borderColor: theme.border }]}>
        {options.map((option, index) => {
          const isSelected = option.value === selected;
          const isLast = index === options.length - 1;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}
              onPressIn={() => haptics.fire('selection')}
              style={({ pressed }) => [
                styles.option,
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
                {
                  backgroundColor: isSelected ? theme.accentSoft : 'transparent',
                  opacity: pressed ? 0.72 : 1,
                },
              ]}>
              <View style={styles.optionText}>
                <AppText variant="bodyStrong">{option.label}</AppText>
                {option.detail ? (
                  <AppText variant="caption" tone="muted">
                    {option.detail}
                  </AppText>
                ) : null}
              </View>
              {isSelected ? (
                <AppIcon name="check" size={18} color={theme.accent} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderWidth: 1,
    maxHeight: '86%',
    paddingTop: Spacing.sm,
  },
  handle: {
    width: 34,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.md,
  },
  headerText: { flex: 1, gap: 2 },
  subtitle: { marginTop: 2 },
  close: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyContent: { padding: Spacing.lg },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.sm },
  optionList: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  optionText: { flex: 1, gap: 2 },
});
