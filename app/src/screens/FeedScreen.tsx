import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Linking, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../components/ProductCard';
import { SwipeHint } from '../components/SwipeHint';
import { TopNav } from '../components/TopNav';
import { PRODUCTS } from '../data/products';
import { useFeedStore } from '../store/feedStore';
import { WEROL_TOKENS } from '../theme/colors';
import type { Product } from '../types';

const BOTTOM_NAV_HEIGHT = 78;

export function FeedScreen() {
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList<Product>>(null);

  // Image fills the full available height — TopNav floats on top as overlay.
  const itemHeight = winHeight - insets.bottom - BOTTOM_NAV_HEIGHT;

  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const swipeHintDismissed = useFeedStore((s) => s.swipeHintDismissed);
  const dismissSwipeHint = useFeedStore((s) => s.dismissSwipeHint);
  const consumePendingFeedIndex = useFeedStore((s) => s.consumePendingFeedIndex);

  const [, setActiveProduct] = useState<Product>(
    PRODUCTS[currentIndex] ?? PRODUCTS[0],
  );

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      const idx = consumePendingFeedIndex();
      if (idx !== null && idx >= 0 && idx < PRODUCTS.length) {
        setCurrentIndex(idx);
        setActiveProduct(PRODUCTS[idx]);
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        });
      }
    });
    return unsub;
  }, [navigation, consumePendingFeedIndex, setCurrentIndex]);

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
            onBuy={() => Linking.openURL(item.takeItUrl).catch(() => {})}
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
        onScrollBeginDrag={dismissSwipeHint}
        initialScrollIndex={currentIndex}
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
      />
      {/* TopNav floats on top of the image */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
        <TopNav
          currentIndex={currentIndex}
          total={PRODUCTS.length}
          onSearch={() => navigation.navigate('Search')}
          onNotifications={() => navigation.navigate('Messages')}
        />
      </View>
      {!swipeHintDismissed && (
        <View pointerEvents="none" style={styles.hintHolder}>
          <SwipeHint />
        </View>
      )}
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
    bottom: 90,
    alignItems: 'center',
  },
});
