// SearchScreen — Maroš v2: title + search bar + ONE filter row,
// then TRENDING NOW (by likes) + FOR YOU (recommended) horizontal carousels.

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
import CloseIcon from '../assets/icons/close.svg';
import RotateIcon from '../assets/icons/rotate.svg';
import SearchIcon from '../assets/icons/search.svg';
import TrendIcon from '../assets/icons/trend.svg';
import { CATEGORIES, PRIMARY_CATEGORIES, type CategoryId } from '../data/categories';
import { useProducts } from '../store/productsStore';
import { formatPrice } from '../lib/format';
import { buildRecommendations } from '../data/recommendations';
import { useT } from '../i18n';
import { useFeedStore } from '../store/feedStore';
import { COLORS, WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import type { Product } from '../types';

export function SearchScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const t = useT();
  const PRODUCTS = useProducts();
  const liked = useFeedStore((s) => s.liked);
  const saved = useFeedStore((s) => s.saved);
  const recentSearches = useFeedStore((s) => s.recentSearches);
  const addRecentSearch = useFeedStore((s) => s.addRecentSearch);
  const clearRecentSearches = useFeedStore((s) => s.clearRecentSearches);

  const tileSize = (winWidth - SPACING.section * 2 - SPACING.lg) / 2;
  const miniSize = Math.round(winWidth * 0.46);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return (
        p.brand.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.shop.name.toLowerCase().includes(q)
      );
    });
  }, [query, category, PRODUCTS]);

  const trendingNow = useMemo(
    () => [...PRODUCTS].sort((a, b) => b.likes - a.likes).slice(0, 8),
    [PRODUCTS],
  );

  const forYou = useMemo(() => {
    const buckets = buildRecommendations(liked, saved, PRODUCTS);
    const flat: Product[] = [];
    const seen = new Set<string>();
    for (const b of buckets) {
      for (const p of b.products) {
        if (!seen.has(p.id)) {
          flat.push(p);
          seen.add(p.id);
        }
      }
    }
    // Fall back to lower-liked products if nothing matched.
    if (flat.length === 0) {
      return [...PRODUCTS].sort((a, b) => a.likes - b.likes).slice(0, 8);
    }
    return flat.slice(0, 8);
  }, [liked, saved, PRODUCTS]);

  const openProduct = (p: Product) => {
    navigation.navigate('Home', {
      screen: 'ProductDetails',
      params: { productId: p.id },
    });
  };

  const filterActive = category !== null;
  const hasInput = query.trim().length > 0 || filterActive;
  const iconColor = focused ? WEROL_TOKENS.lime : WEROL_TOKENS.muted;

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('search.title')}</Text>
        {hasInput && (
          <Text style={styles.sub}>{t('search.results', { n: results.length })}</Text>
        )}
      </View>

      <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
        <SearchIcon width={18} height={18} stroke={iconColor} strokeWidth={1.8} fill="none" />
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
            <CloseIcon width={18} height={18} stroke={WEROL_TOKENS.muted} strokeWidth={1.8} fill="none" />
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
          tint={WEROL_TOKENS.lime}
          onPress={() => setCategory(null)}
        />
        {CATEGORIES.filter((c) => PRIMARY_CATEGORIES.includes(c.id)).map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            active={category === c.id}
            tint={WEROL_TOKENS.lime}
            onPress={() => setCategory(category === c.id ? null : c.id)}
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
              <SearchIcon width={36} height={36} stroke={WEROL_TOKENS.muted2} strokeWidth={1.5} fill="none" />
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
                <Image source={item.image} style={styles.tileImg} resizeMode="contain" />
              </View>
              <View style={styles.tileInfo}>
                <Text style={TEXT_STYLES.productBrand} numberOfLines={1}>{item.brand}</Text>
                <Text style={styles.tileName} numberOfLines={2}>{item.name}</Text>
                <View style={styles.tilePriceRow}>
                  <Text style={TEXT_STYLES.productPrice}>
                    {formatPrice(item.price.current, item.price.currency)}
                  </Text>
                  {item.price.original !== undefined && (
                    <Text style={TEXT_STYLES.priceOld}>
                      {formatPrice(item.price.original, item.price.currency)}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.discover}>
          {recentSearches.length > 0 && (
            <View style={styles.recentBlock}>
              <View style={styles.bucketHead}>
                <Text style={styles.bucketTitle}>{t('search.recent')}</Text>
                <Pressable onPress={clearRecentSearches} hitSlop={8}>
                  <Text style={styles.bucketClear}>{t('search.recent.clear')}</Text>
                </Pressable>
              </View>
              <View style={styles.recentChips}>
                {recentSearches.map((q) => (
                  <Pressable key={q} style={styles.recentChip} onPress={() => setQuery(q)}>
                    <RotateIcon width={12} height={12} stroke={WEROL_TOKENS.muted} strokeWidth={1.8} fill="none" />
                    <Text style={styles.recentChipText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          <Section
            title="TRENDING NOW"
            subtitle="Najpopulárnejšie tento týždeň"
            iconColor={WEROL_TOKENS.lime}
            data={trendingNow}
            miniSize={miniSize}
            onOpen={openProduct}
          />

          <Section
            title="FOR YOU"
            subtitle="Podľa toho čo si lajkol a uložil"
            iconColor={WEROL_TOKENS.tintMagenta}
            data={forYou}
            miniSize={miniSize}
            onOpen={openProduct}
          />

          <View style={styles.discoverHint}>
            <TrendIcon width={14} height={14} stroke={WEROL_TOKENS.muted2} strokeWidth={1.8} fill="none" />
            <Text style={styles.discoverHintText}>{t('search.discoverHint')}</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Section({
  title,
  subtitle,
  iconColor,
  data,
  miniSize,
  onOpen,
}: {
  title: string;
  subtitle: string;
  iconColor: string;
  data: Product[];
  miniSize: number;
  onOpen: (p: Product) => void;
}) {
  return (
    <View style={styles.bucket}>
      <View style={styles.bucketHead}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.bucketDot, { backgroundColor: iconColor }]} />
          <View>
            <Text style={styles.bucketTitle}>{title}</Text>
            <Text style={styles.bucketSubtitle}>{subtitle}</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={data}
        keyExtractor={(p) => `${title}-${p.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bucketList}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.miniTile, { width: miniSize }]}
            onPress={() => onOpen(item)}
          >
            <View style={[styles.miniTileFrame, { width: miniSize, height: miniSize }]}>
              <Image source={item.image} style={styles.tileImg} resizeMode="contain" />
            </View>
            <Text style={TEXT_STYLES.productBrand} numberOfLines={1}>{item.brand}</Text>
            <Text style={styles.miniName} numberOfLines={2}>{item.name}</Text>
            <Text style={TEXT_STYLES.productPrice}>
              {formatPrice(item.price.current, item.price.currency)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

function Chip({
  label,
  active,
  tint,
  onPress,
}: {
  label: string;
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
          borderColor: active ? tint : WEROL_TOKENS.line,
          backgroundColor: active ? tint : 'transparent',
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? WEROL_TOKENS.pitch : WEROL_TOKENS.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
    paddingHorizontal: SPACING.section,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  sub: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted2,
    textTransform: 'uppercase',
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
    marginBottom: SPACING.lg,
  },
  searchBarFocused: {
    borderColor: WEROL_TOKENS.lime,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  input: {
    flex: 1,
    color: WEROL_TOKENS.paper,
    fontFamily: FONTS.inter,
    fontSize: 15,
    padding: 0,
  },
  chipsRow: {
    gap: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.section,
    paddingVertical: 10,
    borderRadius: RADII.pill,
    borderWidth: 1.5,
    minHeight: 36,
  },
  title: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 30,
    letterSpacing: -0.6,
    color: WEROL_TOKENS.paper,
  },
  chipText: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 12,
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
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  tileImageFrame: {
    backgroundColor: WEROL_TOKENS.concrete,
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
    fontFamily: FONTS.archivoBold,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: -0.3,
    color: WEROL_TOKENS.paper,
  },
  tilePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  },
  emptyText: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    lineHeight: 20,
    color: WEROL_TOKENS.muted,
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
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  recentChipText: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: WEROL_TOKENS.muted,
  },
  bucket: {
    gap: SPACING.md,
  },
  bucketHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bucketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bucketTitle: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: WEROL_TOKENS.paper,
  },
  bucketSubtitle: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: WEROL_TOKENS.muted,
    marginTop: 2,
  },
  bucketClear: {
    fontFamily: FONTS.interSemibold,
    fontSize: 11,
    color: WEROL_TOKENS.lime,
  },
  bucketList: {
    gap: SPACING.lg,
    paddingRight: SPACING.section,
  },
  miniTile: {
    gap: 4,
  },
  miniTileFrame: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.md,
    overflow: 'hidden',
    marginBottom: 6,
  },
  miniName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
  discoverHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: SPACING.md,
    paddingHorizontal: 4,
  },
  discoverHintText: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    color: WEROL_TOKENS.muted2,
    lineHeight: 16,
  },
});
