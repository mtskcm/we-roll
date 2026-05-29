// ProductDetailsScreen — v1 stub: header + hero + brand chip + live badge + name/price
// + bottom action bar (heart/bookmark + BUY pill). Tag chips + SIMILAR PIECES are out of scope.

import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../assets/icons/back.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import DotsIcon from '../assets/icons/dots.svg';
import HeartIcon from '../assets/icons/heart.svg';
import ShareIcon from '../assets/icons/share.svg';
import { BuyRedirectSheet } from '../components/BuyRedirectSheet';
import { getPartnerMark } from '../components/partnerMarks';
import { PRODUCTS } from '../data/products';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useShareStore } from '../store/shareStore';
import { DARK_COLORS, SHOP_COLORS, WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Props = {
  route?: { params?: { productId?: string } };
  navigation?: any;
};

function watchingFor(product: Product): number {
  return 200 + ((product.likes * 7 + product.id.charCodeAt(0)) % 1400);
}

export function ProductDetailsScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const productId = route?.params?.productId;
  const product = PRODUCTS.find((p) => p.id === productId) ?? PRODUCTS[0];
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);
  const [buyOpen, setBuyOpen] = useState(false);

  const productIdx = PRODUCTS.findIndex((p) => p.id === product.id);
  const watching = watchingFor(product);
  const shop = SHOP_COLORS[product.shop.name];
  const Mark = getPartnerMark(product.shop.name);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.5 + pulse.value * 0.5,
    transform: [{ scale: 0.9 + pulse.value * 0.3 }],
  }));

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 70,
          paddingBottom: insets.bottom + 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <Image
            source={product.image}
            style={styles.heroBackdrop}
            resizeMode="cover"
            blurRadius={28}
          />
          <View style={styles.heroDim} pointerEvents="none" />
          <BlurView intensity={40} tint="dark" style={styles.heroBlur} pointerEvents="none" />
          <Image source={product.image} style={styles.hero} resizeMode="contain" />
        </View>

        <View style={styles.body}>
          <View style={styles.row}>
            <View style={[styles.brandTag, { backgroundColor: shop.bg }]}>
              {Mark ? <Mark width={10} height={10} /> : <View style={styles.brandDot} />}
              <Text style={[styles.brandText, { color: shop.text }]}>
                {product.brand.toUpperCase()}
              </Text>
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveText}>{watching.toLocaleString()} WATCHING</Text>
            </View>
          </View>

          <Text style={styles.name}>{product.name.toUpperCase()}</Text>
          <Text style={styles.color}>{product.shop.name.toUpperCase()}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {product.price.current} {product.price.currency}
            </Text>
            {product.price.original !== undefined && (
              <Text style={styles.priceOld}>
                {product.price.original} {product.price.currency}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Top header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Back"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <BackIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
          </Pressable>

          <View style={styles.indicator}>
            <Text style={styles.indicatorCur}>N°{pad2(productIdx + 1)}</Text>
            <Text style={styles.indicatorSep}> / </Text>
            <Text style={styles.indicatorTotal}>{pad2(PRODUCTS.length)}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              accessibilityLabel="Share"
              onPress={() => openShare(product)}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <ShareIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
            </Pressable>
            <Pressable
              accessibilityLabel="More"
              onPress={() => {}}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <DotsIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bottom action bar */}
      <View
        style={[styles.actionBar, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}
        pointerEvents="box-none"
      >
        <Pressable
          accessibilityLabel="Like"
          onPress={() => toggleLike(product.id)}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
        >
          <HeartIcon
            width={20}
            height={20}
            stroke={liked ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={liked ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="Save"
          onPress={() => toggleSaved(product.id)}
          style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.7 }]}
        >
          <BookmarkIcon
            width={20}
            height={20}
            stroke={saved ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={saved ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
        </Pressable>

        <Pressable
          onPress={() => setBuyOpen(true)}
          style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.85 }]}
        >
          <View style={[styles.buyChip, { backgroundColor: shop.bg }]}>
            <CartIcon width={12} height={12} stroke={shop.text} strokeWidth={2} fill="none" />
          </View>
          <Text style={styles.buyText}>
            BUY · {product.price.current} {product.price.currency}
          </Text>
        </Pressable>
      </View>

      <BuyRedirectSheet
        product={buyOpen ? product : null}
        onClose={() => setBuyOpen(false)}
      />
    </View>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  heroWrap: {
    marginHorizontal: SPACING.section,
    aspectRatio: 0.78,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
    position: 'relative',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  heroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.35)',
  },
  body: {
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  brandDot: {
    width: 8,
    height: 8,
    backgroundColor: WEROL_TOKENS.paper,
  },
  brandText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34,197,94,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DARK_COLORS.liveGreen,
  },
  liveText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: DARK_COLORS.liveGreen,
  },
  name: {
    fontFamily: FONTS.archivo,
    fontSize: 32,
    letterSpacing: -1.4,
    lineHeight: 34,
    color: WEROL_TOKENS.paper,
    marginTop: 4,
  },
  color: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginTop: 6,
  },
  price: {
    fontFamily: FONTS.archivo,
    fontSize: 26,
    letterSpacing: -1,
    color: WEROL_TOKENS.paper,
  },
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: WEROL_TOKENS.muted2,
    textDecorationLine: 'line-through',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,12,0.85)',
    paddingHorizontal: SPACING.section,
    paddingBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: 6,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,22,26,0.6)',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(22,22,26,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  indicatorCur: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: WEROL_TOKENS.paper,
  },
  indicatorSep: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: WEROL_TOKENS.muted2,
  },
  indicatorTotal: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 1,
    color: WEROL_TOKENS.muted,
  },
  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.md,
    backgroundColor: 'rgba(10,10,12,0.9)',
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    backgroundColor: WEROL_TOKENS.paper,
    paddingLeft: 6,
    paddingRight: 14,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  buyChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
});
