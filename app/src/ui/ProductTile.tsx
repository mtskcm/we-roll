// ProductTile — UI kit primitive (Edition 03). Grid card for the Discover /
// Search catalog: 3:4 photo, volt brand label, name, bold price.

import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatPrice } from '../lib/format';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Props = {
  product: Product;
  onPress?: () => void;
};

export function ProductTile({ product, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
      <View style={styles.photoWrap}>
        <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      </View>
      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>
          {(product.brand || product.shop.name).toUpperCase()}
        </Text>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price.current, product.price.currency)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
  },
  photoWrap: {
    aspectRatio: 3 / 4,
    backgroundColor: WEROL_TOKENS.frame,
  },
  info: { padding: 12, paddingBottom: 14 },
  brand: {
    fontFamily: FONTS.manropeBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.lime,
  },
  name: {
    fontFamily: FONTS.manropeBold,
    fontSize: 13,
    lineHeight: 16,
    color: WEROL_TOKENS.paper,
    marginTop: 5,
  },
  price: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
    marginTop: 8,
  },
});
