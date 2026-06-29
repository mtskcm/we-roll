// ProductCard — TikTok-clean (redesign v3).
// Full-bleed sharp image (cover, fills the whole card); minimal right rail
// (like / save / share); bottom-left brand · name · price; lime BUY pill.
// Full product info lives on the detail screen (tap the image).

import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import HeartIcon from '../assets/icons/heart.svg';
import ShareIcon from '../assets/icons/share.svg';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useShareStore } from '../store/shareStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Props = {
  product: Product;
  height: number;
  /** Height reserved for the bottom nav + safe-area inset, so info sits above it. */
  bottomSafeArea?: number;
  onBuy?: () => void;
  onDetails?: () => void;
};

const BOTTOM_NAV_HEIGHT = 78;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}

export function ProductCard({ product, height, bottomSafeArea = 0, onBuy, onDetails }: Props) {
  const infoBottomOffset = BOTTOM_NAV_HEIGHT + bottomSafeArea + 8;
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.imageWrap}>
        {/* Full-bleed product image */}
        <Image source={product.image} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* Tap anywhere on the media → product detail (under the rail/info) */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onDetails} />

        {/* Top gradient — keeps the WEROL logo + top icons legible on light shots */}
        <LinearGradient
          colors={['rgba(10,10,12,0.55)', 'rgba(10,10,12,0)']}
          locations={[0, 1]}
          style={styles.topGradient}
          pointerEvents="none"
        />
        {/* Bottom gradient — info/BUY legibility */}
        <LinearGradient
          colors={['rgba(10,10,12,0)', 'rgba(10,10,12,0.5)', 'rgba(10,10,12,0.92)']}
          locations={[0, 0.5, 1]}
          style={[styles.bottomGradient, { height: infoBottomOffset + 300 }]}
          pointerEvents="none"
        />

        {/* Right rail — like / save / share */}
        <View style={[styles.rail, { bottom: infoBottomOffset + 188 }]}>
          <RailAction
            Icon={HeartIcon}
            active={liked}
            label={formatCount(product.likes + (liked ? 1 : 0))}
            onPress={() => toggleLike(product.id)}
          />
          <RailAction Icon={BookmarkIcon} active={saved} onPress={() => toggleSaved(product.id)} />
          <RailAction Icon={ShareIcon} onPress={() => openShare(product)} />
        </View>

        {/* Bottom-left info — brand · name · price + BUY */}
        <View style={[styles.info, { bottom: infoBottomOffset }]} pointerEvents="box-none">
          <View style={styles.textBlock}>
            <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
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

          <Pressable
            onPress={onBuy}
            style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.88 }]}
          >
            <CartIcon width={15} height={15} stroke={WEROL_TOKENS.pitch} strokeWidth={2} fill="none" />
            <Text style={styles.buyText}>BUY ON {product.shop.name.toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RailAction({
  Icon,
  label,
  active = false,
  onPress,
}: {
  Icon: React.FC<{ width?: number; height?: number; stroke?: string; fill?: string; strokeWidth?: number }>;
  label?: string;
  active?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handle = () => {
    scale.value = withSequence(
      withTiming(0.8, { duration: 90 }),
      withSpring(1, { damping: 6, stiffness: 220 }),
    );
    onPress();
  };
  const color = active ? WEROL_TOKENS.lime : WEROL_TOKENS.paper;
  return (
    <Pressable onPress={handle} hitSlop={8} style={styles.railItem}>
      <Animated.View style={animStyle}>
        <Icon width={29} height={29} stroke={color} fill={active ? color : 'none'} strokeWidth={1.7} />
      </Animated.View>
      {label ? <Text style={styles.railLabel}>{label}</Text> : null}
    </Pressable>
  );
}

const SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.45,
  shadowRadius: 4,
};

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
  topGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 130,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Right rail
  rail: {
    position: 'absolute',
    right: 12,
    gap: 22,
    alignItems: 'center',
  },
  railItem: {
    alignItems: 'center',
    gap: 5,
    ...SHADOW,
  },
  railLabel: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    color: WEROL_TOKENS.paper,
    letterSpacing: 0.2,
    ...SHADOW,
  },
  // Bottom-left info
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
  },
  textBlock: {
    paddingRight: 56, // keep long names clear of the rail
    gap: 4,
  },
  brand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 12,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.paper,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: FONTS.spaceGrotesk,
    fontSize: 16,
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 0,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontFamily: FONTS.archivo,
    fontSize: 26,
    letterSpacing: -1,
    color: WEROL_TOKENS.paper,
  },
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  buyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 15,
    borderRadius: RADII.pill,
    marginTop: 14,
  },
  buyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
});
