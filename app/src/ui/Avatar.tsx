// Avatar — UI kit primitive (Edition 03). Initials on surface1 with a 2px
// coloured ring (volt = you, tint pops = other users).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

type Props = {
  initials: string;
  size?: number;
  ring?: string; // ring colour; defaults to volt
};

export function Avatar({ initials, size = 44, ring = WEROL_TOKENS.lime }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: ring,
        },
      ]}
    >
      <Text style={[styles.text, { fontSize: Math.round(size * 0.32) }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: FONTS.manropeExtraBold,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
});
