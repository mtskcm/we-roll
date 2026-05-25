// SplashScreen — WEROL. wordmark fades in, then "WEAR · ALL" types letter by letter,
// then everything fades into the next screen (~2.2s total).

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

const SLOGAN = ['W', 'E', 'A', 'R', ' ', '·', ' ', 'A', 'L', 'L'];
const LETTER_STEP = 85;        // ms between letters
const LETTER_DUR = 220;        // ms each letter fade-in
const SLOGAN_START = 380;      // when the first letter appears (after wordmark fade-in)
const HOLD_AFTER = 550;        // time to read after last letter
const OUTRO_DUR = 380;         // final fade-out

export function SplashScreen({ onFinish }: Props) {
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkScale = useSharedValue(0.92);
  const periodPulse = useSharedValue(0);
  const outroOpacity = useSharedValue(1);

  useEffect(() => {
    wordmarkOpacity.value = withTiming(1, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
    wordmarkScale.value = withTiming(1, {
      duration: 550,
      easing: Easing.out(Easing.cubic),
    });
    periodPulse.value = withDelay(
      180,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );

    const sloganFinish = SLOGAN_START + SLOGAN.length * LETTER_STEP + LETTER_DUR;
    outroOpacity.value = withSequence(
      withDelay(sloganFinish + HOLD_AFTER, withTiming(0, {
        duration: OUTRO_DUR,
        easing: Easing.in(Easing.cubic),
      }, () => {
        runOnJS(onFinish)();
      })),
    );
  }, [wordmarkOpacity, wordmarkScale, periodPulse, outroOpacity, onFinish]);

  const rootStyle = useAnimatedStyle(() => ({
    opacity: outroOpacity.value,
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ scale: wordmarkScale.value }],
  }));

  const periodStyle = useAnimatedStyle(() => ({
    opacity: periodPulse.value,
    transform: [{ scale: 0.6 + periodPulse.value * 0.4 }],
  }));

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <Text style={styles.backdropAR} pointerEvents="none">AR</Text>

      <View style={styles.center}>
        <Animated.View style={[styles.wordmarkRow, wordmarkStyle]}>
          <Text style={styles.wordmark}>WEROL</Text>
          <Animated.View style={[styles.period, periodStyle]} />
        </Animated.View>

        <View style={styles.sloganRow}>
          {SLOGAN.map((ch, i) => (
            <SloganLetter key={i} char={ch} index={i} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function SloganLetter({ char, index }: { char: string; index: number }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const delay = SLOGAN_START + index * LETTER_STEP;
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: LETTER_DUR, easing: Easing.out(Easing.cubic) }),
    );
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: LETTER_DUR, easing: Easing.out(Easing.cubic) }),
    );
  }, [opacity, translateY, index]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (char === ' ') return <View style={styles.sloganSpace} />;
  return <Animated.Text style={[styles.sloganChar, style]}>{char}</Animated.Text>;
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
    gap: 18,
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
  sloganRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sloganChar: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 13,
    letterSpacing: 4,
    color: WEROL_TOKENS.lime,
  },
  sloganSpace: {
    width: 6,
  },
});
