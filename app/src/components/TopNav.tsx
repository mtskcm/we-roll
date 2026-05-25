import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchIcon from '../assets/icons/search.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { COLORS, SHOP_COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { TEXT_STYLES } from '../theme/typography';
import type { Product } from '../types';
import { ShopAvatar } from './ShopAvatar';

type Props = {
  product: Product;
  onSearch: () => void;
};

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}

export function TopNav({ product, onSearch }: Props) {
  const insets = useSafeAreaInsets();
  const shop = SHOP_COLORS[product.shop.name];

  const r = useSharedValue(hexToRgb(shop.bg)[0]);
  const g = useSharedValue(hexToRgb(shop.bg)[1]);
  const b = useSharedValue(hexToRgb(shop.bg)[2]);

  useEffect(() => {
    const [nr, ng, nb] = hexToRgb(shop.bg);
    r.value = withTiming(nr, { duration: 350 });
    g.value = withTiming(ng, { duration: 350 });
    b.value = withTiming(nb, { duration: 350 });
  }, [shop.bg, r, g, b]);

  const animPillBg = useAnimatedStyle(() => ({
    backgroundColor: `rgb(${Math.round(r.value)}, ${Math.round(g.value)}, ${Math.round(b.value)})`,
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.logoRow}>
        <WordmarkOnDark width={132} height={28} />
      </View>

      <Animated.View style={[styles.shopPill, animPillBg]}>
        <ShopAvatar
          initials={product.shop.initials}
          size={28}
          bg="rgba(0,0,0,0.18)"
          textColor={shop.text}
          borderColor="rgba(0,0,0,0.22)"
        />
        <View style={styles.shopText}>
          <Text style={[TEXT_STYLES.shopName, { color: shop.text }]} numberOfLines={1}>
            {product.shop.name}
          </Text>
          <Text
            style={[TEXT_STYLES.shopUrl, { color: shop.text, opacity: 0.7 }]}
            numberOfLines={1}
          >
            {product.shop.url}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Hľadať"
          onPress={onSearch}
          style={({ pressed }) => [
            styles.searchBtn,
            { opacity: pressed ? 0.7 : 1, borderColor: 'rgba(0,0,0,0.25)' },
          ]}
        >
          <SearchIcon width={16} height={16} stroke={shop.text} strokeWidth={2} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: SPACING.section,
    paddingBottom: SPACING.lg,
    gap: SPACING.lg,
  },
  logoRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
  },
  shopText: {
    flex: 1,
    gap: 1,
  },
  searchBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
