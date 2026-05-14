import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { FONTS } from '../theme/typography';

type Props = {
  initials: string;
  size?: number;
  bg?: string;
  textColor?: string;
  borderColor?: string;
};

export function ShopAvatar({
  initials,
  size = 32,
  bg = 'rgba(0,0,0,0.18)',
  textColor = COLORS.cream,
  borderColor = 'rgba(255,255,255,0.12)',
}: Props) {
  return (
    <View
      style={[
        styles.root,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bg, borderColor },
      ]}
    >
      <Text style={[styles.txt, { color: textColor, fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txt: {
    fontFamily: FONTS.spaceMonoBold,
    letterSpacing: 0.5,
  },
});
