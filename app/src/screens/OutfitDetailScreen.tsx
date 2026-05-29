// OutfitDetailScreen — full-screen view of a community outfit.
// Header (avatar + handle + FOLLOW), hero image with tagged-piece chips
// across the bottom, action row (like / comment / share / bookmark),
// caption, tagged products list, comments thread.

import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackIcon from '../assets/icons/back.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HeartIcon from '../assets/icons/heart.svg';
import SendIcon from '../assets/icons/send.svg';
import ShareIcon from '../assets/icons/share.svg';
import { getOutfitById } from '../data/outfits';
import { PRODUCTS } from '../data/products';
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

type Props = {
  route?: { params?: { outfitId?: string } };
  navigation?: any;
};

function relTime(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

export function OutfitDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const outfit = getOutfitById(route?.params?.outfitId ?? '');

  if (!outfit) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.notFound}>Outfit not found.</Text>
      </View>
    );
  }

  const liked = useIsOutfitLiked(outfit.id);
  const bookmarked = useIsOutfitBookmarked(outfit.id);
  const followed = useIsFollowed(outfit.ownerHandle);
  const toggleLike = useOutfitFeedStore((s) => s.toggleLike);
  const toggleBookmark = useOutfitFeedStore((s) => s.toggleBookmark);
  const toggleFollow = useOutfitFeedStore((s) => s.toggleFollow);
  const showToast = useShareStore((s) => s.showToast);

  const taggedProducts = outfit.taggedProductIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 140,
        }}
      >
        <View style={styles.heroWrap}>
          <Image
            source={outfit.image}
            style={styles.heroBackdrop}
            resizeMode="cover"
            blurRadius={28}
          />
          <View style={styles.heroDim} pointerEvents="none" />
          <BlurView intensity={40} tint="dark" style={styles.heroBlur} pointerEvents="none" />
          <Image source={outfit.image} style={styles.hero} resizeMode="contain" />
        </View>

        <View style={styles.body}>
          <View style={styles.ownerRow}>
            <View style={[styles.ownerAvatar, { backgroundColor: outfit.ownerTint }]}>
              <Text style={styles.ownerInitials}>{outfit.ownerInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ownerHandle}>@{outfit.ownerHandle}</Text>
              <Text style={styles.ownerMeta}>
                {outfit.likes} likes · {outfit.savedCount} saved · {relTime(outfit.createdAt)}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                toggleFollow(outfit.ownerHandle);
                showToast(followed ? `Unfollow @${outfit.ownerHandle}` : `Sleduješ @${outfit.ownerHandle}`);
              }}
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

          {outfit.caption && (
            <Text style={styles.caption}>{outfit.caption}</Text>
          )}

          <View style={styles.actionBar}>
            <ActionPill
              Icon={HeartIcon}
              active={liked}
              activeColor={WEROL_TOKENS.lime}
              label={String(outfit.likes + (liked ? 1 : 0))}
              onPress={() => toggleLike(outfit.id)}
            />
            <ActionPill
              Icon={SendIcon}
              label={String(outfit.comments.length)}
              onPress={() => {}}
            />
            <ActionPill
              Icon={ShareIcon}
              label="SHARE"
              onPress={() => {
                if (taggedProducts[0]) {
                  // Reuse product share sheet — picks first tagged product.
                  useShareStore.getState().openShare(taggedProducts[0]);
                }
              }}
            />
            <ActionPill
              Icon={BookmarkIcon}
              active={bookmarked}
              activeColor={WEROL_TOKENS.lime}
              label="SAVE"
              onPress={() => toggleBookmark(outfit.id)}
            />
          </View>

          {taggedProducts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>TAGGED · {taggedProducts.length}</Text>
              {taggedProducts.map((p) => (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    navigation?.navigate?.('ProductDetails', { productId: p.id })
                  }
                  style={({ pressed }) => [styles.taggedRow, pressed && { opacity: 0.7 }]}
                >
                  <Image source={p.image} style={styles.taggedThumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taggedBrand}>{p.brand.toUpperCase()}</Text>
                    <Text style={styles.taggedName} numberOfLines={1}>{p.name}</Text>
                  </View>
                  <Text style={styles.taggedPrice}>
                    {p.price.current} {p.price.currency}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMMENTS · {outfit.comments.length}</Text>
            {outfit.comments.map((c) => (
              <View key={c.id} style={styles.commentRow}>
                <View style={[styles.commentAvatar, { backgroundColor: c.authorTint }]}>
                  <Text style={styles.commentInitials}>{c.authorInitials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.commentHead}>
                    <Text style={styles.commentHandle}>@{c.authorHandle}</Text>
                    <Text style={styles.commentTime}>{relTime(c.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentBody}>{c.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Header overlay */}
      <View style={[styles.headerOverlay, { paddingTop: insets.top + 6 }]}>
        <Pressable
          accessibilityLabel="Back"
          onPress={() => navigation?.goBack?.()}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <BackIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
        </Pressable>
        <Text style={styles.headerTitle}>@{outfit.ownerHandle}</Text>
        <View style={{ width: 36 }} />
      </View>
    </View>
  );
}

function ActionPill({
  Icon,
  label,
  active = false,
  activeColor,
  onPress,
}: {
  Icon: React.FC<{ width?: number; height?: number; stroke?: string; fill?: string; strokeWidth?: number }>;
  label: string;
  active?: boolean;
  activeColor?: string;
  onPress: () => void;
}) {
  const color = active && activeColor ? activeColor : WEROL_TOKENS.paper;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionPill, pressed && { opacity: 0.7 }]}
    >
      <Icon width={18} height={18} stroke={color} fill={active ? color : 'none'} strokeWidth={1.8} />
      <Text style={[styles.actionLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  notFound: {
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  heroWrap: {
    marginHorizontal: SPACING.section,
    aspectRatio: 0.78,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
    position: 'relative',
  },
  hero: { width: '100%', height: '100%' },
  heroBackdrop: { ...StyleSheet.absoluteFillObject },
  heroBlur: { ...StyleSheet.absoluteFillObject },
  heroDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.35)',
  },
  body: {
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitials: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.3,
  },
  ownerHandle: {
    fontFamily: FONTS.archivoBold,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
  ownerMeta: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: WEROL_TOKENS.muted2,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: WEROL_TOKENS.lime,
  },
  followText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: WEROL_TOKENS.pitch,
  },
  followingBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  followingText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 11,
    letterSpacing: 0.6,
    color: WEROL_TOKENS.muted,
  },
  caption: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    lineHeight: 20,
    color: WEROL_TOKENS.paper,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  actionLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  section: {
    gap: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  taggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  taggedThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: WEROL_TOKENS.line,
  },
  taggedBrand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.lime,
  },
  taggedName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  taggedPrice: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.4,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 6,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInitials: {
    fontFamily: FONTS.archivoBold,
    fontSize: 10,
    color: WEROL_TOKENS.paper,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  commentHandle: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    color: WEROL_TOKENS.paper,
  },
  commentTime: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    color: WEROL_TOKENS.muted2,
    letterSpacing: 0.4,
  },
  commentBody: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
    marginTop: 2,
    lineHeight: 18,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(10,10,12,0.85)',
  },
  headerTitle: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,22,26,0.6)',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
});
