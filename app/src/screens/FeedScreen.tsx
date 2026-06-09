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

  // The feed area is whatever's left after the TopNav. Measure on layout;
  // pre-seed with an estimate so the FlatList mounts at the right size.
  const ESTIMATED_TOPNAV = 36;
  const [feedHeight, setFeedHeight] = useState(
    Math.max(0, winHeight - insets.top - ESTIMATED_TOPNAV),
  );

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
      length: feedHeight,
      offset: feedHeight * index,
      index,
    }),
    [feedHeight],
  );

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top }}>
        <TopNav
          onSearch={() => navigation.navigate('Search')}
          onNotifications={() => navigation.navigate('Messages')}
        />
      </View>

      <View
        style={styles.feedArea}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (h > 0 && Math.abs(h - feedHeight) > 1) setFeedHeight(h);
        }}
      >
        <FlatList
          ref={listRef}
          data={PRODUCTS}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              height={feedHeight}
              bottomSafeArea={insets.bottom}
              onBuy={() => setBuyTarget(item)}
              onDetails={() => navigation.navigate('ProductDetails', { productId: item.id })}
            />
          )}
          pagingEnabled
          snapToInterval={feedHeight}
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
        {!swipeHintDismissed && (
          <View pointerEvents="none" style={styles.hintHolder}>
            <SwipeHint />
          </View>
        )}
      </View>

      <BuyRedirectSheet product={buyTarget} onClose={() => setBuyTarget(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  feedArea: {
    flex: 1,
    overflow: 'hidden',
  },
  hintHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 120,
    alignItems: 'center',
  },
});
