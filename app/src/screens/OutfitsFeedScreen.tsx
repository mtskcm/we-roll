// OutfitsFeedScreen — FITS tab: IG-style vertical feed of community outfits.

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HeartIcon from '../assets/icons/heart.svg';
import SendIcon from '../assets/icons/send.svg';
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
  const navigation = useNavigation<any>();
  const showToast = useShareStore((s) => s.showToast);

  return (
    <View style={styles.root}>
      <FlatList
        data={OUTFITS}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{
          paddingTop: insets.top + 52,
          paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <OutfitPost
            outfit={item}
            onOpen={() => navigation.navigate('OutfitDetail', { outfitId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <Text style={styles.topTitle}>FITS</Text>
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

function OutfitPost({ outfit, onOpen }: { outfit: UserOutfit; onOpen: () => void }) {
  const liked = useIsOutfitLiked(outfit.id);
  const bookmarked = useIsOutfitBookmarked(outfit.id);
  const followed = useIsFollowed(outfit.ownerHandle);
  const toggleLike = useOutfitFeedStore((s) => s.toggleLike);
  const toggleBookmark = useOutfitFeedStore((s) => s.toggleBookmark);
  const toggleFollow = useOutfitFeedStore((s) => s.toggleFollow);

  return (
    <View style={styles.post}>
      {/* Header */}
      <View style={styles.postHead}>
        <View style={[styles.avatar, { backgroundColor: outfit.ownerTint }]}>
          <Text style={styles.avatarInitials}>{outfit.ownerInitials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.handle}>@{outfit.ownerHandle}</Text>
          <Text style={styles.time}>{relTime(outfit.createdAt)} · {outfit.taggedProductIds.length} kúskov</Text>
        </View>
        <Pressable
          onPress={() => toggleFollow(outfit.ownerHandle)}
          style={({ pressed }) => [
            followed ? styles.followingBtn : styles.followBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={followed ? styles.followingText : styles.followText}>
            {followed ? 'FOLLOWING' : 'FOLLOW'}
          </Text>
        </Pressable>
      </View>

      {/* Image */}
      <Pressable onPress={onOpen}>
        <Image source={outfit.image} style={styles.image} resizeMode="cover" />
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={() => toggleLike(outfit.id)} hitSlop={8} style={styles.actionBtn}>
          <HeartIcon
            width={25} height={25}
            stroke={liked ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={liked ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
          <Text style={styles.actionCount}>{formatCount(outfit.likes + (liked ? 1 : 0))}</Text>
        </Pressable>
        <Pressable onPress={onOpen} hitSlop={8} style={styles.actionBtn}>
          <SendIcon width={23} height={23} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
          <Text style={styles.actionCount}>{outfit.comments.length}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => toggleBookmark(outfit.id)} hitSlop={8} style={styles.actionBtn}>
          <BookmarkIcon
            width={24} height={24}
            stroke={bookmarked ? WEROL_TOKENS.lime : WEROL_TOKENS.paper}
            fill={bookmarked ? WEROL_TOKENS.lime : 'none'}
            strokeWidth={1.8}
          />
        </Pressable>
      </View>

      {/* Caption + comments */}
      {!!outfit.caption && (
        <Text style={styles.caption}>
          <Text style={styles.captionHandle}>@{outfit.ownerHandle} </Text>
          {outfit.caption}
        </Text>
      )}
      {outfit.comments.length > 0 && (
        <Pressable onPress={onOpen}>
          <Text style={styles.viewComments}>
            Zobraziť všetkých {outfit.comments.length} komentárov
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: 10,
    backgroundColor: 'rgba(10,10,12,0.92)',
  },
  topTitle: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 20,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.paper,
  },
  addBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  post: {
    gap: 10,
  },
  postHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: SPACING.section,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.3,
  },
  handle: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 14,
    color: WEROL_TOKENS.paper,
  },
  time: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    color: WEROL_TOKENS.muted2,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: WEROL_TOKENS.lime,
  },
  followText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: WEROL_TOKENS.pitch,
  },
  followingBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  followingText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 10,
    letterSpacing: 0.6,
    color: WEROL_TOKENS.muted,
  },
  image: {
    width: '100%',
    aspectRatio: 0.82,
    backgroundColor: WEROL_TOKENS.concrete,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: SPACING.section,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
  },
  caption: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.92)',
    paddingHorizontal: SPACING.section,
  },
  captionHandle: {
    fontFamily: FONTS.spaceGroteskBold,
    color: WEROL_TOKENS.paper,
  },
  viewComments: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: WEROL_TOKENS.muted,
    paddingHorizontal: SPACING.section,
  },
});
