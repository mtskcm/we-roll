import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS, SHOP_COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { TEXT_STYLES } from '../theme/typography';
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

  return (
    <View style={[styles.card, { height }]}>
      <View style={styles.imageRow}>
        <View style={[styles.imageFrame, { height: imageHeight }]}>
          <Image source={product.image} style={styles.image} resizeMode="contain" />
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
});
