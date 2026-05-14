import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATEGORIES, PRIMARY_CATEGORIES, type CategoryId } from '../data/categories';
import { PRODUCTS } from '../data/products';
import { buildRecommendations } from '../data/recommendations';
import { useT } from '../i18n';
import { useFeedStore } from '../store/feedStore';
import { COLORS, SHOP_COLORS, type ShopKey } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import type { Product } from '../types';

type ShopFilter = 'all' | ShopKey;
const SHOP_FILTERS: ShopFilter[] = [
  'all',
  'Footshop',
  'Queens.sk',
  'Freshment',
  'Sizeer',
  'Zalando',
  'About You',
  'Hervis',
  'StockX',
];

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const t = useT();
  const requestFeedIndex = useFeedStore((s) => s.requestFeedIndex);
  const liked = useFeedStore((s) => s.liked);
  const saved = useFeedStore((s) => s.saved);
  const recentSearches = useFeedStore((s) => s.recentSearches);
  const addRecentSearch = useFeedStore((s) => s.addRecentSearch);
  const clearRecentSearches = useFeedStore((s) => s.clearRecentSearches);

  const tileSize = (winWidth - SPACING.section * 2 - SPACING.lg) / 2;
  const miniSize = Math.round(winWidth * 0.46);

  const [query, setQuery] = useState('');
  const [shop, setShop] = useState<ShopFilter>('all');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (shop !== 'all' && p.shop.name !== shop) return false;
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.brand.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.shop.name.toLowerCase().includes(q)
      );
    });
  }, [query, shop, category]);

  const recommendations = useMemo(
    () => buildRecommendations(liked, saved),
    [liked, saved],
  );

  const openProduct = (p: Product) => {
    const idx = PRODUCTS.findIndex((x) => x.id === p.id);
    requestFeedIndex(idx);
    navigation.jumpTo('Home');
  };

  const filterActive = category !== null || shop !== 'all';
  const clearFilters = () => {
    setCategory(null);
    setShop('all');
  };

  const hasInput = query.trim().length > 0 || filterActive;

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={styles.header}>
        <Text style={TEXT_STYLES.heading}>{t('search.title')}</Text>
        <Text style={styles.sub}>{t('search.results', { n: results.length })}</Text>
      </View>

      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <Ionicons name="search" size={18} color={focused ? COLORS.teal : COLORS.cream3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('search.placeholder')}
          placeholderTextColor={COLORS.dim}
          style={styles.input}
          autoCorrect={false}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {!!query && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={COLORS.cream3} />
          </Pressable>
        )}
      </View>

      <View style={styles.clearRow} pointerEvents={filterActive ? 'auto' : 'none'}>
        {filterActive && (
          <Pressable onPress={clearFilters} hitSlop={8} style={styles.clearBtn}>
            <Ionicons name="close" size={12} color={COLORS.teal} />
            <Text style={styles.clearText}>{t('search.clearFilters')}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        <Chip
          label={t('search.allCategories')}
          active={category === null}
          tint={COLORS.teal}
          onPress={() => setCategory(null)}
        />
        {CATEGORIES.filter((c) => PRIMARY_CATEGORIES.includes(c.id)).map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            active={category === c.id}
            tint={c.tint}
            onPress={() => setCategory(category === c.id ? null : c.id)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {SHOP_FILTERS.map((s) => (
          <Chip
            key={s}
            label={s === 'all' ? t('search.allShops') : s}
            active={shop === s}
            tint={s === 'all' ? COLORS.cream2 : SHOP_COLORS[s].bg}
            onPress={() => setShop(s)}
          />
        ))}
      </ScrollView>

      {hasInput ? (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={36} color={COLORS.dim} />
              <Text style={styles.emptyTitle}>{t('search.empty.title')}</Text>
              <Text style={styles.emptyText}>{t('search.empty.body')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={[styles.tile, { width: tileSize }]}
              onPress={() => {
                addRecentSearch(query);
                openProduct(item);
              }}
            >
              <View style={[styles.tileImageFrame, { width: tileSize, height: tileSize }]}>
                <Image
                  source={item.image}
                  style={styles.tileImg}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.tileInfo}>
                <Text style={TEXT_STYLES.productBrand} numberOfLines={1}>
                  {item.brand}
                </Text>
                <Text style={styles.tileName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.tilePriceRow}>
                  <Text style={TEXT_STYLES.productPrice}>
                    {item.price.current} {item.price.currency}
                  </Text>
                  {item.price.original !== undefined && (
                    <Text style={TEXT_STYLES.priceOld}>
                      {item.price.original} {item.price.currency}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.discover}
        >
          {recentSearches.length > 0 && (
            <View style={styles.recentBlock}>
              <View style={styles.recentHeader}>
                <Text style={styles.bucketTitle}>{t('search.recent')}</Text>
                <Pressable onPress={clearRecentSearches} hitSlop={8}>
                  <Text style={styles.clearText}>{t('search.recent.clear')}</Text>
                </Pressable>
              </View>
              <View style={styles.recentChips}>
                {recentSearches.map((q) => (
                  <Pressable
                    key={q}
                    style={styles.recentChip}
                    onPress={() => setQuery(q)}
                  >
                    <Ionicons name="time-outline" size={12} color={COLORS.cream3} />
                    <Text style={styles.recentChipText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {recommendations.map((bucket) => (
            <View key={bucket.key} style={styles.bucket}>
              <View style={styles.bucketHead}>
                <View style={styles.bucketHeadText}>
                  <Text style={styles.bucketTitle}>{bucket.title}</Text>
                  {bucket.subtitle && (
                    <Text style={styles.bucketSubtitle}>{bucket.subtitle}</Text>
                  )}
                </View>
                {bucket.tint && <View style={[styles.bucketDot, { backgroundColor: bucket.tint }]} />}
              </View>
              <FlatList
                data={bucket.products}
                keyExtractor={(p) => `${bucket.key}-${p.id}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bucketList}
                renderItem={({ item }) => (
                  <Pressable
                    style={[styles.miniTile, { width: miniSize }]}
                    onPress={() => openProduct(item)}
                  >
                    <View
                      style={[
                        styles.miniTileFrame,
                        { width: miniSize, height: miniSize },
                      ]}
                    >
                      <Image source={item.image} style={styles.tileImg} resizeMode="contain" />
                    </View>
                    <Text style={TEXT_STYLES.productBrand} numberOfLines={1}>
                      {item.brand}
                    </Text>
                    <Text style={styles.miniName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={TEXT_STYLES.productPrice}>
                      {item.price.current} {item.price.currency}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ))}

          <View style={styles.discoverHint}>
            <Ionicons name="sparkles-outline" size={14} color={COLORS.cream3} />
            <Text style={styles.discoverHintText}>{t('search.discoverHint')}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Chip({
  label,
  icon,
  active,
  tint,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active: boolean;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? tint : COLORS.ink4,
          backgroundColor: active ? tint : 'transparent',
        },
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={15}
          color={active ? COLORS.ink : COLORS.cream2}
          style={styles.chipIcon}
        />
      )}
      <Text style={[styles.chipText, { color: active ? COLORS.ink : COLORS.cream2 }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingHorizontal: SPACING.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sub: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.cream3,
    textTransform: 'uppercase',
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    marginBottom: SPACING.lg,
  },
  searchBarFocused: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.ink3,
  },
  input: {
    flex: 1,
    color: COLORS.cream,
    fontFamily: FONTS.dmSansRegular,
    fontSize: 14,
    padding: 0,
  },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionLabelText: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.cream3,
  },
  clearText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 11,
    color: COLORS.teal,
  },
  clearRow: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  chipsRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.section,
    paddingVertical: 11,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    minHeight: 38,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  grid: {
    paddingBottom: 140,
  },
  gridRow: {
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  tile: {
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  tileImageFrame: {
    backgroundColor: COLORS.imagePlaceholder,
  },
  tileImg: {
    width: '100%',
    height: '100%',
  },
  tileInfo: {
    padding: SPACING.lg,
    gap: 4,
  },
  tileName: {
    ...TEXT_STYLES.productName,
    fontSize: 16,
    lineHeight: 20,
  },
  tilePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
  },
  emptyText: {
    ...TEXT_STYLES.body,
    color: COLORS.cream2,
    textAlign: 'center',
  },
  discover: {
    paddingBottom: 140,
    gap: SPACING.hero,
    paddingTop: SPACING.sm,
  },
  recentBlock: {
    gap: SPACING.md,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  recentChipText: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 12,
    color: COLORS.cream2,
  },
  bucket: {
    gap: SPACING.md,
  },
  bucketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  bucketHeadText: {
    flex: 1,
    gap: 2,
  },
  bucketTitle: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 20,
    color: COLORS.cream,
    letterSpacing: -0.3,
  },
  bucketSubtitle: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 11,
    color: COLORS.cream3,
  },
  bucketDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bucketList: {
    gap: SPACING.lg,
    paddingRight: SPACING.section,
  },
  miniTile: {
    gap: 4,
  },
  miniTileFrame: {
    backgroundColor: COLORS.imagePlaceholder,
    borderRadius: RADII.md,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniName: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 15,
    lineHeight: 18,
    color: COLORS.cream,
    letterSpacing: -0.2,
    minHeight: 36,
  },
  discoverHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: SPACING.lg,
    opacity: 0.7,
  },
  discoverHintText: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 11,
    color: COLORS.cream3,
    textAlign: 'center',
  },
});
