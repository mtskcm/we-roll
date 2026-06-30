// ProfileScreen (ME) — IG/TikTok-style: header (avatar · name · stats · edit),
// segment control (My FITS · Saved · Liked) → grid, settings behind the gear.
// Also the entry points for Inbox (bell) and Saved that left the bottom bar.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { LanguageSheet } from '../components/LanguageSheet';
import { useT } from '../i18n';
import { useProducts } from '../store/productsStore';
import { useFeedStore } from '../store/feedStore';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { useUnreadCount } from '../store/messagesStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

type Segment = 'fits' | 'saved' | 'liked';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const t = useT();
  const PRODUCTS = useProducts();

  const liked = useFeedStore((s) => s.liked);
  const saved = useFeedStore((s) => s.saved);
  const profile = useUserStore((s) => s.profile);
  const savedOutfits = useUserStore((s) => s.savedOutfits);
  const signOut = useUserStore((s) => s.signOut);
  const unread = useUnreadCount();

  const language = useSettingsStore((s) => s.language);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);
  const themeMode = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  const [segment, setSegment] = useState<Segment>('fits');
  const [langOpen, setLangOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const settingsY = useRef(0);

  const likedProducts = useMemo(
    () => PRODUCTS.filter((p) => liked.includes(p.id)),
    [PRODUCTS, liked],
  );
  const savedProducts = useMemo(
    () => PRODUCTS.filter((p) => saved.includes(p.id)),
    [PRODUCTS, saved],
  );

  const tile = (winWidth - SPACING.section * 2 - 4) / 3;

  const openProduct = (p: Product) =>
    navigation.navigate('Home', { screen: 'ProductDetails', params: { productId: p.id } });

  const gridProducts = segment === 'liked' ? likedProducts : segment === 'saved' ? savedProducts : [];

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <WordmarkOnDark width={104} height={19} />
        <View style={styles.topActions}>
          <Pressable onPress={() => navigation.navigate('Messages')} hitSlop={8} style={styles.topBtn}>
            <Ionicons name="notifications-outline" size={24} color={WEROL_TOKENS.paper} />
            {unread > 0 && <View style={styles.dot} />}
          </Pressable>
          <Pressable
            onPress={() => scrollRef.current?.scrollTo({ y: settingsY.current - 12, animated: true })}
            hitSlop={8}
            style={styles.topBtn}
          >
            <Ionicons name="settings-outline" size={23} color={WEROL_TOKENS.paper} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 52, paddingBottom: insets.bottom + 110 }}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.initials}</Text>
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.handle}>@{profile.handle.replace(/^@/, '')}</Text>

          <View style={styles.stats}>
            <Stat value={savedOutfits.length} label="OUTFITY" onPress={() => setSegment('fits')} />
            <View style={styles.statDivider} />
            <Stat value={liked.length} label="LAJKY" onPress={() => setSegment('liked')} />
            <View style={styles.statDivider} />
            <Stat value={saved.length} label="ULOŽENÉ" onPress={() => setSegment('saved')} />
          </View>

          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.editText}>Upraviť profil</Text>
          </Pressable>
        </View>

        {/* Segments */}
        <View style={styles.segments}>
          <Seg label="My FITS" active={segment === 'fits'} onPress={() => setSegment('fits')} />
          <Seg label="Saved" active={segment === 'saved'} onPress={() => setSegment('saved')} />
          <Seg label="Liked" active={segment === 'liked'} onPress={() => setSegment('liked')} />
        </View>

        {/* Grid */}
        {segment === 'fits' ? (
          savedOutfits.length === 0 ? (
            <Empty text="Zatiaľ žiadne outfity. Zostav si fit v CREATE." />
          ) : (
            <View style={styles.grid}>
              {savedOutfits.map((o) => {
                const first = Object.values(o.slots)
                  .map((id) => PRODUCTS.find((p) => p.id === id))
                  .find(Boolean);
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => navigation.navigate('Saved')}
                    style={[styles.tile, { width: tile, height: tile }]}
                  >
                    {first ? (
                      <Image source={first.image} style={styles.tileImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.tileImg} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )
        ) : gridProducts.length === 0 ? (
          <Empty text={segment === 'liked' ? 'Zatiaľ nič nelajknuté.' : 'Žiadne uložené kúsky.'} />
        ) : (
          <View style={styles.grid}>
            {gridProducts.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => openProduct(p)}
                style={[styles.tile, { width: tile, height: tile }]}
              >
                <Image source={p.image} style={styles.tileImg} resizeMode="cover" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Settings */}
        <View onLayout={(e) => (settingsY.current = e.nativeEvent.layout.y)} style={styles.settings}>
          <Text style={styles.settingsTitle}>Nastavenia</Text>
          <SettingRow icon="notifications-outline" label="Notifikácie">
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: WEROL_TOKENS.line2, true: WEROL_TOKENS.lime }}
              thumbColor={WEROL_TOKENS.paper}
              ios_backgroundColor={WEROL_TOKENS.line2}
            />
          </SettingRow>
          <SettingRow icon={themeMode === 'dark' ? 'moon-outline' : 'sunny-outline'} label="Tmavá téma">
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(v) => setTheme(v ? 'dark' : 'light')}
              trackColor={{ false: WEROL_TOKENS.line2, true: WEROL_TOKENS.lime }}
              thumbColor={WEROL_TOKENS.paper}
              ios_backgroundColor={WEROL_TOKENS.line2}
            />
          </SettingRow>
          <SettingRow
            icon="globe-outline"
            label="Jazyk"
            trailing={language === 'sk' ? 'Slovenčina' : 'English'}
            onPress={() => setLangOpen(true)}
          />
          <Pressable
            onPress={() => signOut()}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={18} color="#E63946" />
            <Text style={styles.logoutText}>Odhlásiť sa</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}

function Stat({ value, label, onPress }: { value: number; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function Seg({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.seg, active && styles.segActive]}>
      <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  trailing,
  onPress,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  trailing?: string;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={WEROL_TOKENS.muted} />
      <Text style={styles.settingLabel}>{label}</Text>
      {trailing ? <Text style={styles.settingTrailing}>{trailing}</Text> : null}
      {children}
      {onPress && !children ? (
        <Ionicons name="chevron-forward" size={18} color={WEROL_TOKENS.muted2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: 10,
    backgroundColor: 'rgba(10,10,12,0.92)',
  },
  topHandle: {
    flex: 1,
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 18,
    color: WEROL_TOKENS.paper,
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  topBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#E63946',
    borderWidth: 1.5,
    borderColor: WEROL_TOKENS.pitch,
  },
  identity: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 18,
    paddingHorizontal: SPACING.section,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 2,
    borderColor: WEROL_TOKENS.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.archivo,
    fontSize: 30,
    letterSpacing: -1,
    color: WEROL_TOKENS.paper,
  },
  name: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 21,
    color: WEROL_TOKENS.paper,
    marginTop: 12,
  },
  handle: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  stat: { alignItems: 'center', paddingHorizontal: 22 },
  statValue: {
    fontFamily: FONTS.archivo,
    fontSize: 22,
    letterSpacing: -0.6,
    color: WEROL_TOKENS.paper,
  },
  statLabel: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.4,
    color: WEROL_TOKENS.muted2,
    marginTop: 3,
  },
  statDivider: { width: 1, height: 28, backgroundColor: WEROL_TOKENS.line },
  editBtn: {
    marginTop: 18,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  editText: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 13,
    color: WEROL_TOKENS.paper,
    letterSpacing: 0.2,
  },
  segments: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: SPACING.section,
    marginBottom: 10,
  },
  seg: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 9999,
    backgroundColor: WEROL_TOKENS.concrete,
  },
  segActive: { backgroundColor: WEROL_TOKENS.lime },
  segText: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: WEROL_TOKENS.muted,
  },
  segTextActive: { color: WEROL_TOKENS.pitch },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    paddingHorizontal: SPACING.section,
  },
  tile: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
  },
  tileImg: { width: '100%', height: '100%', backgroundColor: WEROL_TOKENS.concrete },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: SPACING.section,
  },
  emptyText: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
  },
  settings: {
    marginTop: 28,
    paddingHorizontal: SPACING.section,
  },
  settingsTitle: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 16,
    color: WEROL_TOKENS.paper,
    marginBottom: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: WEROL_TOKENS.line,
  },
  settingLabel: {
    flex: 1,
    fontFamily: FONTS.inter,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
  },
  settingTrailing: {
    fontFamily: FONTS.inter,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(230,57,70,0.4)',
  },
  logoutText: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 14,
    color: '#E63946',
  },
});
