// BuyRedirectSheet — confirmation sheet shown before opening the external shop.
// Matches Maroš v2 "REDIRECT TO ESHOP / You're leaving Werol" design.

import React, { useEffect } from 'react';
import { Image, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CartIcon from '../assets/icons/cart.svg';
import CloseIcon from '../assets/icons/close.svg';
import { SHOP_COLORS, WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Props = {
  product: Product | null;
  onClose: () => void;
};

function shopDomain(shopName: string): string {
  return `${shopName.toLowerCase().replace(/[\s.]/g, '')}.com`;
}

export function BuyRedirectSheet({ product, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const visible = !!product;

  const translateY = useSharedValue(600);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(600, { duration: 220, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!product) {
    return (
      <Modal visible={false} transparent animationType="none">
        <View />
      </Modal>
    );
  }

  const shop = SHOP_COLORS[product.shop.name];
  const domain = shopDomain(product.shop.name);

  const handleContinue = () => {
    onClose();
    Linking.openURL(product.takeItUrl).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + SPACING.md },
            sheetStyle,
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerLabel}>REDIRECT TO ESHOP</Text>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <CloseIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.6} fill="none" />
            </Pressable>
          </View>

          <Text style={styles.title}>You're leaving Werol</Text>
          <Text style={styles.subtitle}>
            we'll open{' '}
            <Text style={[styles.subtitleAccent, { color: shop.bg }]}>{domain}</Text> to complete checkout
          </Text>

          <View style={styles.productRow}>
            <Image source={product.image} style={styles.thumb} resizeMode="cover" />
            <View style={styles.productMeta}>
              <View style={[styles.shopChip, { backgroundColor: shop.bg }]}>
                <Text style={[styles.shopChipText, { color: shop.text }]}>
                  {product.shop.name.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.productName} numberOfLines={2}>
                {product.name.toUpperCase()}
              </Text>
              <Text style={styles.productBrand}>{product.brand.toUpperCase()}</Text>
            </View>
            <Text style={styles.productPrice}>
              {product.price.current} {product.price.currency}
            </Text>
          </View>

          <View style={styles.ctaRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.cancelText}>CANCEL</Text>
            </Pressable>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
            >
              <CartIcon
                width={14}
                height={14}
                stroke={WEROL_TOKENS.pitch}
                strokeWidth={2}
                fill="none"
              />
              <Text style={styles.continueText}>CONTINUE ON {product.shop.name.toUpperCase()}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  title: {
    fontFamily: FONTS.archivoBold,
    fontSize: 24,
    letterSpacing: -0.8,
    color: WEROL_TOKENS.paper,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
    marginTop: -4,
  },
  subtitleAccent: {
    fontFamily: FONTS.archivoBold,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.md,
    padding: 10,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    backgroundColor: WEROL_TOKENS.line,
  },
  productMeta: {
    flex: 1,
    gap: 4,
  },
  shopChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  shopChipText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  productName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: -0.2,
    color: WEROL_TOKENS.paper,
  },
  productBrand: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted2,
  },
  productPrice: {
    fontFamily: FONTS.archivoBold,
    fontSize: 16,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  cancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.paper,
  },
  continueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
  },
  continueText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
    textAlign: 'center',
  },
});
