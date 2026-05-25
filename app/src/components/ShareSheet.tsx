// ShareSheet — Maroš v2 "SEND TO FRIENDS" bottom sheet.
// Product summary card + 4-col grid of friend avatars (initials) + COPY LINK / SEND TO N.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
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
import CloseIcon from '../assets/icons/close.svg';
import { FRIENDS } from '../data/friends';
import { useT } from '../i18n';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Friend, Product } from '../types';

type Props = {
  product: Product | null;
  onClose: () => void;
  onSent: (message: string) => void;
};

const AVATAR_TINTS = [
  '#E63946', // red
  '#22D3EE', // cyan
  '#A78BFA', // violet
  '#FF6B2C', // orange
  '#F2C94C', // yellow
  '#FF3D8A', // magenta
  '#FF7A2B', // sunset
  '#5BB000', // green
];

function avatarTintFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_TINTS[Math.abs(hash) % AVATAR_TINTS.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + (parts.length > 1 ? last : '')).toUpperCase().slice(0, 2);
}

export function ShareSheet({ product, onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const visible = product !== null;
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const backdropOpacity = useSharedValue(0);
  const sheetTranslate = useSharedValue(600);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 220 });
      sheetTranslate.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      sheetTranslate.value = withTiming(600, { duration: 220 });
      setSelected(new Set());
    }
  }, [visible, backdropOpacity, sheetTranslate]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslate.value }],
  }));

  const toggleFriend = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = () => {
    if (!product) return;
    onSent('Link copied');
    onClose();
  };

  const handleSend = () => {
    if (!product || selected.size === 0) return;
    const names = FRIENDS.filter((f) => selected.has(f.id)).map((f) => f.name).join(', ');
    onSent(t('share.sent', { name: names }));
    onClose();
  };

  const friendChunks = useMemo(() => {
    const chunks: Friend[][] = [];
    for (let i = 0; i < FRIENDS.length; i += 4) {
      chunks.push(FRIENDS.slice(i, i + 4));
    }
    return chunks;
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + SPACING.md },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerLabel}>SEND TO FRIENDS</Text>
            <Pressable onPress={onClose} hitSlop={12} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
              <CloseIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.6} fill="none" />
            </Pressable>
          </View>

          {product && (
            <View style={styles.productCard}>
              <Image source={product.image} style={styles.productThumb} resizeMode="cover" />
              <View style={styles.productMeta}>
                <Text style={styles.productName} numberOfLines={1}>
                  {product.name.toUpperCase()}
                </Text>
                <Text style={styles.productSub} numberOfLines={1}>
                  {product.brand.toUpperCase()} · {product.price.current} {product.price.currency}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.friendsGrid}>
            {friendChunks.map((row, i) => (
              <View key={i} style={styles.friendsRow}>
                {row.map((f) => {
                  const isSelected = selected.has(f.id);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => toggleFriend(f.id)}
                      style={({ pressed }) => [styles.friend, pressed && { opacity: 0.7 }]}
                    >
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: avatarTintFor(f.id) },
                          isSelected && styles.avatarSelected,
                        ]}
                      >
                        <Text style={styles.avatarText}>{initialsFor(f.name)}</Text>
                      </View>
                      <Text style={styles.friendHandle} numberOfLines={1}>
                        {f.handle.replace(/^@/, '')}
                      </Text>
                    </Pressable>
                  );
                })}
                {/* Pad row to 4 columns */}
                {Array.from({ length: 4 - row.length }).map((_, j) => (
                  <View key={`pad-${j}`} style={styles.friend} />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.ctaRow}>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.copyText}>COPY LINK</Text>
            </Pressable>
            <Pressable
              onPress={handleSend}
              disabled={selected.size === 0}
              style={({ pressed }) => [
                styles.sendBtn,
                selected.size === 0 && styles.sendBtnDisabled,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.sendText, selected.size === 0 && { opacity: 0.5 }]}>
                SEND TO {selected.size}
              </Text>
            </Pressable>
          </View>
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
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: WEROL_TOKENS.line,
  },
  productMeta: {
    flex: 1,
    gap: 3,
  },
  productName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: -0.2,
    color: WEROL_TOKENS.paper,
  },
  productSub: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.2,
    color: WEROL_TOKENS.muted2,
  },
  friendsGrid: {
    gap: SPACING.md,
    marginTop: SPACING.xs,
  },
  friendsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  friend: {
    width: '22%',
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderWidth: 3,
    borderColor: WEROL_TOKENS.lime,
  },
  avatarText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  },
  friendHandle: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.muted,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.sm,
  },
  copyBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.paper,
  },
  sendBtn: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.lime,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: WEROL_TOKENS.line2,
  },
  sendText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 12,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.pitch,
  },
});
