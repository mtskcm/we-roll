// ProductCard — Maroš v2 design.
// Full-bleed product image; right-edge action bar; bottom overlay
// (gradient backdrop) with brand chip, live badge, name, price, BUY + DETAILS.

import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import CartIcon from '../assets/icons/cart.svg';
import HangerIcon from '../assets/icons/hanger.svg';
import HeartIcon from '../assets/icons/heart.svg';
import ShareIcon from '../assets/icons/share.svg';
import { OUTFIT_SLOTS } from '../data/outfitSlots';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { DARK_COLORS, getShopColor, WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { OutfitSlotId, Product } from '../types';
import { getPartnerMark } from './partnerMarks';

type Props = {
  product: Product;
  height: number;
  /** Height reserved for the bottom nav + safe-area inset, so info sits above it. */
  bottomSafeArea?: number;
  onBuy?: () => void;
  onDetails?: () => void;
};

const BOTTOM_NAV_HEIGHT = 78;

function watchingFor(product: Product): number {
  return 200 + ((product.likes * 7 + product.id.charCodeAt(0)) % 1400);
}

function findSlotForProduct(category: Product['category']): OutfitSlotId | null {
  const slot = OUTFIT_SLOTS.find((s) => s.categories.includes(category));
  return slot?.id ?? null;
}

// Resolve an image's intrinsic aspect ratio (width / height). Local assets
// resolve synchronously; remote URLs fall back to 0.8 (our portrait default)
// until Image.getSize returns.
function useImageAspectRatio(source: ImageSourcePropType): number {
  const initial = () => {
    const r = Image.resolveAssetSource(source);
    if (r && r.width && r.height) return r.width / r.height;
    return 0.8;
  };
  const [ar, setAr] = useState<number>(initial);

  useEffect(() => {
    const r = Image.resolveAssetSource(source);
    if (r && r.width && r.height) {
      setAr(r.width / r.height);
      return;
    }
    if (r && r.uri) {
      let active = true;
      Image.getSize(
        r.uri,
        (w, h) => {
          if (active && w && h) setAr(w / h);
        },
        () => {},
      );
      return () => {
        active = false;
      };
    }
  }, [source]);

  return ar;
}

export function ProductCard({ product, height, bottomSafeArea = 0, onBuy, onDetails }: Props) {
  const infoBottomOffset = BOTTOM_NAV_HEIGHT + bottomSafeArea + 8;
  // Photo occupies everything from under the logo down to just above the
  // product info block (brand chip / name / color / price+BUY row ≈ 150px).
  const imageZoneHeight = Math.max(0, height - infoBottomOffset - 150);
  const imageAspect = useImageAspectRatio(product.image);
  const shop = getShopColor(product.shop.name);
  const PartnerMark = getPartnerMark(product.shop.name);
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);
  const showToast = useShareStore((s) => s.showToast);
  const setSlot = useUserStore((u) => u.setSlot);
  const draftOutfit = useUserStore((u) => u.draftOutfit);

  const slotForProduct = useMemo(() => findSlotForProduct(product.category), [product.category]);
  const inFit = slotForProduct ? draftOutfit[slotForProduct] === product.id : false;

  const fitFlash = useSharedValue(0);
  const handleAddToFit = () => {
    if (!slotForProduct) {
      showToast('Tento kúsok zatiaľ nemá FIT slot');
      return;
    }
    setSlot(slotForProduct, product.id);
    showToast(`Pridané do FIT-u · ${slotForProduct.toUpperCase()}`);
    fitFlash.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 380, easing: Easing.in(Easing.cubic) }),
    );
  };

  const fitFlashStyle = useAnimatedStyle(() => ({
    opacity: fitFlash.value,
    transform: [{ scale: 0.4 + fitFlash.value * 1.2 }],
  }));

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
        {/* Blurred backdrop — same image stretched to cover, blurred, dimmed */}
        <Image
          source={product.image}
          style={styles.backdrop}
          resizeMode="cover"
          blurRadius={28}
        />
        <View style={styles.backdropDim} pointerEvents="none" />
        <BlurView intensity={40} tint="dark" style={styles.backdropBlur} pointerEvents="none" />
        {/* Foreground — full width at the image's natural height (edge-to-edge,
            no over-zoom), top-anchored under the logo, capped above the info. */}
        <Image
          source={product.image}
          style={[styles.image, { aspectRatio: imageAspect, maxHeight: imageZoneHeight }]}
          resizeMode="cover"
        />

        {/* Bottom gradient for overlay info legibility */}
        <LinearGradient
          colors={['rgba(10,10,12,0)', 'rgba(10,10,12,0.55)', 'rgba(10,10,12,0.95)']}
          locations={[0, 0.5, 1]}
          style={[styles.bottomGradient, { height: infoBottomOffset + 320 }]}
          pointerEvents="none"
        />

        {/* Right-edge action bar — vertically near the middle of the visible area */}
        <View style={[styles.actionBar, { bottom: infoBottomOffset + 220 }]}>
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
          <View>
            <SideAction
              Icon={HangerIcon}
              label="FIT"
              active={inFit}
              activeColor={WEROL_TOKENS.lime}
              onPress={handleAddToFit}
            />
            <Animated.View pointerEvents="none" style={[styles.fitFlash, fitFlashStyle]}>
              <Text style={styles.fitFlashText}>+1</Text>
            </Animated.View>
          </View>
        </View>

        {/* Bottom overlay info — sits above the BottomNav */}
        <View style={[styles.info, { bottom: infoBottomOffset }]} pointerEvents="box-none">
          <View style={styles.brandRow}>
            <View style={[styles.brandTag, { backgroundColor: shop.bg }]}>
              {PartnerMark ? (
                <PartnerMark width={10} height={10} />
              ) : (
                <View style={styles.brandDot} />
              )}
              <Text style={[styles.brandText, { color: shop.text }]}>
                {product.brand.toUpperCase()}
              </Text>
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

          <View style={styles.ctaRow}>
            <View style={styles.priceBlock}>
              <Text style={styles.price}>
                {product.price.current} {product.price.currency}
              </Text>
              {product.price.original !== undefined && (
                <Text style={styles.priceOld}>
                  {product.price.original} {product.price.currency}
                </Text>
              )}
            </View>
            <Pressable
              onPress={onBuy}
              style={({ pressed }) => [styles.buyBtn, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.buyChip, { backgroundColor: shop.bg }]}>
                <CartIcon width={12} height={12} stroke={shop.text} strokeWidth={2} fill="none" />
              </View>
              <Text style={styles.buyText}>BUY ON {product.shop.name.toUpperCase()}</Text>
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
          width={20}
          height={20}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.35)',
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  // Right-edge action bar — vertically centered on image
  actionBar: {
    position: 'absolute',
    right: 10,
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
  fitFlash: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: WEROL_TOKENS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fitFlashText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 11,
    color: WEROL_TOKENS.pitch,
    letterSpacing: -0.4,
  },
  info: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
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
  priceBlock: {
    justifyContent: 'center',
    minWidth: 64,
  },
  price: {
    fontFamily: FONTS.archivo,
    fontSize: 22,
    letterSpacing: -0.8,
    color: WEROL_TOKENS.paper,
  },
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: WEROL_TOKENS.muted2,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
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
    borderRadius: RADII.pill,
  },
  buyChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
});
