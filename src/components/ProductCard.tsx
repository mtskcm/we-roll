import React, { useEffect, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SHOP_COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import type { Product } from '../types';
import { useT } from '../i18n';
import { useFeedStore, useIsLiked, useIsSaved } from '../store/feedStore';
import { useShareStore } from '../store/shareStore';
import { ActionButton } from './ActionButton';
import { PriceTag } from './PriceTag';
import { TakeItButton } from './TakeItButton';

type Props = {
  product: Product;
  height: number;
};

function formatLikes(n: number, liked: boolean): string {
  const count = n + (liked ? 1 : 0);
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}

export function ProductCard({ product, height }: Props) {
  const t = useT();
  const liked = useIsLiked(product.id);
  const saved = useIsSaved(product.id);
  const toggleLike = useFeedStore((s) => s.toggleLike);
  const toggleSaved = useFeedStore((s) => s.toggleSaved);
  const openShare = useShareStore((s) => s.openShare);

  const shopColors = SHOP_COLORS[product.shop.name];

  const handleShare = () => openShare(product);

  const imageHeight = Math.round(height * 0.58);

  const watching = useMemo(
    () => 12 + ((product.likes * 7 + product.id.charCodeAt(0)) % 240),
    [product.id, product.likes],
  );

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + pulse.value * 0.55,
    transform: [{ scale: 0.9 + pulse.value * 0.3 }],
  }));

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.imageRow}>
        <View style={[styles.imageFrame, { height: imageHeight }]}>
          <Image source={product.image} style={styles.image} resizeMode="contain" />
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveDot, pulseStyle]} />
            <Text style={styles.liveText}>{watching}</Text>
            <Text style={styles.liveLabel}>WATCHING</Text>
          </View>
        </View>
        <View style={styles.sideActions}>
          <ActionButton
            icon="heart-outline"
            iconActive="heart"
            activeColor={COLORS.likeRed}
            label={formatLikes(product.likes, liked)}
            active={liked}
            onPress={() => toggleLike(product.id)}
          />
          <ActionButton icon="share-social-outline" label={t('product.share')} onPress={handleShare} />
          <ActionButton
            icon="bookmark-outline"
            iconActive="bookmark"
            activeColor={COLORS.teal}
            label={t('product.save')}
            active={saved}
            onPress={() => toggleSaved(product.id)}
          />
        </View>
      </View>

      <View style={styles.bottomBlock}>
        <View style={styles.info}>
          <Text style={TEXT_STYLES.productBrand}>{product.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <PriceTag
            current={product.price.current}
            original={product.price.original}
            currency={product.price.currency}
          />
        </View>
        <TakeItButton url={product.takeItUrl} bg={shopColors.bg} textColor={shopColors.text} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: COLORS.ink,
    paddingTop: SPACING.md,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SPACING.section,
    paddingRight: SPACING.lg,
    gap: SPACING.md,
  },
  imageFrame: {
    flex: 1,
    backgroundColor: COLORS.imagePlaceholder,
    borderRadius: RADII.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sideActions: {
    gap: 12,
    alignItems: 'center',
  },
  bottomBlock: {
    flex: 1,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.section,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
    justifyContent: 'space-between',
  },
  info: {
    gap: 6,
  },
  productName: {
    ...TEXT_STYLES.productName,
    marginTop: 2,
  },
  liveBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.liveGreen,
  },
  liveText: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 10,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveLabel: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 8,
    color: '#A0A0A6',
    letterSpacing: 1.2,
  },
});
