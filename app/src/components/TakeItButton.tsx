import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import ArrowRightIcon from '../assets/icons/arrow_right.svg';
import { useT } from '../i18n';
import { RADII } from '../theme/spacing';
import { TEXT_STYLES } from '../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  url: string;
  bg: string;
  textColor: string;
};

export function TakeItButton({ url, bg, textColor }: Props) {
  const t = useT();
  const [opening, setOpening] = useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    setOpening(true);
    opacity.value = withTiming(0.75, { duration: 180 });
    Linking.openURL(url).catch(() => {});
    setTimeout(() => {
      setOpening(false);
      opacity.value = withTiming(1, { duration: 220 });
    }, 1400);
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withTiming(0.97, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 180 });
      }}
      style={[styles.btn, { backgroundColor: bg }, animStyle]}
    >
      <View style={styles.inner}>
        <Text style={[TEXT_STYLES.takeItText, { color: textColor }]}>
          {opening ? t('product.opening') : t('product.takeIt')}
        </Text>
        {!opening && (
          <View style={styles.arrow}>
            <ArrowRightIcon width={16} height={16} stroke={textColor} strokeWidth={2} fill="none" />
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    marginTop: 1,
  },
});
