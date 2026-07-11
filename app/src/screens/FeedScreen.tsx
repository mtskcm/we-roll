import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FilterSheet } from '../components/FilterSheet';
import { ProductCard } from '../components/ProductCard';
import { SwipeHint } from '../components/SwipeHint';
import { TopNav } from '../components/TopNav';
import { useEngagementStore } from '../store/engagementStore';
import {
  getAllProducts,
  useFeedFilter,
  useFeedProducts,
  useProductsStore,
} from '../store/productsStore';
import { FONTS } from '../theme/typography';
import { useFeedStore } from '../store/feedStore';
import { useUiStore } from '../store/uiStore';
import { WEROL_TOKENS } from '../theme/colors';
import type { Product } from '../types';

export function FeedScreen() {
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const listRef = useRef<FlatList<Product>>(null);
  const PRODUCTS = useFeedProducts();
  const feedFilter = useFeedFilter();
  const [filterOpen, setFilterOpen] = useState(false);

  // IG-style windowing: the list only ever holds a small page of the ranked
  // catalog; more is appended as you approach the end. Keeps VirtualizedList
  // updates cheap even with a 4k-product catalog.
  const PAGE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const data = useMemo(() => PRODUCTS.slice(0, visibleCount), [PRODUCTS, visibleCount]);

  // Full-bleed: each card fills the whole screen; the image runs edge-to-edge
  // to the very top (behind the status bar) and the TopNav floats over it.
  const itemHeight = winHeight;

  const currentIndex = useFeedStore((s) => s.currentIndex);
  const setCurrentIndex = useFeedStore((s) => s.setCurrentIndex);
  const swipeHintDismissed = useFeedStore((s) => s.swipeHintDismissed);
  const dismissSwipeHint = useFeedStore((s) => s.dismissSwipeHint);
  const consumePendingFeedIndex = useFeedStore((s) => s.consumePendingFeedIndex);
  const setChromeHidden = useUiStore((s) => s.setChromeHidden);
  const zenMode = useUiStore((s) => s.zenMode);

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      const idx = consumePendingFeedIndex();
      // Read the catalog through the store getter, not the closure — the
      // listener registers once and the array is swapped by hydrate().
      const catalog = getAllProducts();
      if (idx !== null && idx >= 0 && idx < catalog.length) {
        setCurrentIndex(idx);
        setVisibleCount((c) => Math.max(c, idx + PAGE)); // make the target renderable
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: idx, animated: false });
        });
      }
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setChromeHidden(false);
      flushDwell(); // leaving the feed ends the current post's watch time
    });
    // IG behaviour: tapping the Home tab while already on the feed scrolls
    // back to the top and refreshes the catalog (hydrate reshuffles → fresh mix).
    const tabNav = navigation.getParent();
    const unsubTab = tabNav?.addListener('tabPress', () => {
      if (!navigation.isFocused()) return; // first tap just returns to the feed
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
      setCurrentIndex(0);
      setChromeHidden(false);
      useProductsStore.getState().hydrate();
    });
    return () => {
      unsubFocus();
      unsubBlur();
      unsubTab?.();
    };
  }, [navigation, consumePendingFeedIndex, setCurrentIndex, setChromeHidden]);

  // Dwell tracking — how long each post is actually watched feeds the
  // recommendation algorithm (recorded when the user scrolls away).
  const dwellRef = useRef<{ product: Product; since: number } | null>(null);
  const flushDwell = useRef(() => {
    const d = dwellRef.current;
    if (d) {
      useEngagementStore.getState().record(d.product, 'dwell', (Date.now() - d.since) / 1000);
      dwellRef.current = null;
    }
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first && first.index !== null && first.index !== undefined) {
      setCurrentIndex(first.index);
      flushDwell();
      const product = first.item as Product | undefined;
      if (product) dwellRef.current = { product, since: Date.now() };
    }
  }).current;

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 60 }), []);

  // Stable renderItem + memoized ProductCard → mounted cards don't re-render
  // when the screen updates (IG-style cheap cells).
  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <ProductCard
        product={item}
        height={itemHeight}
        bottomSafeArea={insets.bottom}
        topSafeArea={insets.top}
      />
    ),
    [itemHeight, insets.bottom, insets.top],
  );

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
        data={data}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        onEndReached={() => setVisibleCount((c) => Math.min(c + PAGE, PRODUCTS.length))}
        onEndReachedThreshold={4}
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
        initialScrollIndex={Math.min(Math.max(currentIndex, 0), Math.max(data.length - 1, 0))}
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
        ListEmptyComponent={
          <View style={[styles.empty, { height: winHeight }]}>
            <Text style={styles.emptyTitle}>Nothing matches your filter</Text>
            <Text style={styles.emptyHint}>Tap the magnifier and adjust it</Text>
          </View>
        }
      />

      {/* TopNav floats transparently over the full-bleed image (hidden in zen mode) */}
      {!zenMode && (
        <View style={[styles.topOverlay, { paddingTop: insets.top }]} pointerEvents="box-none">
          <TopNav onSearch={() => setFilterOpen(true)} filterActive={!!feedFilter} />
        </View>
      )}

      {/* Feed filter (magnifier) — filtered browsing is excluded from the algorithm */}
      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplied={() => {
          setCurrentIndex(0);
          requestAnimationFrame(() => listRef.current?.scrollToOffset({ offset: 0, animated: false }));
        }}
      />

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
    bottom: 120,
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: FONTS.manropeBold,
    fontSize: 18,
    color: WEROL_TOKENS.paper,
    textAlign: 'center',
  },
  emptyHint: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
  },
});
