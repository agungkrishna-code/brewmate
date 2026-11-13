import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandSurface, Radius } from '@/constants/theme';
import { AppText } from './text';

interface BrandCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

/** The espresso "brand surface" used for hero cards and the brewing screen. */
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
    borderRadius: Radius.xl,
    overflow: 'hidden',
  },
  // A hairline of gold at the very top instead of a glow: reads as a lit edge
  // and never competes with the content.
  topRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(199, 166, 117, 0.42)',
  },
});
