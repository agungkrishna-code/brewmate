import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandSurface, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppText } from '../common/text';

export interface Fact {
  label: string;
  value: string;
  unit?: string;
}

interface FactsProps {
  items: Fact[];
  /** `brand` is for facts placed on the dark instrument surface. */
  tone?: 'default' | 'brand';
  style?: StyleProp<ViewStyle>;
}

export function Facts({ items, tone = 'default', style }: FactsProps) {
  const theme = useTheme();
  const valueColor = tone === 'brand' ? BrandSurface.text : theme.text;
  const labelColor = tone === 'brand' ? BrandSurface.muted : theme.textFaint;
  const ruleColor = tone === 'brand' ? BrandSurface.line : theme.border;

  return (
    <View style={[styles.row, style]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <View
            key={`${item.label}-${index}`}
            style={[
              styles.fact,
              !isLast && {
                borderRightWidth: StyleSheet.hairlineWidth,
                borderRightColor: ruleColor,
                paddingRight: Spacing.sm,
              },
            ]}>
            <View style={styles.valueRow}>
              <AppText variant="metric" color={valueColor}>
                {item.value}
              </AppText>
              {item.unit ? (
                <AppText variant="caption" color={labelColor} tabular>
                  {item.unit}
                </AppText>
              ) : null}
            </View>
            <AppText variant="caption" color={labelColor} numberOfLines={1}>
              {item.label}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  fact: { flex: 1, gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
});
