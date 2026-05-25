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
  const [topNavHeight, setTopNavHeight] = useState(110);

  const itemHeight = winHeight - insets.bottom - BOTTOM_NAV_HEIGHT - topNavHeight;

  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const swipeHintDismissed = useFeedStore((s) => s.swipeHintDismissed);
  const dismissSwipeHint = useFeedStore((s) => s.dismissSwipeHint);
  const consumePendingFeedIndex = useFeedStore((s) => s.consumePendingFeedIndex);

  const [activeProduct, setActiveProduct] = useState<Product>(
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
      <View
        style={styles.headerWrap}
        onLayout={(e) => setTopNavHeight(e.nativeEvent.layout.height)}
      >
        <TopNav
          currentIndex={currentIndex}
          total={PRODUCTS.length}
          onSearch={() => navigation.navigate('Search')}
          onNotifications={() => navigation.navigate('Messages')}
        />
      </View>
      <View style={styles.feedWrap}>
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
        {!swipeHintDismissed && (
          <View pointerEvents="none" style={styles.hintHolder}>
            <SwipeHint />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: WEROL_TOKENS.pitch,
  },
  headerWrap: {
    backgroundColor: WEROL_TOKENS.pitch,
  },
  feedWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  hintHolder: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: 'center',
  },
});
