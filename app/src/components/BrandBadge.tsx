// BrandBadge — the shop's real logo on a small white badge (cover-cropped),
// with a text fallback when no logo is mapped. Reused across the feed card,
// BUY button and product detail header.

import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { getBrandLogo, shopLogoKey } from './brandLogos';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

export function BrandBadge({
  brand,
  height = 24,
  textColor = WEROL_TOKENS.paper,
}: {
  brand: string;
  height?: number;
  textColor?: string;
}) {
  const logo = getBrandLogo(brand);
  if (logo) {
    return (
      <View
        style={[
          styles.badge,
          { height, width: Math.round(height * logo.aspect), borderRadius: Math.round(height * 0.25), padding: Math.round(height * 0.13) },
        ]}
      >
        <Image source={logo.source} style={styles.logo} resizeMode={logo.fit ?? 'cover'} />
      </View>
    );
  }
  return (
    <Text style={[styles.text, { fontSize: Math.round(height * 0.5), color: textColor }]} numberOfLines={1}>
      {(shopLogoKey(brand) || brand || '').toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: WEROL_TOKENS.paper,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  text: {
    fontFamily: FONTS.jetbrainsMonoBold,
    letterSpacing: 1.5,
  },
});
