import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FRIENDS } from '../data/friends';
import { useT } from '../i18n';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Friend, Product } from '../types';

type Props = {
  product: Product | null;
  onClose: () => void;
  onSent: (message: string) => void;
};

export function ShareSheet({ product, onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const visible = product !== null;

  const backdropOpacity = useSharedValue(0);
  const sheetTranslate = useSharedValue(400);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 220 });
      sheetTranslate.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      sheetTranslate.value = withTiming(400, { duration: 220 });
    }
  }, [visible, backdropOpacity, sheetTranslate]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslate.value }],
  }));

  const handleFriend = (friend: Friend) => {
    onSent(t('share.sent', { name: friend.name }));
    onClose();
  };

  const handleNativeShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.brand} — ${product.name} za ${product.price.current} ${product.price.currency}\n${product.takeItUrl}`,
      });
    } catch {}
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={styles.grabber} />
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{t('share.title')}</Text>
              {product && (
                <Text style={styles.subtitle} numberOfLines={1}>
                  {product.brand} — {product.name}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.cream2} />
            </Pressable>
          </View>

          <FlatList
            data={FRIENDS}
            keyExtractor={(f) => f.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendsRow}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleFriend(item)}
                style={({ pressed }) => [styles.friend, pressed && styles.friendPressed]}
              >
                <View style={styles.avatarRing}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                </View>
                <Text style={styles.friendName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.friendHandle} numberOfLines={1}>
                  {item.handle}
                </Text>
              </Pressable>
            )}
          />

          <Pressable
            onPress={handleNativeShare}
            style={({ pressed }) => [styles.nativeBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="share-outline" size={18} color={COLORS.cream} />
            <Text style={styles.nativeBtnText}>{t('share.nativeFallback')}</Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.ink2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.ink4,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 24,
    color: COLORS.cream,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 12,
    color: COLORS.cream3,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.ink3,
  },
  friendsRow: {
    gap: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  friend: {
    width: 78,
    alignItems: 'center',
    gap: 4,
  },
  friendPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: COLORS.teal,
    padding: 2,
    marginBottom: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    backgroundColor: COLORS.ink3,
  },
  friendName: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 12,
    color: COLORS.cream,
    textAlign: 'center',
  },
  friendHandle: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 9,
    color: COLORS.cream3,
    textAlign: 'center',
  },
  nativeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.ink3,
    borderRadius: RADII.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
  },
  nativeBtnText: {
    flex: 1,
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 14,
    color: COLORS.cream,
  },
});
