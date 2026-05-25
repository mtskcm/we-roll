// OutfitsFeedScreen — FITS tab: 2-col discover grid of user-uploaded outfits.

import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BellIcon from '../assets/icons/bell.svg';
import HeartIcon from '../assets/icons/heart.svg';
import SearchIcon from '../assets/icons/search.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { OUTFITS, type UserOutfit } from '../data/outfits';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

const BOTTOM_NAV_HEIGHT = 78;

export function OutfitsFeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View style={styles.root}>
      <FlatList
        data={OUTFITS}
        keyExtractor={(o) => o.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{
          paddingTop: insets.top + 80,
          paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16,
          paddingHorizontal: 12,
          gap: 12,
        }}
        renderItem={({ item }) => <OutfitCard outfit={item} onPress={() => {}} />}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.eyebrow}>— FITS</Text>
            <Text style={styles.title}>
              Outfity od{'\n'}<Text style={styles.titleAccent}>komunity.</Text>
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.topOverlay, { paddingTop: insets.top + 6 }]} pointerEvents="box-none">
        <View style={styles.topRow}>
          <WordmarkOnDark width={108} height={20} />
          <View style={styles.topRight}>
            <Pressable
              onPress={() => navigation.navigate('Search')}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <SearchIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Messages')}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <BellIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function OutfitCard({ outfit, onPress }: { outfit: UserOutfit; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
    >
      <Image source={outfit.image} style={styles.cardImage} resizeMode="cover" />

      <View style={styles.cardOverlay}>
        <View style={styles.ownerRow}>
          <View style={[styles.ownerAvatar, { backgroundColor: outfit.ownerTint }]}>
            <Text style={styles.ownerInitials}>{outfit.ownerInitials}</Text>
          </View>
          <Text style={styles.ownerHandle} numberOfLines={1}>{outfit.ownerHandle}</Text>
        </View>
      </View>

      <View style={styles.likeBadge}>
        <HeartIcon width={11} height={11} stroke={WEROL_TOKENS.pitch} fill={WEROL_TOKENS.pitch} strokeWidth={1.8} />
        <Text style={styles.likeText}>{outfit.likes}</Text>
      </View>
    </Pressable>
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
    paddingHorizontal: SPACING.section,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(10,10,12,0.85)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topRight: {
    flexDirection: 'row',
    gap: 12,
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
  listHeader: {
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
  },
  eyebrow: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 3,
    color: WEROL_TOKENS.lime,
  },
  title: {
    fontFamily: FONTS.archivo,
    fontSize: 32,
    letterSpacing: -1.2,
    lineHeight: 34,
    color: WEROL_TOKENS.paper,
  },
  titleAccent: {
    color: WEROL_TOKENS.lime,
  },
  row: {
    gap: 12,
  },
  card: {
    flex: 1,
    aspectRatio: 0.72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    padding: 8,
    backgroundColor: 'rgba(10,10,12,0.7)',
    borderRadius: 8,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerInitials: {
    fontFamily: FONTS.archivoBold,
    fontSize: 10,
    letterSpacing: -0.2,
    color: WEROL_TOKENS.paper,
  },
  ownerHandle: {
    flex: 1,
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: WEROL_TOKENS.paper,
    letterSpacing: 0.4,
  },
  likeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: WEROL_TOKENS.lime,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  likeText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 10,
    color: WEROL_TOKENS.pitch,
    letterSpacing: -0.2,
  },
});
