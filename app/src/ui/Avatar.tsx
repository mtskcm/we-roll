// Avatar — UI kit primitive (Edition 03). Photo if a uri is given, else
// initials on surface1, with a coloured ring (volt = you, tints = others).

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

type Props = {
  initials: string;
  uri?: string;
  size?: number;
  ring?: string; // ring colour; defaults to volt
};

export function Avatar({ initials, uri, size = 44, ring = WEROL_TOKENS.lime }: Props) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, borderColor: ring },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.img} resizeMode="cover" />
      ) : (
        <Text style={[styles.text, { fontSize: Math.round(size * 0.32) }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: { width: '100%', height: '100%' },
  text: {
    fontFamily: FONTS.manropeExtraBold,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
});
