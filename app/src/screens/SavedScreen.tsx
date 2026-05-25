import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCTS } from '../data/products';
import { useFeedStore } from '../store/feedStore';
import { useUserStore } from '../store/userStore';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import { useColors } from '../theme/useColors';
import type { Outfit, Product } from '../types';

type Tab = 'items' | 'outfits';

export function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);

  const saved = useFeedStore((u) => u.saved);
  const liked = useFeedStore((u) => u.liked);
  const requestFeedIndex = useFeedStore((u) => u.requestFeedIndex);
  const savedOutfits = useUserStore((u) => u.savedOutfits);
  const deleteOutfit = useUserStore((u) => u.deleteOutfit);

  const [tab, setTab] = useState<Tab>('items');

  const tileSize = (winWidth - SPACING.section * 2 - SPACING.lg) / 2;

  const items = useMemo(
    () =>
      [...new Set([...saved, ...liked])]
        .map((id) => PRODUCTS.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [saved, liked],
  );

  const openProduct = (p: Product) => {
    const idx = PRODUCTS.findIndex((x) => x.id === p.id);
    requestFeedIndex(idx);
    navigation.jumpTo('Home');
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={s.header}>
        <Text style={s.eyebrow}>YOUR LIBRARY</Text>
        <Text style={[TEXT_STYLES.heading, { color: C.cream }]}>Uložené</Text>
      </View>

      <View style={s.tabs}>
        <TabButton
          C={C}
          label={`KÚSKY · ${items.length}`}
          active={tab === 'items'}
          onPress={() => setTab('items')}
        />
        <TabButton
          C={C}
          label={`FITS · ${savedOutfits.length}`}
          active={tab === 'outfits'}
          onPress={() => setTab('outfits')}
        />
      </View>

      {tab === 'items' ? (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={s.gridRow}
          contentContainerStyle={s.grid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              C={C}
              icon="bookmark-outline"
              title="Žiadne uložené kúsky"
              body="Lajkni alebo ulož produkty vo Feede — pribudnú sem."
            />
          }
          renderItem={({ item }) => (
            <Pressable style={[s.tile, { width: tileSize }]} onPress={() => openProduct(item)}>
              <View style={[s.tileImage, { height: tileSize }]}>
                <Image source={item.image} style={s.tileImg} resizeMode="contain" />
              </View>
              <Text style={s.tileBrand} numberOfLines={1}>
                {item.brand}
              </Text>
              <Text style={s.tileName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={s.tilePrice}>
                {item.price.current} {item.price.currency}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={savedOutfits}
          keyExtractor={(o) => o.id}
          contentContainerStyle={s.outfitList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              C={C}
              icon="shirt-outline"
              title="Žiadne uložené FIT-y"
              body="Otvor Outfit tab, sklad FIT a tap Save."
              cta={{ label: 'Otvoriť Outfit Builder', onPress: () => navigation.jumpTo('Outfit') }}
            />
          }
          renderItem={({ item }) => (
            <OutfitCard
              C={C}
              outfit={item}
              onPress={() => {
                const firstId = Object.values(item.slots)[0];
                if (firstId) {
                  const idx = PRODUCTS.findIndex((p) => p.id === firstId);
                  if (idx >= 0) {
                    requestFeedIndex(idx);
                    navigation.jumpTo('Home');
                  }
                }
              }}
              onDelete={() => deleteOutfit(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

function TabButton({
  C,
  label,
  active,
  onPress,
}: {
  C: ReturnType<typeof useColors>;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tab,
        active && { borderBottomColor: C.teal },
        !active && { borderBottomColor: 'transparent' },
      ]}
    >
      <Text
        style={[
          styles.tabText,
          { color: active ? C.cream : C.cream3, fontFamily: FONTS.jetbrainsMonoBold },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function OutfitCard({
  C,
  outfit,
  onPress,
  onDelete,
}: {
  C: ReturnType<typeof useColors>;
  outfit: Outfit;
  onPress: () => void;
  onDelete: () => void;
}) {
  const products = Object.values(outfit.slots)
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const total = products.reduce((sum, p) => sum + p.price.current, 0);
  const s = makeOutfitCardStyles(C);

  return (
    <Pressable onPress={onPress} style={s.card}>
      <View style={s.left}>
        <View style={s.thumbStack}>
          {products.slice(0, 4).map((p, i) => (
            <View
              key={p.id}
              style={[
                s.thumb,
                { marginLeft: i === 0 ? 0 : -16, zIndex: 10 - i },
              ]}
            >
              <Image source={p.image} style={s.thumbImg} resizeMode="contain" />
            </View>
          ))}
        </View>
      </View>
      <View style={s.right}>
        <Text style={s.name}>{outfit.name}</Text>
        <Text style={s.meta}>
          {products.length} pieces · {total} €
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={s.deleteBtn}>
        <Ionicons name="close" size={16} color={C.cream3} />
      </Pressable>
    </Pressable>
  );
}

function EmptyState({
  C,
  icon,
  title,
  body,
  cta,
}: {
  C: ReturnType<typeof useColors>;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  cta?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={36} color={C.dim} />
      <Text style={[styles.emptyTitle, { color: C.cream }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: C.cream3 }]}>{body}</Text>
      {cta && (
        <Pressable onPress={cta.onPress} style={[styles.emptyCta, { borderColor: C.teal }]}>
          <Text style={[styles.emptyCtaText, { color: C.teal }]}>{cta.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.ink, paddingHorizontal: SPACING.section },
    header: { marginBottom: SPACING.lg },
    eyebrow: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 9,
      letterSpacing: 2,
      color: C.teal,
      marginBottom: 4,
    },
    tabs: {
      flexDirection: 'row',
      gap: SPACING.section,
      borderBottomWidth: 1,
      borderBottomColor: C.ink3,
      marginBottom: SPACING.lg,
    },
    grid: { gap: SPACING.lg, paddingBottom: 140 },
    gridRow: { gap: SPACING.lg, marginBottom: SPACING.lg },
    tile: {
      gap: 4,
    },
    tileImage: {
      width: '100%',
      backgroundColor: C.imagePlaceholder,
      borderRadius: RADII.md,
      overflow: 'hidden',
      marginBottom: 6,
    },
    tileImg: { width: '100%', height: '100%' },
    tileBrand: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 8,
      letterSpacing: 1.5,
      color: C.teal,
      textTransform: 'uppercase',
    },
    tileName: {
      fontFamily: FONTS.archivoBold,
      fontSize: 16,
      color: C.cream,
    },
    tilePrice: {
      fontFamily: FONTS.interSemibold,
      fontSize: 13,
      color: C.cream2,
    },
    outfitList: { gap: SPACING.lg, paddingBottom: 140 },
  });
}

const styles = StyleSheet.create({
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 10,
    letterSpacing: 1.5,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.section,
    gap: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.archivoBold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
  emptyCta: {
    paddingHorizontal: SPACING.section,
    paddingVertical: 12,
    borderRadius: 99,
    borderWidth: 1,
  },
  emptyCtaText: {
    fontFamily: FONTS.interSemibold,
    fontSize: 13,
    letterSpacing: 0.3,
  },
});

function makeOutfitCardStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.ink2,
      borderRadius: RADII.md,
      borderWidth: 1,
      borderColor: C.ink3,
      padding: SPACING.lg,
      gap: SPACING.lg,
    },
    left: { width: 100 },
    thumbStack: { flexDirection: 'row' },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: RADII.sm,
      backgroundColor: C.imagePlaceholder,
      borderWidth: 2,
      borderColor: C.ink2,
      overflow: 'hidden',
    },
    thumbImg: { width: '100%', height: '100%' },
    right: { flex: 1, gap: 4 },
    name: { fontFamily: FONTS.archivoBold, fontSize: 18, color: C.cream },
    meta: { fontFamily: FONTS.jetbrainsMono, fontSize: 11, color: C.cream3 },
    deleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.ink3,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
