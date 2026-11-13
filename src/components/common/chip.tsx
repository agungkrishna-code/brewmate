import { Pressable, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Ionicons, type IconName } from './icon';
import { AppText } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  tone?: 'default' | 'gold';
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, selected, onPress, icon, tone = 'default', style }: ChipProps) {
  const theme = useTheme();
  const accent = tone === 'gold' ? theme.gold : theme.primary;

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? accent : theme.surface,
          borderColor: selected ? accent : theme.border,
        },
        style,
      ]}>
      {icon ? (
        <Ionicons
          name={icon}
          size={13}
          color={selected ? theme.onPrimary : theme.textMuted}
        />
      ) : null}
      <AppText
        variant="caption"
        color={selected ? theme.onPrimary : theme.textMuted}
        style={styles.label}>
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
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {content}
    </Pressable>
  );
}

interface ChipRowProps {
  children: React.ReactNode;
  /** Horizontal scrolling for long filter lists. */
  scroll?: boolean;
}

export function ChipRow({ children, scroll = true }: ChipRowProps) {
  if (!scroll) return <View style={styles.row}>{children}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollRow}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: { fontSize: 12.5 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  scrollRow: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
});
