import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { BrandSurface } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TimerRingProps {
  /** 0–100. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}

const TICKS = Array.from({ length: 24 }, (_, idx) => idx);

export function TimerRing({
  progress,
  size = 248,
  strokeWidth = 7,
  color,
  trackColor,
  children,
}: TimerRingProps) {
  const theme = useTheme();
  const center = size / 2;
  const radius = (size - strokeWidth * 2) / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const dashOffset = circumference - (clamped / 100) * circumference;

  const tickOuter = radius + strokeWidth / 2 + 6;
  const tickInner = radius + strokeWidth / 2 + 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {TICKS.map((tick) => {
          const angle = (tick / TICKS.length) * Math.PI * 2 - Math.PI / 2;
          const isQuarter = tick % 6 === 0;
          const inner = isQuarter ? tickInner - 1 : tickInner;
          return (
            <Line
              key={tick}
              x1={center + Math.cos(angle) * inner}
              y1={center + Math.sin(angle) * inner}
              x2={center + Math.cos(angle) * tickOuter}
              y2={center + Math.sin(angle) * tickOuter}
              stroke={BrandSurface.line}
              strokeWidth={isQuarter ? 1.5 : 1}
            />
          );
        })}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor ?? theme.surfaceSunken}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color ?? theme.accent}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="none"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
});
