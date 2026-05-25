// FIT tab — placeholder. Maroš design pending.
// Probable purpose: fit-check daily challenge or virtual try-on.

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HangerIcon from '../assets/icons/hanger.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

export function FitScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <HangerIcon
            width={48}
            height={48}
            stroke={WEROL_TOKENS.lime}
            strokeWidth={1.5}
            fill="none"
          />
        </View>
        <Text style={styles.eyebrow}>— COMING SOON</Text>
        <Text style={styles.title}>FIT</Text>
        <Text style={styles.body}>
          Tvoj denný fit-check.{'\n'}Pošli outfit, dostaň feedback.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
    paddingHorizontal: SPACING.section,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    backgroundColor: WEROL_TOKENS.concrete,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  eyebrow: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 3,
    color: WEROL_TOKENS.lime,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: FONTS.archivo,
    fontSize: 64,
    letterSpacing: -3,
    lineHeight: 64,
    color: WEROL_TOKENS.paper,
  },
  body: {
    fontFamily: FONTS.inter,
    fontSize: 15,
    lineHeight: 22,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
});
