import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Creator } from '../types';

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

type Props = {
  creators: Creator[];
  onPress?: (c: Creator) => void;
};

export function CreatorsCarousel({ creators, onPress }: Props) {
  return (
    <FlatList
      data={creators}
      horizontal
      keyExtractor={(c) => c.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <CreatorTile creator={item} onPress={() => onPress?.(item)} />}
    />
  );
}

function CreatorTile({ creator, onPress }: { creator: Creator; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <View style={[styles.avatarRing, { borderColor: creator.tint }]}>
        <Image source={{ uri: creator.avatar }} style={styles.avatar} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {creator.name}
      </Text>
      <Text style={styles.handle} numberOfLines={1}>
        {creator.handle}
      </Text>
      <Text style={[styles.meta, { color: creator.tint }]}>
        {formatFollowers(creator.followers)} followers
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SPACING.lg,
    paddingRight: SPACING.section,
  },
  tile: {
    width: 110,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  avatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    borderWidth: 2,
    marginBottom: 6,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: RADII.pill,
    backgroundColor: COLORS.ink3,
  },
  name: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  },
  handle: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 9,
    color: COLORS.cream3,
    textAlign: 'center',
  },
  meta: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
});
