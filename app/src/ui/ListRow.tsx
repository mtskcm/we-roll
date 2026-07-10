// ListRow — UI kit primitive (Edition 03). Settings-style row:
// leading icon · label · trailing value / chevron / custom control.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChevronIcon from '../assets/icons/arrow_right.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

type Props = {
  icon?: React.ReactNode;
  label: string;
  value?: string;
  chevron?: boolean;
  /** Custom trailing control (e.g. a toggle) — overrides value/chevron. */
  trailing?: React.ReactNode;
  danger?: boolean;
  divider?: boolean;
  onPress?: () => void;
};

export function ListRow({ icon, label, value, chevron, trailing, danger, divider = true, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && { opacity: 0.7 }]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={[styles.label, danger && { color: WEROL_TOKENS.danger }]}>{label}</Text>
      {trailing ?? (
        <>
          {value ? <Text style={styles.value}>{value}</Text> : null}
          {chevron ? (
            <ChevronIcon width={18} height={18} stroke={WEROL_TOKENS.muted2} strokeWidth={2.4} fill="none" />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  icon: { width: 24, alignItems: 'center' },
  label: {
    flex: 1,
    fontFamily: FONTS.manropeMedium,
    fontSize: 16,
    color: WEROL_TOKENS.paper,
  },
  value: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 15,
    color: WEROL_TOKENS.muted2,
  },
});
