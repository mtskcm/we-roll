import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ArrowRightIcon from '../assets/icons/arrow_right.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

export function SwipeHint() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1500 }),
        withTiming(0, { duration: 800, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 700 }),
        withTiming(0, { duration: 1500 }),
        withTiming(8, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.root, animStyle]}>
      <View style={styles.circle}>
        <View style={styles.iconRotate}>
          <ArrowRightIcon width={14} height={14} stroke={WEROL_TOKENS.paper} strokeWidth={2} fill="none" />
        </View>
      </View>
      <Text style={styles.label}>Scroll</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 18,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(240,235,225,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRotate: {
    transform: [{ rotate: '-90deg' }],
  },
  label: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted,
    textTransform: 'uppercase',
  },
});
