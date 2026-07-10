// Chip — UI kit primitive (Edition 03).
// Filter chip: volt pill when active, surface pill otherwise. Optional count.

import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  label: string;
  active?: boolean;
  count?: number;
  onPress?: () => void;
};

export function Chip({ label, active, count, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
    >
      <Text style={[styles.text, active && styles.textActive]}>
        {label}
        {count !== undefined ? <Text style={[styles.count, active && styles.countActive]}>  {count}</Text> : null}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: WEROL_TOKENS.concrete,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: RADII.pill,
  },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  text: { fontFamily: FONTS.manropeSemibold, fontSize: 14, color: '#D6D7DB' },
  textActive: { fontFamily: FONTS.manropeBold, color: WEROL_TOKENS.pitch },
  count: { color: WEROL_TOKENS.muted2 },
  countActive: { color: 'rgba(10,11,12,0.6)' },
});
