// SplashScreen — full-bleed WEROL. wordmark with decorative "AR" backdrop.
// Fades + scales out after ~1.5s into the next screen (auth or tabs).

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

type Props = { onFinish: () => void };

export function SplashScreen({ onFinish }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const periodPulse = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
      withDelay(900, withTiming(0, { duration: 350, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(onFinish)();
      })),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withDelay(700, withTiming(1.05, { duration: 400, easing: Easing.in(Easing.cubic) })),
    );
    periodPulse.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }),
    );
  }, [opacity, scale, periodPulse, onFinish]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const periodStyle = useAnimatedStyle(() => ({
    opacity: periodPulse.value,
    transform: [{ scale: 0.6 + periodPulse.value * 0.4 }],
  }));

  return (
    <View style={styles.root}>
      {/* Decorative AR backdrop */}
      <Text style={styles.backdropAR} pointerEvents="none">AR</Text>

      <Animated.View style={[styles.center, containerStyle]}>
        <View style={styles.wordmarkRow}>
          <Text style={styles.wordmark}>WEROL</Text>
          <Animated.View style={[styles.period, periodStyle]} />
        </View>
        <Text style={styles.tagline}>WEAR · ALL</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WEROL_TOKENS.pitch,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backdropAR: {
    position: 'absolute',
    fontFamily: FONTS.archivo,
    fontSize: 320,
    letterSpacing: -16,
    lineHeight: 320,
    color: WEROL_TOKENS.paper,
    opacity: 0.04,
  },
  center: {
    alignItems: 'center',
    gap: 14,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  wordmark: {
    fontFamily: FONTS.archivo,
    fontSize: 72,
    letterSpacing: -3.5,
    lineHeight: 72,
    color: WEROL_TOKENS.paper,
  },
  period: {
    width: 14,
    height: 14,
    backgroundColor: WEROL_TOKENS.lime,
    marginBottom: 8,
  },
  tagline: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 13,
    letterSpacing: 4,
    color: WEROL_TOKENS.lime,
  },
});
