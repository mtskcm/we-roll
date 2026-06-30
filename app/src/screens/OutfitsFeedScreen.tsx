// OutfitsFeedScreen — FITS tab: full-bleed, TikTok-style paged feed of community
// outfits. Each outfit fills the screen; right rail (like / comment / save /
// share), bottom-left owner + caption, WEROL wordmark + add on top.

import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HeartIcon from '../assets/icons/heart.svg';
import SendIcon from '../assets/icons/send.svg';
import ShareIcon from '../assets/icons/share.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { OUTFITS, type UserOutfit } from '../data/outfits';
import {
  useIsFollowed,
  useIsOutfitBookmarked,
  useIsOutfitLiked,
  useOutfitFeedStore,
} from '../store/outfitFeedStore';
import { useShareStore } from '../store/shareStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

const BOTTOM_NAV_HEIGHT = 78;

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`;
  return String(n);
}
function relTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function OutfitsFeedScreen() {
  const insets = useSafeAreaInsets();
  const { height: winHeight } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const showToast = useShareStore((s) => s.showToast);

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
        data={OUTFITS}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => (
          <OutfitCard
            outfit={item}
            height={winHeight}
            bottomSafeArea={insets.bottom}
            onOpen={() => navigation.navigate('OutfitDetail', { outfitId: item.id })}
          />
        )}
        pagingEnabled
        snapToInterval={winHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={getItemLayout}
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
    </View>
  );
}

function OutfitCard({
  outfit,
  height,
  bottomSafeArea = 0,
  onOpen,
}: {
  outfit: UserOutfit;
  height: number;
  bottomSafeArea?: number;
  onOpen: () => void;
}) {
  const infoBottomOffset = BOTTOM_NAV_HEIGHT + bottomSafeArea + 8;
  const liked = useIsOutfitLiked(outfit.id);
  const bookmarked = useIsOutfitBookmarked(outfit.id);
  const followed = useIsFollowed(outfit.ownerHandle);
  const toggleLike = useOutfitFeedStore((s) => s.toggleLike);
  const toggleBookmark = useOutfitFeedStore((s) => s.toggleBookmark);
  const toggleFollow = useOutfitFeedStore((s) => s.toggleFollow);

  return (
    <View style={[styles.card, { height }]}>
      <Image source={outfit.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Pressable style={StyleSheet.absoluteFill} onPress={onOpen} />

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
        <RailAction Icon={SendIcon} label={String(outfit.comments.length)} onPress={onOpen} />
        <RailAction Icon={BookmarkIcon} active={bookmarked} onPress={() => toggleBookmark(outfit.id)} />
        <RailAction Icon={ShareIcon} onPress={() => {}} />
      </View>

      {/* Bottom-left: owner + caption */}
      <View style={[styles.info, { bottom: infoBottomOffset }]} pointerEvents="box-none">
        <Text style={styles.handle}>@{outfit.ownerHandle}</Text>
        <Text style={styles.meta}>{relTime(outfit.createdAt)} · {outfit.taggedProductIds.length} kúskov</Text>
        {!!outfit.caption && (
          <Text style={styles.caption} numberOfLines={2}>{outfit.caption}</Text>
        )}
        {outfit.comments.length > 0 && (
          <Pressable onPress={onOpen} hitSlop={6}>
            <Text style={styles.viewComments}>Zobraziť všetkých {outfit.comments.length} komentárov</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function RailAction({
  Icon,
  label,
  active = false,
  onPress,
}: {
  Icon: React.FC<{ width?: number; height?: number; stroke?: string; fill?: string; strokeWidth?: number }>;
  label?: string;
  active?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const handle = () => {
    scale.value = withSequence(withTiming(0.8, { duration: 90 }), withSpring(1, { damping: 6, stiffness: 220 }));
    onPress();
  };
  const color = active ? WEROL_TOKENS.lime : WEROL_TOKENS.paper;
  return (
    <Pressable onPress={handle} hitSlop={8} style={styles.railItem}>
      <Animated.View style={animStyle}>
        <Icon width={29} height={29} stroke={color} fill={active ? color : 'none'} strokeWidth={1.7} />
      </Animated.View>
      {label ? <Text style={styles.railLabel}>{label}</Text> : null}
    </Pressable>
  );
}

const SHADOW = { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.45, shadowRadius: 4 };

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
  card: { width: '100%', backgroundColor: WEROL_TOKENS.concrete },
  topGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 130 },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  rail: { position: 'absolute', right: 12, gap: 20, alignItems: 'center' },
  railItem: { alignItems: 'center', gap: 5, ...SHADOW },
  railLabel: { fontFamily: FONTS.archivoBold, fontSize: 12, color: WEROL_TOKENS.paper, letterSpacing: 0.2, ...SHADOW },
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
  handle: { fontFamily: FONTS.spaceGroteskBold, fontSize: 16, color: WEROL_TOKENS.paper, ...SHADOW },
  meta: { fontFamily: FONTS.inter, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, ...SHADOW },
  caption: { fontFamily: FONTS.inter, fontSize: 14, lineHeight: 19, color: 'rgba(255,255,255,0.92)', marginTop: 8, ...SHADOW },
  viewComments: { fontFamily: FONTS.inter, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
});
