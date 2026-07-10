// RailAction — one right-rail action button for the full-bleed feeds
// (product feed + FITS): icon with press-bounce, optional count label,
// volt when active. `color` sets the resting icon/label colour (white on
// dark photos, black on light studio shots); shadow only makes sense on
// photos, so it can be turned off.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

export const RAIL_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.45,
  shadowRadius: 4,
} as const;

export function RailAction({
  Icon,
  label,
  active = false,
  color = WEROL_TOKENS.paper,
  shadow = true,
  strokeWidth = 2.3,
  onPress,
}: {
  Icon: React.FC<{ width?: number; height?: number; stroke?: string; fill?: string; strokeWidth?: number }>;
  label?: string;
  active?: boolean;
  /** Resting icon + label colour (active is always volt). */
  color?: string;
  shadow?: boolean;
  strokeWidth?: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handle = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 90 }),
      withSpring(1, { damping: 6, stiffness: 220 }),
    );
    onPress();
  };
  const iconColor = active ? WEROL_TOKENS.lime : color;
  return (
    <Pressable onPress={handle} hitSlop={8} style={[styles.railItem, shadow && RAIL_SHADOW]}>
      <Animated.View style={animStyle}>
        <Icon width={28} height={28} stroke={iconColor} fill={active ? iconColor : 'none'} strokeWidth={strokeWidth} />
      </Animated.View>
      {label ? (
        <Text style={[styles.railLabel, { color: iconColor }, shadow && RAIL_SHADOW]}>{label}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  railItem: {
    alignItems: 'center',
    gap: 5,
  },
  railLabel: {
    fontFamily: FONTS.manropeBold,
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
