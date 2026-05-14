import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRODUCTS } from '../data/products';
import { useT } from '../i18n';
import { useFeedStore } from '../store/feedStore';
import { useMessagesStore, useUnreadCount } from '../store/messagesStore';
import { COLORS, SHOP_COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import type { Message, MessageType } from '../types';

const TYPE_ICON: Record<MessageType, keyof typeof Ionicons.glyphMap> = {
  price_drop: 'trending-down',
  restock: 'refresh',
  new_collection: 'sparkles',
};

const TYPE_LABEL_KEY: Record<MessageType, 'notif.type.price_drop' | 'notif.type.restock' | 'notif.type.new_collection'> = {
  price_drop: 'notif.type.price_drop',
  restock: 'notif.type.restock',
  new_collection: 'notif.type.new_collection',
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'teraz';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} d`;
}

export function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const t = useT();
  const messages = useMessagesStore((s) => s.messages);
  const markAsRead = useMessagesStore((s) => s.markAsRead);
  const markAllRead = useMessagesStore((s) => s.markAllRead);
  const requestFeedIndex = useFeedStore((s) => s.requestFeedIndex);
  const unread = useUnreadCount();

  const openMessage = (m: Message) => {
    markAsRead(m.id);
    if (m.productId) {
      const idx = PRODUCTS.findIndex((p) => p.id === m.productId);
      if (idx >= 0) {
        requestFeedIndex(idx);
        navigation.jumpTo('Home');
      }
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={styles.header}>
        <View>
          <Text style={TEXT_STYLES.heading}>{t('notif.title')}</Text>
          <Text style={styles.sub}>
            {unread > 0 ? t('notif.new', { n: unread }) : t('notif.allRead')}
          </Text>
        </View>
        {unread > 0 && (
          <Pressable onPress={markAllRead} style={styles.markAll}>
            <Text style={styles.markAllText}>{t('notif.markAll')}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={36} color={COLORS.dim} />
            <Text style={styles.emptyTitle}>{t('notif.empty.title')}</Text>
            <Text style={styles.emptyBody}>{t('notif.empty.body')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <MessageRow message={item} typeLabel={t(TYPE_LABEL_KEY[item.type])} onPress={() => openMessage(item)} />
        )}
      />
    </View>
  );
}

function MessageRow({
  message,
  typeLabel,
  onPress,
}: {
  message: Message;
  typeLabel: string;
  onPress: () => void;
}) {
  const tint = SHOP_COLORS[message.shopName].bg;
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: COLORS.ink3 }}
      style={({ pressed }) => [
        styles.row,
        pressed && styles.rowPressed,
        message.read && styles.rowRead,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: `${tint}25`, borderColor: `${tint}55` }]}>
        <Ionicons name={TYPE_ICON[message.type]} size={18} color={tint} />
      </View>
      <View style={styles.text}>
        <View style={styles.rowTop}>
          <Text style={[styles.shop, { color: COLORS.cream }]} numberOfLines={1}>
            {message.shopName}
          </Text>
          <Text style={styles.time}>{relativeTime(message.timestamp)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {message.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {message.body}
        </Text>
        <Text style={[styles.tag, { color: tint }]}>{typeLabel}</Text>
      </View>
      <View style={styles.trailing}>
        {!message.read && <View style={styles.unreadDot} />}
        {message.productId && (
          <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingHorizontal: SPACING.section,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  sub: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.cream3,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  markAll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  markAllText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 11,
    color: COLORS.cream2,
  },
  list: {
    gap: SPACING.lg,
    paddingBottom: 120,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.lg,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    alignItems: 'flex-start',
  },
  rowPressed: {
    backgroundColor: COLORS.ink3,
    transform: [{ scale: 0.99 }],
  },
  rowRead: {
    backgroundColor: COLORS.ink,
    borderColor: COLORS.ink2,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    paddingTop: 4,
    minHeight: 56,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  shop: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  time: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 10,
    color: COLORS.cream3,
  },
  title: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 14,
    color: COLORS.cream,
  },
  body: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 13,
    color: COLORS.cream,
    lineHeight: 18,
    opacity: 0.85,
  },
  tag: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.teal,
    borderWidth: 2,
    borderColor: COLORS.ink2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: SPACING.section,
    gap: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 22,
    color: COLORS.cream,
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 13,
    color: COLORS.cream2,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
