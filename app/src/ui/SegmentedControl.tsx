// SegmentedControl — UI kit primitive (Edition 03). Surface pill container,
// volt pill on the active segment.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props<T extends string> = {
  options: Array<{ key: T; label: string }>;
  value: T;
  onChange: (key: T) => void;
  /** Stretch segments to fill the container width. */
  fill?: boolean;
  /** Smaller paddings/type — for tight header rows. */
  compact?: boolean;
};

export function SegmentedControl<T extends string>({ options, value, onChange, fill, compact }: Props<T>) {
  return (
    <View style={[styles.track, fill && { alignSelf: 'stretch' }]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              styles.segment,
              compact && styles.segmentCompact,
              fill && { flex: 1 },
              active && styles.segmentActive,
            ]}
          >
            <Text style={[styles.text, compact && styles.textCompact, active && styles.textActive]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.pill,
    padding: 4,
    gap: 2,
  },
  segment: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: RADII.pill,
    alignItems: 'center',
  },
  segmentCompact: { paddingVertical: 6, paddingHorizontal: 14 },
  segmentActive: { backgroundColor: WEROL_TOKENS.lime },
  text: { fontFamily: FONTS.manropeSemibold, fontSize: 14, color: WEROL_TOKENS.muted },
  textCompact: { fontSize: 12 },
  textActive: { fontFamily: FONTS.manropeBold, color: WEROL_TOKENS.pitch },
});
