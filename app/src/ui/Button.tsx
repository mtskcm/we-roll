// Button — UI kit primitive (Edition 03).
// Variants: primary (volt pill, UPPERCASE 700) · secondary (surface2 + border)
// · ghost (borderless volt text / bordered neutral) · danger (outline red).
// Sizes: md (default) · sm. Optional leading icon. Pressed/disabled built in.

import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'sm';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  /** Rendered before the label (e.g. an icon). */
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled, icon, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        pressed && pressedStyles[variant],
        disabled && disabledStyles[variant],
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          textStyles[variant],
          disabled && disabledText[variant],
        ]}
      >
        {variant === 'primary' ? label.toUpperCase() : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: RADII.pill,
  },
  icon: { marginRight: -2 },
  text: { fontFamily: FONTS.manropeBold, fontSize: 15, letterSpacing: 0.6 },
  textSm: { fontSize: 13, letterSpacing: 0.4 },
});

const sizeStyles: Record<Size, ViewStyle> = {
  md: { paddingVertical: 16, paddingHorizontal: 24 },
  sm: { paddingVertical: 11, paddingHorizontal: 22 },
};

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: WEROL_TOKENS.lime },
  secondary: { backgroundColor: WEROL_TOKENS.surface2, borderWidth: 1, borderColor: WEROL_TOKENS.line2 },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,81,71,0.45)' },
};

const pressedStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: WEROL_TOKENS.limePressed },
  secondary: { backgroundColor: '#26272C', borderColor: 'rgba(255,255,255,0.18)' },
  ghost: { opacity: 0.7 },
  danger: { opacity: 0.7 },
};

const disabledStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: '#2A2B2E' },
  secondary: { backgroundColor: '#141518', borderColor: 'rgba(255,255,255,0.05)' },
  ghost: { opacity: 0.4 },
  danger: { opacity: 0.4 },
};

const textStyles = {
  primary: { color: WEROL_TOKENS.pitch },
  secondary: { color: WEROL_TOKENS.paper, letterSpacing: 0 },
  ghost: { color: WEROL_TOKENS.paper, letterSpacing: 0 },
  danger: { color: WEROL_TOKENS.danger, letterSpacing: 0 },
} as const;

const disabledText = {
  primary: { color: '#5A5B60' },
  secondary: { color: '#4A4B50' },
  ghost: {},
  danger: {},
} as const;
