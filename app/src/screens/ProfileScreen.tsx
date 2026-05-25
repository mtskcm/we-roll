import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreatorsCarousel } from '../components/CreatorsCarousel';
import { LanguageSheet } from '../components/LanguageSheet';
import { ShopAvatar } from '../components/ShopAvatar';
import { CREATORS } from '../data/creators';
import { FRIENDS } from '../data/friends';
import { ORDERS, type Order, type OrderStatus } from '../data/orders';
import { PRODUCTS } from '../data/products';
import { useT } from '../i18n';
import { useFeedStore } from '../store/feedStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore, type Sizes } from '../store/userStore';
import { COLORS, WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import type { Product } from '../types';

function formatJoined(iso: string, locale: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const t = useT();
  const liked = useFeedStore((s) => s.liked);
  const saved = useFeedStore((s) => s.saved);
  const requestFeedIndex = useFeedStore((s) => s.requestFeedIndex);
  const language = useSettingsStore((s) => s.language);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);
  const themeMode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const profile = useUserStore((s) => s.profile);
  const userEmail = useUserStore((s) => s.email);
  const userSizes = useUserStore((s) => s.sizes);
  const followedBrands = useUserStore((s) => s.followedBrands);
  const savedOutfits = useUserStore((s) => s.savedOutfits);
  const logout = useUserStore((s) => s.logout);
  const setSize = useUserStore((s) => s.setSize);
  const toggleBrand = useUserStore((s) => s.toggleBrand);

  const [langSheetOpen, setLangSheetOpen] = useState(false);

  const likedProducts = PRODUCTS.filter((p) => liked.includes(p.id));
  const savedProducts = PRODUCTS.filter((p) => saved.includes(p.id));

  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Record<string, number>>({});

  const open = (p: Product) => {
    const idx = PRODUCTS.findIndex((x) => x.id === p.id);
    requestFeedIndex(idx);
    navigation.jumpTo('Home');
  };

  const scrollToSection = (key: string) => {
    const y = positions.current[key];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.lg }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <ShopAvatar
          initials={profile.initials}
          size={64}
          bg={COLORS.ink2}
          textColor={COLORS.teal}
          borderColor={COLORS.ink3}
        />
        <View>
          <Text style={TEXT_STYLES.heading}>{profile.name}</Text>
          <Text style={styles.handle}>{userEmail ?? profile.handle}</Text>
          <Text style={styles.joined}>
            {t('profile.joined', {
              date: formatJoined(profile.joinedAt, language === 'sk' ? 'sk-SK' : 'en-GB'),
            })}
          </Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <Stat
          label={t('profile.stat.liked')}
          value={liked.length}
          onPress={() => scrollToSection('liked')}
        />
        <Stat
          label={t('profile.stat.saved')}
          value={saved.length}
          onPress={() => scrollToSection('saved')}
        />
        <Stat
          label={t('profile.stat.orders')}
          value={ORDERS.length}
          onPress={() => scrollToSection('orders')}
        />
        <Stat
          label={t('profile.stat.brands')}
          value={followedBrands.length}
          onPress={() => scrollToSection('brands')}
        />
      </View>

      <View onLayout={(e) => (positions.current.creators = e.nativeEvent.layout.y)}>
        <Section title={t('profile.section.creators')}>
          <CreatorsCarousel creators={CREATORS} />
        </Section>
      </View>

      <View onLayout={(e) => (positions.current.liked = e.nativeEvent.layout.y)}>
        <Section
          title={t('profile.section.liked')}
          empty={likedProducts.length === 0 ? t('profile.empty.liked') : null}
        >
          <FlatList
            data={likedProducts}
            horizontal
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => <ProductMini product={item} onPress={() => open(item)} />}
          />
        </Section>
      </View>

      <View onLayout={(e) => (positions.current.saved = e.nativeEvent.layout.y)}>
        <Section
          title={t('profile.section.saved')}
          empty={savedProducts.length === 0 ? t('profile.empty.saved') : null}
        >
          <FlatList
            data={savedProducts}
            horizontal
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => <ProductMini product={item} onPress={() => open(item)} />}
          />
        </Section>
      </View>

      <Section
        title="Moje FIT-y"
        empty={savedOutfits.length === 0 ? 'Zatiaľ žiadne uložené outfity.' : null}
      >
        <FlatList
          data={savedOutfits}
          horizontal
          keyExtractor={(o) => o.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => {
            const products = Object.values(item.slots)
              .map((id) => PRODUCTS.find((p) => p.id === id))
              .filter((p): p is Product => Boolean(p));
            const total = products.reduce((sum, p) => sum + p.price.current, 0);
            return (
              <Pressable
                style={styles.outfitMini}
                onPress={() => navigation.jumpTo('Saved')}
              >
                <View style={styles.outfitMiniStack}>
                  {products.slice(0, 3).map((p, i) => (
                    <View
                      key={p.id}
                      style={[
                        styles.outfitMiniThumb,
                        { marginLeft: i === 0 ? 0 : -12, zIndex: 5 - i },
                      ]}
                    >
                      <Image source={p.image} style={styles.outfitMiniImg} resizeMode="cover" />
                    </View>
                  ))}
                </View>
                <Text style={styles.outfitMiniName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.outfitMinaMeta}>
                  {products.length} ks · {total} €
                </Text>
              </Pressable>
            );
          }}
        />
      </Section>

      <Section title="Priatelia">
        <FlatList
          data={FRIENDS}
          horizontal
          keyExtractor={(f) => f.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => (
            <Pressable style={styles.friendMini}>
              <Image source={{ uri: item.avatar }} style={styles.friendAvatar} />
              <Text style={styles.friendName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.friendHandle} numberOfLines={1}>{item.handle}</Text>
            </Pressable>
          )}
        />
      </Section>

      <View onLayout={(e) => (positions.current.orders = e.nativeEvent.layout.y)}>
        <Section title={t('profile.section.orders')} empty={ORDERS.length === 0 ? t('profile.orders.empty') : null}>
          {ORDERS.map((order) => (
            <OrderRow key={order.id} order={order} t={t} />
          ))}
        </Section>
      </View>

      <View onLayout={(e) => (positions.current.sizes = e.nativeEvent.layout.y)}>
        <Section title={t('profile.section.sizes')}>
          <View style={styles.sizesGrid}>
            <SizeCell
              label={t('profile.size.top')}
              value={userSizes.top}
              options={['XS', 'S', 'M', 'L', 'XL', 'XXL']}
              onPick={(v) => setSize('top', v)}
            />
            <SizeCell
              label={t('profile.size.bottom')}
              value={userSizes.bottom}
              options={['28', '30', '32', '34', '36']}
              onPick={(v) => setSize('bottom', v)}
            />
            <SizeCell
              label={t('profile.size.shoes')}
              value={userSizes.shoes}
              options={['40', '41', '42', '43', '44', '45']}
              onPick={(v) => setSize('shoes', v)}
            />
          </View>
        </Section>
      </View>

      <View onLayout={(e) => (positions.current.brands = e.nativeEvent.layout.y)}>
        <Section
          title={t('profile.section.brands')}
          empty={followedBrands.length === 0 ? t('profile.brands.empty') : null}
        >
          <View style={styles.brandsWrap}>
            {followedBrands.map((b) => (
              <Pressable
                key={b}
                onPress={() => toggleBrand(b)}
                style={({ pressed }) => [styles.brandChip, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.brandText}>{b}</Text>
                <Ionicons name="close" size={12} color={COLORS.cream3} />
              </Pressable>
            ))}
          </View>
        </Section>
      </View>

      <Section title={t('profile.section.settings')}>
        <SettingsRow
          icon="notifications-outline"
          label={t('profile.settings.notifications')}
          right={
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: COLORS.ink3, true: COLORS.teal }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.ink3}
            />
          }
        />
        <SettingsRow
          icon={themeMode === 'dark' ? 'moon-outline' : 'sunny-outline'}
          label={t('profile.settings.theme')}
          right={
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
              trackColor={{ false: COLORS.ink3, true: COLORS.teal }}
              thumbColor={COLORS.cream}
              ios_backgroundColor={COLORS.ink3}
            />
          }
        />
        <SettingsRow
          icon="globe-outline"
          label={t('profile.settings.language')}
          trailing={language === 'sk' ? t('lang.sk') : t('lang.en')}
          onPress={() => setLangSheetOpen(true)}
        />
        <SettingsRow
          icon="log-out-outline"
          label={t('profile.settings.logout')}
          tint={COLORS.likeRed}
          onPress={logout}
        />
      </Section>

      <LanguageSheet visible={langSheetOpen} onClose={() => setLangSheetOpen(false)} />
    </ScrollView>
  );
}

const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  delivered: COLORS.teal,
  shipped: WEROL_TOKENS.tintCyan,
  processing: WEROL_TOKENS.tintYellow,
};

function OrderRow({ order, t }: { order: Order; t: ReturnType<typeof useT> }) {
  const statusLabel = t(`profile.order.${order.status}` as 'profile.order.delivered');
  const items = order.productIds
    .map((id) => PRODUCTS.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));
  return (
    <View style={styles.orderRow}>
      <View style={styles.orderHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderShop}>{order.shopName}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>
        <View style={[styles.orderStatus, { borderColor: ORDER_STATUS_COLOR[order.status] }]}>
          <View
            style={[styles.orderStatusDot, { backgroundColor: ORDER_STATUS_COLOR[order.status] }]}
          />
          <Text style={[styles.orderStatusText, { color: ORDER_STATUS_COLOR[order.status] }]}>
            {statusLabel}
          </Text>
        </View>
      </View>
      <View style={styles.orderItems}>
        {items.map((p) => (
          <Image key={p.id} source={p.image} style={styles.orderItemImg} resizeMode="contain" />
        ))}
        <View style={styles.orderTotalBox}>
          <Text style={styles.orderItemCount}>
            {t('profile.order.itemCount', { n: order.itemCount })}
          </Text>
          <Text style={styles.orderTotal}>
            {order.total} {order.currency}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SizeCell({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: string | null;
  options: string[];
  onPick: (v: string) => void;
}) {
  return (
    <View style={styles.sizeCell}>
      <Text style={styles.sizeLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeOptions}>
        {options.map((opt) => {
          const active = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onPick(opt)}
              style={[styles.sizeOption, active && styles.sizeOptionActive]}
            >
              <Text style={[styles.sizeOptionText, active && styles.sizeOptionTextActive]}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Stat({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.stat, pressed && onPress && styles.statPressed]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function Section({
  title,
  children,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  empty?: string | null;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {empty ? <Text style={styles.emptyText}>{empty}</Text> : children}
    </View>
  );
}

function ProductMini({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.mini, pressed && styles.miniPressed]}
    >
      <Image source={product.image} style={styles.miniImg} resizeMode="contain" />
      <Text style={styles.miniBrand} numberOfLines={1}>
        {product.brand}
      </Text>
      <Text style={styles.miniName} numberOfLines={1}>
        {product.name}
      </Text>
      <Text style={styles.miniPrice}>
        {product.price.current} {product.price.currency}
      </Text>
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  trailing,
  right,
  onPress,
  disabled,
  tint = COLORS.cream,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || (!onPress && !right)}
      style={({ pressed }) => [
        styles.settingRow,
        pressed && onPress && { opacity: 0.7 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.settingLabel, { color: tint }]}>{label}</Text>
      <View style={styles.settingRight}>
        {right ?? (
          <>
            {trailing && <Text style={styles.settingTrailing}>{trailing}</Text>}
            {!disabled && onPress && (
              <Ionicons name="chevron-forward" size={16} color={COLORS.dim} />
            )}
            {disabled && <Ionicons name="lock-closed" size={14} color={COLORS.dim} />}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    paddingHorizontal: SPACING.section,
    paddingBottom: 140,
    gap: SPACING.hero,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  handle: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: COLORS.teal,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  joined: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: COLORS.cream3,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.lg,
  },
  stat: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  statPressed: {
    backgroundColor: COLORS.ink3,
    transform: [{ scale: 0.98 }],
  },
  statValue: {
    fontFamily: FONTS.archivoBold,
    fontSize: 32,
    color: COLORS.cream,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.cream3,
    marginTop: 4,
  },
  section: {
    gap: SPACING.lg,
  },
  sectionTitle: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: COLORS.cream3,
    textTransform: 'uppercase',
  },
  hList: {
    gap: SPACING.lg,
    paddingRight: SPACING.section,
  },
  mini: {
    width: 140,
    gap: 4,
  },
  miniPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  miniImg: {
    width: 140,
    height: 140,
    borderRadius: RADII.md,
    backgroundColor: COLORS.imagePlaceholder,
    marginBottom: 6,
  },
  miniBrand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 8,
    letterSpacing: 2,
    color: COLORS.teal,
    textTransform: 'uppercase',
  },
  miniName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 16,
    color: COLORS.cream,
  },
  miniPrice: {
    fontFamily: FONTS.interSemibold,
    fontSize: 13,
    color: COLORS.cream2,
  },
  emptyText: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: COLORS.cream2,
    fontStyle: 'italic',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.ink3,
  },
  settingLabel: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  settingTrailing: {
    fontFamily: FONTS.inter,
    fontSize: 12,
    color: COLORS.cream3,
  },
  orderRow: {
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    padding: SPACING.lg,
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  orderHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  orderShop: {
    fontFamily: FONTS.interSemibold,
    fontSize: 14,
    color: COLORS.cream,
  },
  orderDate: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: COLORS.cream3,
    marginTop: 2,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  orderStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orderStatusText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  orderItems: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  orderItemImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: COLORS.imagePlaceholder,
  },
  orderTotalBox: {
    flex: 1,
    alignItems: 'flex-end',
  },
  orderItemCount: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: COLORS.cream3,
    letterSpacing: 0.5,
  },
  orderTotal: {
    fontFamily: FONTS.interSemibold,
    fontSize: 16,
    color: COLORS.cream,
    marginTop: 2,
  },
  sizesGrid: {
    gap: SPACING.lg,
  },
  sizeCell: {
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sizeLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.cream3,
    textTransform: 'uppercase',
  },
  sizeOptions: {
    gap: SPACING.sm,
  },
  sizeOption: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.ink3,
    minWidth: 50,
    alignItems: 'center',
  },
  sizeOptionActive: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.teal,
  },
  sizeOptionText: {
    fontFamily: FONTS.interSemibold,
    fontSize: 13,
    color: COLORS.cream2,
  },
  sizeOptionTextActive: {
    color: COLORS.ink,
  },
  brandsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.ink2,
    borderRadius: RADII.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.ink3,
  },
  brandText: {
    fontFamily: FONTS.interSemibold,
    fontSize: 12,
    color: COLORS.cream,
  },
  outfitMini: {
    width: 130,
    gap: 4,
  },
  outfitMiniStack: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  outfitMiniThumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.ink3,
    borderWidth: 2,
    borderColor: COLORS.ink2,
    overflow: 'hidden',
  },
  outfitMiniImg: { width: '100%', height: '100%' },
  outfitMiniName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    color: COLORS.cream,
    letterSpacing: -0.2,
  },
  outfitMinaMeta: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    color: COLORS.cream3,
    letterSpacing: 0.5,
  },
  friendMini: {
    width: 76,
    alignItems: 'center',
    gap: 4,
  },
  friendAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.ink3,
  },
  friendName: {
    fontFamily: FONTS.interSemibold,
    fontSize: 11,
    color: COLORS.cream,
    textAlign: 'center',
  },
  friendHandle: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    color: COLORS.cream3,
    textAlign: 'center',
  },
});
