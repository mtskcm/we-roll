// ProductCard — Maroš v2 design.
// Full-bleed product image; right-edge action bar; bottom overlay
// (gradient backdrop) with brand chip, live badge, name, price, BUY + DETAILS.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import ArrowRightIcon from '../assets/icons/arrow_right.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import HangerIcon from '../assets/icons/hanger.svg';
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
  onBuy?: () => void;
};

function watchingFor(product: Product): number {
  return 200 + ((product.likes * 7 + product.id.charCodeAt(0)) % 1400);
}

export function ProductCard({ product, height, onBuy }: Props) {
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);

  const watching = useMemo(() => watchingFor(product), [product]);

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
    <View style={[styles.card, { height }]}>
      <View style={styles.imageWrap}>
        <Image source={product.image} style={styles.image} resizeMode="cover" />

        {/* Bottom gradient for overlay legibility */}
        <LinearGradient
          colors={['rgba(10,10,12,0)', 'rgba(10,10,12,0.55)', 'rgba(10,10,12,0.95)']}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
          pointerEvents="none"
        />

        {/* Right-edge action bar */}
        <View style={styles.actionBar}>
          <SideAction
            Icon={HeartIcon}
            active={liked}
            activeColor={WEROL_TOKENS.lime}
            label={liked ? `${watching + 1}` : `${watching}`}
            onPress={() => toggleLike(product.id)}
          />
          <SideAction
            Icon={BookmarkIcon}
            active={saved}
            activeColor={WEROL_TOKENS.lime}
            label="SAVE"
            onPress={() => toggleSaved(product.id)}
          />
          <SideAction
            Icon={ShareIcon}
            label="SHARE"
            onPress={() => openShare(product)}
          />
          <SideAction
            Icon={HangerIcon}
            label="FIT"
            onPress={() => {}}
          />
        </View>

        {/* Bottom overlay info */}
        <View style={styles.info} pointerEvents="box-none">
          <View style={styles.brandRow}>
            <View style={styles.brandTag}>
              <View style={styles.brandDot} />
              <Text style={styles.brandText}>{product.brand.toUpperCase()}</Text>
            </View>
            <View style={styles.liveBadge}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveText}>{watching.toLocaleString()} WATCHING</Text>
            </View>
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {product.name.toUpperCase()}
          </Text>

          <Text style={styles.colorText}>{product.shop.name.toUpperCase()}</Text>

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

          <View style={styles.ctaRow}>
            <Pressable
              onPress={onBuy}
              style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.85 }]}
            >
              <CartIcon width={14} height={14} stroke={WEROL_TOKENS.pitch} strokeWidth={2} fill="none" />
              <Text style={styles.buyText}>BUY ON {product.shop.name.toUpperCase()}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.detailsBtn, pressed && { opacity: 0.6 }]}
              onPress={() => {}}
            >
              <Text style={styles.detailsText}>DETAILS</Text>
              <ArrowRightIcon width={12} height={12} stroke={WEROL_TOKENS.paper} strokeWidth={2} fill="none" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function SideAction({
  Icon,
  label,
  active = false,
  activeColor,
  onPress,
}: {
  Icon: React.FC<{ width?: number; height?: number; stroke?: string; fill?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  activeColor?: string;
  onPress: () => void;
}) {
  const color = active && activeColor ? activeColor : WEROL_TOKENS.paper;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.sideAction, pressed && { opacity: 0.7 }]}
    >
      <View style={styles.sideIcon}>
        <Icon
          width={18}
          height={18}
          stroke={color}
          fill={active ? color : 'none'}
          strokeWidth={1.8}
        />
      </View>
      <Text style={[styles.sideLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

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
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  // Right-edge action bar — vertically centered on image
  actionBar: {
    position: 'absolute',
    right: 10,
    top: '32%',
    gap: 14,
    alignItems: 'center',
  },
  sideAction: {
    alignItems: 'center',
    gap: 2,
  },
  sideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,10,12,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 8,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.md,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,44,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  brandDot: {
    width: 6,
    height: 6,
    backgroundColor: WEROL_TOKENS.paper,
  },
  brandText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.paper,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(214,255,61,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: WEROL_TOKENS.lime,
  },
  liveText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: WEROL_TOKENS.lime,
  },
  productName: {
    fontFamily: FONTS.archivo,
    fontSize: 30,
    letterSpacing: -1.2,
    lineHeight: 32,
    color: WEROL_TOKENS.paper,
    marginTop: 4,
  },
  colorText: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  price: {
    fontFamily: FONTS.archivo,
    fontSize: 22,
    letterSpacing: -0.8,
    color: WEROL_TOKENS.paper,
  },
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: WEROL_TOKENS.muted2,
    textDecorationLine: 'line-through',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  buyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 14,
    borderRadius: RADII.pill,
  },
  buyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(10,10,12,0.4)',
  },
  detailsText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.paper,
  },
});
