import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useHaptics } from '@/hooks/use-haptics';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type IconName } from './icon';
import { AppText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'default' | 'accent' | 'gold';
  /** Haptic weight; chips are pickers, so the default is the crisp selection tick. */
  haptic?: 'selection' | 'light' | 'medium' | 'none';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, icon, tone = 'default', haptic = 'selection', style }: ChipProps) {
  const theme = useTheme();
  const haptics = useHaptics();
  const solid = tone === 'accent' || tone === 'gold';
  const activeBg = solid ? theme.accent : theme.accentSoft;
  const activeFg = solid ? theme.onAccent : theme.accent;

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? activeBg : theme.surface,
          borderColor: selected ? theme.accent : theme.border,
        },
        style,
      ]}>
      {icon ? (
        <AppIcon
          name={icon}
          size={13}
          color={selected ? activeFg : theme.textMuted}
        />
      ) : null}
      <AppText
        variant="small"
        tabular
        color={selected ? activeFg : theme.text}
        style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </AppText>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={label}
      hitSlop={4}
      onPress={onPress}
      onPressIn={() => {
        if (haptic !== 'none') haptics.fire(haptic);
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.72 : 1 }]}>
      {content}
    </Pressable>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ChipRow({ children, scrollable, style }: ChipRowProps) {
  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollRow, style]}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.wrapRow, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  label: { fontSize: 13, lineHeight: 18 },
  labelSelected: { fontFamily: FontFamily.sansMedium },
  scrollRow: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.md },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
