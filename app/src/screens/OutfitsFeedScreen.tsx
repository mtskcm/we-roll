// OutfitsFeedScreen — FITS tab: full-bleed, TikTok-style paged feed of community
// outfits. Each outfit fills the screen; right rail (like / comment / save /
// share), bottom-left owner + caption, WEROL wordmark + add on top.

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HeartIcon from '../assets/icons/heart.svg';
import SendIcon from '../assets/icons/send.svg';
import ShareIcon from '../assets/icons/share.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import type { UserOutfit } from '../data/outfits';
import { useOutfits, useOutfitsStore } from '../store/outfitsStore';
import {
  useIsFollowed,
  useIsOutfitBookmarked,
  useIsOutfitLiked,
  useMyOutfitComments,
  useOutfitFeedStore,
} from '../store/outfitFeedStore';
import { CommentsSheet } from '../components/CommentsSheet';
import { useShareStore } from '../store/shareStore';
import { useProducts } from '../store/productsStore';
import { useUiStore } from '../store/uiStore';
import { formatCount, formatPrice, relTime } from '../lib/format';
import { resolveTaggedProducts } from '../lib/outfitTags';
import { RailAction, RAIL_SHADOW } from '../components/RailAction';
import type { Product } from '../types';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

const BOTTOM_NAV_HEIGHT = 78;

export function OutfitsFeedScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const showToast = useShareStore((s) => s.showToast);
  const PRODUCTS = useProducts();
  const setChromeHidden = useUiStore((s) => s.setChromeHidden);
  const [commentsFor, setCommentsFor] = useState<UserOutfit | null>(null);
  const outfits = useOutfits();
  const hydrateOutfits = useOutfitsStore((s) => s.hydrate);
  useEffect(() => { hydrateOutfits(); }, [hydrateOutfits]);

  const getItemLayout = useCallback(
    (_: ArrayLike<UserOutfit> | null | undefined, index: number) => ({
      length: winHeight,
      offset: winHeight * index,
      index,
    }),
    [winHeight],
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={outfits}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OutfitCard
            outfit={item}
            width={winWidth}
            height={winHeight}
            bottomSafeArea={insets.bottom}
            products={PRODUCTS}
            onProduct={(id) => navigation.navigate('ProductDetails', { productId: id })}
            onComments={() => setCommentsFor(item)}
          />
        )}
        pagingEnabled
        snapToInterval={winHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
        onScrollBeginDrag={() => setChromeHidden(true)}
        onScrollEndDrag={() => setChromeHidden(false)}
        onMomentumScrollEnd={() => setChromeHidden(false)}
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
      />

      {/* Top overlay: WEROL wordmark + add */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <WordmarkOnDark width={104} height={19} />
        <Pressable
          onPress={() => showToast('Pridať vlastný fit — už čoskoro')}
          hitSlop={10}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.6 }]}
        >
          <AddIcon width={24} height={24} stroke={WEROL_TOKENS.paper} strokeWidth={1.9} fill="none" />
        </Pressable>
      </View>

      {/* IG-style comments bottom sheet */}
      <CommentsSheet outfit={commentsFor} onClose={() => setCommentsFor(null)} />
    </View>
  );
}

function OutfitCard({
  outfit,
  width,
  height,
  bottomSafeArea = 0,
  products,
  onProduct,
  onComments,
}: {
  outfit: UserOutfit;
  width: number;
  height: number;
  bottomSafeArea?: number;
  products: Product[];
  onProduct: (id: string) => void;
  onComments: () => void;
}) {
  const infoBottomOffset = BOTTOM_NAV_HEIGHT + bottomSafeArea + 8;
  const tagged = resolveTaggedProducts(outfit, products).slice(0, 6);
  const shareOutfit = () => {
    Share.share({
      message: `Fit od @${outfit.ownerHandle} na WEROL${outfit.caption ? ` — ${outfit.caption}` : ''}\nhttps://werol.app`,
    }).catch(() => {});
  };
  const liked = useIsOutfitLiked(outfit.id);
  const bookmarked = useIsOutfitBookmarked(outfit.id);
  const followed = useIsFollowed(outfit.ownerHandle);
  const myComments = useMyOutfitComments(outfit.id);
  const commentCount = outfit.comments.length + myComments.length;
  const toggleLike = useOutfitFeedStore((s) => s.toggleLike);
  const toggleBookmark = useOutfitFeedStore((s) => s.toggleBookmark);
  const toggleFollow = useOutfitFeedStore((s) => s.toggleFollow);

  return (
    <View style={[styles.card, { width, height }]}>
      <Image source={outfit.image} style={{ width, height }} resizeMode="cover" />

      <LinearGradient
        colors={['rgba(10,10,12,0.55)', 'rgba(10,10,12,0)']}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(10,10,12,0)', 'rgba(10,10,12,0.5)', 'rgba(10,10,12,0.92)']}
        locations={[0, 0.5, 1]}
        style={[styles.bottomGradient, { height: infoBottomOffset + 300 }]}
        pointerEvents="none"
      />

      {/* Right rail */}
      <View style={[styles.rail, { bottom: infoBottomOffset + 4 }]}>
        <Pressable onPress={() => toggleFollow(outfit.ownerHandle)} hitSlop={6} style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: outfit.ownerTint }]}>
            <Text style={styles.avatarInitials}>{outfit.ownerInitials}</Text>
          </View>
          {!followed && (
            <View style={styles.followBadge}>
              <Text style={styles.followPlus}>+</Text>
            </View>
          )}
        </Pressable>
        <RailAction
          Icon={HeartIcon}
          active={liked}
          label={formatCount(outfit.likes + (liked ? 1 : 0))}
          onPress={() => toggleLike(outfit.id)}
        />
        <RailAction Icon={SendIcon} label={String(commentCount)} onPress={onComments} />
        <RailAction Icon={BookmarkIcon} active={bookmarked} onPress={() => toggleBookmark(outfit.id)} />
        <RailAction Icon={ShareIcon} onPress={shareOutfit} />
      </View>

      {/* Bottom-left: owner + caption + shop the look */}
      <View style={[styles.info, { bottom: infoBottomOffset }]} pointerEvents="box-none">
        <Text style={styles.handle}>@{outfit.ownerHandle}</Text>
        <Text style={styles.meta}>{relTime(outfit.createdAt)} · {tagged.length} kúskov</Text>
        {!!outfit.caption && (
          <Text style={styles.caption} numberOfLines={2}>{outfit.caption}</Text>
        )}
        {tagged.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopStrip}
          >
            {tagged.map((p) => (
              <Pressable key={p.id} onPress={() => onProduct(p.id)} style={styles.shopTag}>
                <Image source={p.image} style={styles.shopThumb} resizeMode="contain" />
                <View style={styles.shopInfo}>
                  <Text style={styles.shopBrand} numberOfLines={1}>{p.brand || 'SHOP'}</Text>
                  <Text style={styles.shopPrice}>{formatPrice(p.price.current, p.price.currency)}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
        <Pressable onPress={onComments} hitSlop={6}>
          <Text style={styles.viewComments}>
            {commentCount > 0 ? `Zobraziť všetkých ${commentCount} komentárov` : 'Pridaj komentár…'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const SHADOW = RAIL_SHADOW;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: 10,
  },
  addBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', ...SHADOW },
  card: { backgroundColor: WEROL_TOKENS.pitch, overflow: 'hidden' },
  topGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 130 },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rail: { position: 'absolute', right: 12, gap: 20, alignItems: 'center' },
  avatarWrap: { alignItems: 'center', marginBottom: 4 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: WEROL_TOKENS.paper,
  },
  avatarInitials: { fontFamily: FONTS.archivoBold, fontSize: 15, color: WEROL_TOKENS.paper, letterSpacing: -0.3 },
  followBadge: {
    position: 'absolute',
    bottom: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: WEROL_TOKENS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followPlus: { fontFamily: FONTS.archivoBold, fontSize: 14, lineHeight: 16, color: WEROL_TOKENS.pitch },
  info: { position: 'absolute', left: 0, right: 0, paddingHorizontal: SPACING.lg, paddingRight: 76 },
  handle: { fontFamily: FONTS.archivoSemibold, fontSize: 16, color: WEROL_TOKENS.paper, ...SHADOW },
  meta: { fontFamily: FONTS.archivoRegular, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, ...SHADOW },
  caption: { fontFamily: FONTS.archivoRegular, fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.92)', marginTop: 8, ...SHADOW },
  viewComments: { fontFamily: FONTS.archivoRegular, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  shopStrip: { gap: 8, paddingTop: 12, paddingRight: 8 },
  shopTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 10,
    paddingRight: 12,
    paddingVertical: 5,
    paddingLeft: 5,
  },
  shopThumb: { width: 34, height: 34, borderRadius: 7, backgroundColor: WEROL_TOKENS.frame },
  shopInfo: { gap: 1 },
  shopBrand: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 8, letterSpacing: 1, color: WEROL_TOKENS.muted2 },
  shopPrice: { fontFamily: FONTS.archivoBold, fontSize: 13, color: WEROL_TOKENS.pitch },
});
