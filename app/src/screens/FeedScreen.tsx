import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BuyRedirectSheet } from '../components/BuyRedirectSheet';
import { ProductCard } from '../components/ProductCard';
import { SwipeHint } from '../components/SwipeHint';
import { TopNav } from '../components/TopNav';
import { useProducts } from '../store/productsStore';
import { useFeedStore } from '../store/feedStore';
import { useUiStore } from '../store/uiStore';
import { WEROL_TOKENS } from '../theme/colors';
import type { Product } from '../types';

export function FeedScreen() {
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList<Product>>(null);
  const PRODUCTS = useProducts();

  // Full-bleed: each card fills the whole screen; the image runs edge-to-edge
  // to the very top (behind the status bar) and the TopNav floats over it.
  const itemHeight = winHeight;

  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const swipeHintDismissed = useFeedStore((s) => s.swipeHintDismissed);
  const dismissSwipeHint = useFeedStore((s) => s.dismissSwipeHint);
  const consumePendingFeedIndex = useFeedStore((s) => s.consumePendingFeedIndex);
  const setChromeHidden = useUiStore((s) => s.setChromeHidden);

  const [, setActiveProduct] = useState<Product>(
    PRODUCTS[currentIndex] ?? PRODUCTS[0],
  );
  const [buyTarget, setBuyTarget] = useState<Product | null>(null);

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      const idx = consumePendingFeedIndex();
      if (idx !== null && idx >= 0 && idx < PRODUCTS.length) {
        setCurrentIndex(idx);
        setActiveProduct(PRODUCTS[idx]);
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        });
      }
    });
    const unsubBlur = navigation.addListener('blur', () => setChromeHidden(false));
    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [navigation, consumePendingFeedIndex, setCurrentIndex, setChromeHidden]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first && first.index !== null && first.index !== undefined) {
      setCurrentIndex(first.index);
      const p = first.item as Product;
      if (p) setActiveProduct(p);
    }
  }).current;

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  const getItemLayout = useCallback(
    (_: ArrayLike<Product> | null | undefined, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
    [itemHeight],
  );

  return (
    <View style={styles.root}>
      <FlatList
        ref={listRef}
        data={PRODUCTS}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            height={itemHeight}
            bottomSafeArea={insets.bottom}
            onBuy={() => setBuyTarget(item)}
            onDetails={() => navigation.navigate('ProductDetails', { productId: item.id })}
          />
        )}
        pagingEnabled
        snapToInterval={itemHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={() => {
          dismissSwipeHint();
          setChromeHidden(true);
        }}
        onScrollEndDrag={() => setChromeHidden(false)}
        onMomentumScrollEnd={() => setChromeHidden(false)}
        initialScrollIndex={currentIndex}
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
      />

      {/* TopNav floats transparently over the full-bleed image */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TopNav onSearch={() => navigation.navigate('Search')} />
      </View>

      {!swipeHintDismissed && (
        <View pointerEvents="none" style={styles.hintHolder}>
          <SwipeHint />
        </View>
      )}

      <BuyRedirectSheet product={buyTarget} onClose={() => setBuyTarget(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  hintHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
  },
});
