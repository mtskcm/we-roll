// ProductDetailsScreen — clean (HYPE-style). Header (back · brand · share),
// big title, product image on a light card, a details list, sticky BUY bar.

import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../assets/icons/back.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import HeartIcon from '../assets/icons/heart.svg';
import ShareIcon from '../assets/icons/share.svg';
import { BuyRedirectSheet } from '../components/BuyRedirectSheet';
import { useProducts } from '../store/productsStore';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useShareStore } from '../store/shareStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  route?: { params?: { productId?: string } };
  navigation?: any;
};

export function ProductDetailsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const PRODUCTS = useProducts();
  const productId = route?.params?.productId;
  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);
  const [buyOpen, setBuyOpen] = useState(false);

  const sku = product.id.includes(':') ? product.id.split(':')[1] : product.id;
  const rows: Array<[string, string]> = [
    ['Brand', product.brand || '—'],
    ['SKU', sku],
    ['Category', product.category.charAt(0).toUpperCase() + product.category.slice(1)],
    [
      'Price',
      product.price.original !== undefined
        ? `${product.price.current} ${product.price.currency}  (was ${product.price.original})`
        : `${product.price.current} ${product.price.currency}`,
    ],
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <Pressable
          accessibilityLabel="Back"
          onPress={() => navigation?.goBack?.()}
          hitSlop={10}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <BackIcon width={22} height={22} stroke={WEROL_TOKENS.paper} strokeWidth={1.9} fill="none" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.brand}</Text>
        <Pressable
          accessibilityLabel="Share"
          onPress={() => openShare(product)}
          hitSlop={10}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
        >
          <ShareIcon width={22} height={22} stroke={WEROL_TOKENS.paper} strokeWidth={1.9} fill="none" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{product.name}</Text>

        {/* Product image on a light card */}
        <View style={styles.imageCard}>
          <Image source={product.image} style={styles.image} resizeMode="contain" />
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Product Details</Text>
        <View style={styles.details}>
          {rows.map(([label, value], i) => (
            <View key={label} style={[styles.detailRow, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky bottom bar — like / save / BUY */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Pressable
          onPress={() => toggleLike(product.id)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <HeartIcon
            width={22}
            height={22}
            stroke={liked ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={liked ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
        </Pressable>
        <Pressable
          onPress={() => toggleSaved(product.id)}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <BookmarkIcon
            width={22}
            height={22}
            stroke={saved ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={saved ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
        </Pressable>
        <Pressable
          onPress={() => setBuyOpen(true)}
          style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.88 }]}
        >
          <CartIcon width={15} height={15} stroke={WEROL_TOKENS.pitch} strokeWidth={2} fill="none" />
          <Text style={styles.buyText}>
            BUY · {product.price.current} {product.price.currency}
          </Text>
        </Pressable>
      </View>

      <BuyRedirectSheet product={buyOpen ? product : null} onClose={() => setBuyOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: 10,
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 16,
    color: WEROL_TOKENS.paper,
    letterSpacing: 0.2,
  },
  title: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
    paddingHorizontal: SPACING.section,
    paddingTop: 6,
    paddingBottom: 16,
  },
  imageCard: {
    marginHorizontal: SPACING.section,
    aspectRatio: 1,
    borderRadius: 18,
    backgroundColor: '#F3F3F5',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sectionTitle: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 17,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
    paddingHorizontal: SPACING.section,
    paddingTop: 28,
    paddingBottom: 4,
  },
  details: {
    paddingHorizontal: SPACING.section,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  detailLabel: {
    fontFamily: FONTS.inter,
    fontSize: 15,
    color: WEROL_TOKENS.muted,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: FONTS.interSemibold,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.section,
    paddingTop: 12,
    backgroundColor: 'rgba(10,10,12,0.96)',
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  iconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 15,
    borderRadius: 9999,
  },
  buyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
});
