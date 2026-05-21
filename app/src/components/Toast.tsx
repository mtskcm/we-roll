import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  visible: boolean;
  message: string;
  onHide: () => void;
};

export function Toast({ visible, message, onHide }: Props) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.ease) });
      translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.ease) });
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 220 });
        translateY.value = withTiming(20, { duration: 220 });
        setTimeout(onHide, 240);
      }, 1800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, opacity, translateY, onHide]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={styles.holder}>
      <Animated.View style={[styles.toast, animStyle]}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={14} color={COLORS.ink} />
        </View>
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  holder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.pill,
    paddingVertical: 10,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 13,
    color: COLORS.cream,
  },
});
