import { BlurView } from 'expo-blur';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, WEROL_TOKENS } from '../theme/colors';
import { TEXT_STYLES } from '../theme/typography';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconComponent = React.FC<{
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}>;

type Props = {
  Icon: IconComponent;
  IconActive?: IconComponent;
  activeColor?: string;
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function ActionButton({
  Icon,
  IconActive,
  activeColor = WEROL_TOKENS.lime,
  label,
  active = false,
  onPress,
}: Props) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: bg.value,
  }));

  const RenderIcon = active && IconActive ? IconActive : Icon;
  const iconColor = active ? activeColor : COLORS.cream;

  return (
    <View style={styles.wrap}>
      <AnimatedPressable
        style={[styles.btn, animStyle]}
        onPressIn={() => {
          scale.value = withTiming(0.88, { duration: 180 });
          bg.value = withTiming(1, { duration: 180 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 180 });
          bg.value = withTiming(0, { duration: 220 });
        }}
        onPress={onPress}
      >
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.overlay, overlayStyle]} />
        <RenderIcon
          width={20}
          height={20}
          stroke={iconColor}
          fill={active ? iconColor : 'none'}
          strokeWidth={1.8}
        />
      </AnimatedPressable>
      <Text style={[TEXT_STYLES.actionCount, styles.label]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 6,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.glassActive,
  },
  label: {
    textAlign: 'center',
    minWidth: 48,
  },
});
