// ProductCard — TikTok-clean (redesign v3).
// EVERY product photo renders WHOLE at its native aspect ratio (1:1 studio
// shots, 2:3 on-model shots, …) above the info block — never cropped. The
// screen still reads full-bleed: behind the photo sits a blurred cover copy
// of itself, and the photo's edges dissolve into it via an SVG gradient mask.
// Interactions: double-tap = like (heart pop), long-press = clean-photo mode
// (all chrome hides while held). Tap does nothing — buying goes through BUY.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import HeartIcon from '../assets/icons/heart.svg';
import ShareIcon from '../assets/icons/share.svg';
import { BrandBadge } from './BrandBadge';
import { shopLogoKey } from './brandLogos';
import { RailAction } from './RailAction';
import { useEngagementStore } from '../store/engagementStore';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useOrdersStore } from '../store/ordersStore';
import { useSaveSheetStore } from '../store/saveSheetStore';
import { useShareStore } from '../store/shareStore';
import { formatCount, formatPrice } from '../lib/format';
import { shareProduct } from '../lib/shareProduct';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Props = {
  product: Product;
  height: number;
  /** Height reserved for the bottom nav + safe-area inset, so info sits above it. */
  bottomSafeArea?: number;
  /** Top safe-area inset — apparel photos stretch down from just below the WEROL logo. */
  topSafeArea?: number;
  onBuy?: () => void;
};

const BOTTOM_NAV_HEIGHT = 78;
const DOUBLE_TAP_MS = 280;

// Photo fills the full card width edge-to-edge (no side gaps); the whole
// product stays visible at its native ratio, bottom-anchored above the info.
const PHOTO_SCALE = 1;
// Flat backdrop matching typical studio product-shot backgrounds — photos sit
// on it cleanly (no blur layers, per design feedback: blur looked smudgy).
const SHOT_BG = '#EFEEF0';
// Small studio objects (shoes, caps, bags…): whole product, native ratio,
// bottom-anchored. Apparel (on-model shots) STRETCHES to fill the area from
// just below the WEROL logo down to the info block — same feathered edges as
// the studio shots; the strip behind info/BUY continues the photo as a blur.
const CONTAIN_CATEGORIES = new Set(['sneakers', 'accessories', 'caps']);
// How far studio shots (shoes/accessories) sit above the black info panel
// (the gradient transition zone lives in this gap — per design reference).
const PHOTO_LIFT = 118;
// Vertical-only edge melt: the photo's TOP and BOTTOM edges fade into the
// backdrop so they're invisible; sides stay sharp (no "blurry photo" look).
const SHOT_BG_T = 'rgba(239,238,240,0)';
const EDGE_MELT = 36;

/** Native aspect ratio (height ÷ width) of an image source; 1 until known. */
function useImageAspect(source: ImageSourcePropType): number {
  const [ratio, setRatio] = useState(1);
  useEffect(() => {
    if (typeof source === 'number') {
      const a = Image.resolveAssetSource(source);
      if (a?.width && a?.height) setRatio(a.height / a.width);
      return;
    }
    const uri = (source as { uri?: string })?.uri;
    if (!uri) return;
    let alive = true;
    Image.getSize(
      uri,
      (w, h) => { if (alive && w > 0) setRatio(h / w); },
      () => {},
    );
    return () => { alive = false; };
  }, [source]);
  return ratio;
}

function ProductCardInner({ product, height, bottomSafeArea = 0, topSafeArea = 0, onBuy }: Props) {
  const { width: winWidth } = useWindowDimensions();
  const infoBottomOffset = BOTTOM_NAV_HEIGHT + bottomSafeArea + 8;
  const isApparel = !CONTAIN_CATEGORIES.has(product.category);
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const recordEngagement = useEngagementStore((s) => s.record);
  const showToast = useShareStore((s) => s.showToast);

  // Default BUY: engagement + order history + affiliate deeplink. Living
  // inside the card keeps FeedScreen's renderItem props stable (memo works).
  const handleBuy = () => {
    recordEngagement(product, 'buy');
    useOrdersStore.getState().addOrder(product);
    Linking.openURL(product.takeItUrl).catch(() => showToast("Couldn't open the shop"));
  };

  // Measured height of the info block → the photo area ends right above it.
  const [infoH, setInfoH] = useState(170);
  // Tap the (truncated) product name to expand it to the full text.
  const [nameExpanded, setNameExpanded] = useState(false);

  // Double-tap like + IG-style heart pop.
  const lastTap = useRef(0);
  const pop = useSharedValue(0);
  const heartStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.6 + pop.value * 0.55 }],
  }));
  const onMediaPress = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      lastTap.current = 0;
      if (!liked) {
        toggleLike(product.id);
        recordEngagement(product, 'like');
      }
      pop.value = 0;
      pop.value = withSequence(
        withSpring(1, { damping: 14, stiffness: 260 }),
        withDelay(80, withTiming(0, { duration: 160 })), // quick in, quick out
      );
    } else {
      lastTap.current = now;
    }
  };

  // Photo geometry: the photo renders whole at its native ratio, slightly
  // shrunk and anchored to the BOTTOM of the area above the info block — the
  // product sits just above the nav/info with air on top. Clean & sharp: no
  // blur layers, no dissolve masks.
  const ratio = useImageAspect(product.image);
  const areaH = Math.max(1, height - (infoBottomOffset + infoH + 6));
  const drawW = Math.round(winWidth * PHOTO_SCALE);
  const renderedH = Math.min(areaH, Math.round(drawW * ratio));

  return (
    <View style={[styles.card, { height }]}>
      <View style={[styles.imageWrap, { backgroundColor: SHOT_BG }]}>
        {isApparel ? (
          /* Apparel: photo runs from the very top edge (behind the WEROL logo)
             down to the shop-badge panel; the tall dark transition overlays its
             lower part, so no visible edge anywhere. */
          <View
            style={[styles.apparelArea, { top: 0, bottom: infoBottomOffset + infoH + 6 }]}
            pointerEvents="none"
          >
            <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        ) : (
          /* Small studio objects: whole sharp photo, lifted above the transition */
          <View
            style={[styles.shotArea, { bottom: infoBottomOffset + infoH + PHOTO_LIFT }]}
            pointerEvents="none"
          >
            <View style={{ width: drawW, height: renderedH }}>
              <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="contain" />
              <LinearGradient colors={[SHOT_BG, SHOT_BG_T]} style={styles.meltTop} />
              <LinearGradient colors={[SHOT_BG_T, SHOT_BG]} style={styles.meltBottom} />
            </View>
          </View>
        )}

        {/* Bottom: tall soft gradient into a solid black panel (per design ref) */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', WEROL_TOKENS.pitch]}
          locations={[0, 0.55, 1]}
          style={[styles.bottomFade, { bottom: infoBottomOffset + infoH + 6 }]}
          pointerEvents="none"
        />
        <View
          style={[styles.bottomStrip, { height: infoBottomOffset + infoH + 6 }]}
          pointerEvents="none"
        />

        {/* Media gestures: double-tap = like */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onMediaPress} />

        {/* Heart pop (double-tap feedback) */}
        <Animated.View pointerEvents="none" style={[styles.heartPop, heartStyle]}>
          <HeartIcon width={96} height={96} stroke={WEROL_TOKENS.paper} fill={WEROL_TOKENS.paper} strokeWidth={1.2} />
        </Animated.View>

        {(
          <>
            {/* Top gradient — keeps the WEROL logo + top icons legible on light shots */}
            <LinearGradient
              colors={['rgba(10,10,12,0.55)', 'rgba(10,10,12,0)']}
              locations={[0, 1]}
              style={styles.topGradient}
              pointerEvents="none"
            />
            {/* Right rail — heart / save / share. Sits on the photo just above
                the info panel; BLACK icons (studio photos have white bgs). */}
            {/* Rail sits LOW like Instagram — inside the dark bottom transition,
                so white icons are always legible regardless of the photo. */}
            <View style={[styles.rail, { bottom: infoBottomOffset + infoH + 36 }]}>
              <RailAction
                Icon={HeartIcon}
                active={liked}
                color={WEROL_TOKENS.paper}
                strokeWidth={2}
                label={formatCount(product.likes + (liked ? 1 : 0))}
                onPress={() => {
                  recordEngagement(product, liked ? 'unlike' : 'like');
                  toggleLike(product.id);
                }}
              />
              <RailAction
                Icon={BookmarkIcon}
                active={saved}
                color={WEROL_TOKENS.paper}
                strokeWidth={2}
                onPress={() => {
                  if (!saved) recordEngagement(product, 'save');
                  useSaveSheetStore.getState().openFor(product); // pick a collection
                }}
              />
              <RailAction
                Icon={ShareIcon}
                color={WEROL_TOKENS.paper}
                strokeWidth={2}
                onPress={() => {
                  recordEngagement(product, 'share');
                  shareProduct(product);
                }}
              />
            </View>

            {/* Bottom-left info — shop badge · name · price + BUY */}
            <View
              style={[styles.info, { bottom: infoBottomOffset }]}
              pointerEvents="box-none"
              onLayout={(e) => setInfoH(Math.round(e.nativeEvent.layout.height))}
            >
              {/* Shop badge + product name in one row; tap the name to expand it */}
              <View style={styles.textBlock}>
                <BrandBadge brand={product.shop.name} height={24} />
                <Text
                  style={styles.name}
                  numberOfLines={nameExpanded ? undefined : 1}
                  onPress={() => setNameExpanded((v) => !v)}
                  suppressHighlighting
                >
                  {product.name}
                </Text>
              </View>

              {/* Price beside the BUY pill */}
              <View style={styles.buyRow}>
                <View>
                  <Text style={styles.price}>
                    {formatPrice(product.price.current, product.price.currency)}
                  </Text>
                  {product.price.original !== undefined && (
                    <Text style={styles.priceOld}>
                      {formatPrice(product.price.original, product.price.currency)}
                    </Text>
                  )}
                </View>
                <Pressable
                  onPress={onBuy ?? handleBuy}
                  style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.88 }]}
                >
                  <CartIcon width={20} height={20} stroke={WEROL_TOKENS.pitch} strokeWidth={2.8} fill="none" />
                  <Text style={styles.buyText}>
                    {product.shop.name ? `BUY ON ${shopLogoKey(product.shop.name).toUpperCase()}` : 'BUY'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// Memoized cell — with stable props from FeedScreen's renderItem, mounted
// cards skip re-renders entirely while the list updates around them.
export const ProductCard = React.memo(ProductCardInner);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: WEROL_TOKENS.pitch,
  },
  imageWrap: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.concrete,
    overflow: 'hidden',
    position: 'relative',
  },
  shotArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-end', // bottom-anchored: product sits just above the info
  },
  apparelArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  // Unified bottom: solid black panel + edge-to-edge fade above it
  bottomStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 180, // soft light→black transition (a touch shorter)
  },
  // Vertical-only photo edge melts (top/bottom invisible, sides sharp)
  meltTop: { position: 'absolute', top: 0, left: 0, right: 0, height: EDGE_MELT },
  meltBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: EDGE_MELT },
  heartPop: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 130,
  },
  // Right rail
  rail: {
    position: 'absolute',
    right: 12,
    gap: 20,
    alignItems: 'center',
  },
  // Bottom-left info
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
  },
  textBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 56, // keep the row clear of the rail
  },
  name: {
    flex: 1,
    fontFamily: FONTS.interSemibold,
    fontSize: 16,
    lineHeight: 21,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
  // Price sits beside the BUY pill
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
  },
  price: {
    fontFamily: FONTS.serif,
    fontSize: 34,
    color: WEROL_TOKENS.paper,
  },
  priceOld: {
    fontFamily: FONTS.manrope,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 17,
    borderRadius: RADII.pill,
  },
  buyText: {
    fontFamily: FONTS.button,
    fontSize: 16,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.pitch,
  },
});
