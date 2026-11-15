import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandSurface, Radius } from '@/constants/theme';
import { AppText } from './text';

interface BrandCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

/** Matte charcoal instrument surface used for hero readouts and active brew panels. */
export function BrandCard({ children, style, padding = 20 }: BrandCardProps) {
  return (
    <View style={[styles.card, { padding }, style]}>
      <View style={styles.topRule} pointerEvents="none" />
      {children}
    </View>
  );
}

export function BrandLabel({ children }: { children: ReactNode }) {
  return (
    <AppText variant="label" color={BrandSurface.accent}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandSurface.bg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: BrandSurface.border,
    overflow: 'hidden',
  },
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: BrandSurface.accent,
  },
});
