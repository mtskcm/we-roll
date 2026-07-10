// DiscoverScreen — the UI kit "Discover" catalog: screen title + product
// count + avatar, search pill, category chips, 2-column product grid.
// Lives on the second tab (magnifier); tap a tile → ProductDetails.

import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, type CategoryId } from '../data/categories';
import { productMatchesQuery } from '../lib/productSearch';
import { useEngagementStore } from '../store/engagementStore';
import { useProducts } from '../store/productsStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { Avatar } from '../ui/Avatar';
import { Chip } from '../ui/Chip';
import { SearchInput } from '../ui/Input';
import { ProductTile } from '../ui/ProductTile';
import type { Product } from '../types';

const BOTTOM_NAV_HEIGHT = 78;

export function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const PRODUCTS = useProducts();
  const profile = useUserStore((s) => s.profile);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  const results = useMemo(
    () =>
      PRODUCTS.filter((p) => {
        if (category !== 'all' && p.category !== category) return false;
        return productMatchesQuery(p, query);
      }),
    [PRODUCTS, query, category],
  );

  const renderTile = ({ item }: { item: Product }) => (
    <View style={styles.tileWrap}>
      <ProductTile
        product={item}
        onPress={() => {
          useEngagementStore.getState().record(item, 'click');
          navigation.navigate('ProductDetails', { productId: item.id });
        }}
      />
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Title + count + avatar */}
      <View style={styles.headRow}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.count}>{results.length} products</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={6}>
          <Avatar initials={profile.initials} size={42} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchInput
          value={query}
          onChangeText={setQuery}
          placeholder="Brands, products, shops…"
          returnKeyType="search"
        />
      </View>

      {/* Category chips */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip label="All" active={category === 'all'} onPress={() => setCategory('all')} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={category === c.id}
              onPress={() => setCategory(category === c.id ? 'all' : c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Product grid */}
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        renderItem={renderTile}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.grid,
          { paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        windowSize={7}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        ListEmptyComponent={
          <Text style={styles.empty}>No pieces found. Try a different search.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  headRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  title: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: WEROL_TOKENS.paper,
  },
  count: {
    fontFamily: FONTS.manropeSemibold,
    fontSize: 14,
    color: '#8A8B90',
    marginTop: 2,
  },
  searchWrap: { paddingHorizontal: 20, paddingTop: 16 },
  chips: { gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  grid: { paddingHorizontal: 20, paddingTop: 14, gap: 12 },
  column: { gap: 12 },
  tileWrap: { flex: 1 },
  empty: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
    paddingTop: 60,
  },
});
