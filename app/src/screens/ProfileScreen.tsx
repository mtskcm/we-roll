// ProfileScreen (ME) — IG/TikTok-style: header (avatar · name · stats · edit),
// segment control (My FITS · Saved · Liked) → grid, settings behind the gear.
// Owns the edit-profile sheet and the full-screen outfit viewer.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { LanguageSheet } from '../components/LanguageSheet';
import { formatPrice, relTime } from '../lib/format';
import { useCollections } from '../store/collectionsStore';
import { useEngagementStore } from '../store/engagementStore';
import { useProducts, useProductsStore } from '../store/productsStore';
import { useOrders } from '../store/ordersStore';
import { useFeedStore } from '../store/feedStore';
import { useSettingsStore } from '../store/settingsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { useUnreadCount } from '../store/messagesStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import type { Outfit, Product } from '../types';

// NOTE: likes are intentionally NOT shown on the profile — a like is a private
// recommendation-algorithm signal (with dwell time, shares, click-throughs).
type Segment = 'fits' | 'saved' | 'orders';

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const navigation = useNavigation<any>();
  const PRODUCTS = useProducts();

  const saved = useFeedStore((s) => s.saved);
  const orders = useOrders();
  const collections = useCollections();
  const [openCollection, setOpenCollection] = useState<string | 'all' | null>(null);
  const profile = useUserStore((s) => s.profile);
  const email = useUserStore((s) => s.email);
  const savedOutfits = useUserStore((s) => s.savedOutfits);
  const deleteOutfit = useUserStore((s) => s.deleteOutfit);
  const signOut = useUserStore((s) => s.signOut);
  const resetPassword = useUserStore((s) => s.resetPassword);
  const unread = useUnreadCount();
  const showToast = useShareStore((s) => s.showToast);

  const language = useSettingsStore((s) => s.language);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const toggleNotifications = useSettingsStore((s) => s.toggleNotifications);

  const [segment, setSegment] = useState<Segment>('fits');
  // Leaving/returning to a segment resets the open collection to the grid.
  useEffect(() => setOpenCollection(null), [segment]);
  const [langOpen, setLangOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewedOutfit, setViewedOutfit] = useState<Outfit | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const settingsY = useRef(0);

  const savedProducts = useMemo(
    () => PRODUCTS.filter((p) => saved.includes(p.id)),
    [PRODUCTS, saved],
  );

  // 3 columns, gap 8, 3:4 tiles (kit)
  const tile = (winWidth - SPACING.section * 2 - 16) / 3;
  const tileH = Math.round(tile * (4 / 3));

  const openProduct = (p: Product) =>
    navigation.navigate('Home', { screen: 'ProductDetails', params: { productId: p.id } });

  const handlePasswordReset = async () => {
    if (!email) {
      showToast('No account email');
      return;
    }
    const { error } = await resetPassword(email);
    showToast(error ? error : `Password reset link sent to ${email}`);
  };

  const gridProducts = segment === 'saved' ? savedProducts : [];

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
          {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          {!!profile.joinedAt && (
            <Text style={styles.joined}>MEMBER SINCE {profile.joinedAt}</Text>
          )}

          <View style={styles.stats}>
            <Stat value={savedOutfits.length} label="Outfits" onPress={() => setSegment('fits')} />
            <View style={styles.statDivider} />
            <Stat value={orders.length} label="Orders" onPress={() => setSegment('orders')} />
            <View style={styles.statDivider} />
            <Stat value={saved.length} label="Saved" onPress={() => setSegment('saved')} />
          </View>

          <Pressable
            onPress={() => setEditOpen(true)}
            style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.editText}>Edit profile</Text>
          </Pressable>
        </View>

        {/* Segments */}
        <View style={styles.segments}>
          <Seg label="My Fits" active={segment === 'fits'} onPress={() => setSegment('fits')} />
          <Seg label="Saved" active={segment === 'saved'} onPress={() => setSegment('saved')} />
          <Seg label="Orders" active={segment === 'orders'} onPress={() => setSegment('orders')} />
        </View>

        {/* Grid */}
        {segment === 'fits' ? (
          savedOutfits.length === 0 ? (
            <Empty text="No fits yet. Build one in CREATE." />
          ) : (
            <View style={styles.grid}>
              {/* "+" tile → CREATE (kit) */}
              <Pressable
                onPress={() => navigation.navigate('Fit')}
                style={[styles.addTile, { width: tile, height: tileH }]}
              >
                <Text style={styles.addTileText}>+</Text>
              </Pressable>
              {savedOutfits.map((o) => {
                const first = Object.values(o.slots)
                  .map((id) => PRODUCTS.find((p) => p.id === id))
                  .find(Boolean);
                return (
                  <Pressable
                    key={o.id}
                    onPress={() => setViewedOutfit(o)}
                    style={[styles.tile, { width: tile, height: tileH }]}
                  >
                    {o.image ? (
                      <Image source={{ uri: o.image }} style={styles.tileImg} resizeMode="cover" />
                    ) : first ? (
                      <Image source={first.image} style={styles.tileImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.tileImg} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )
        ) : segment === 'orders' ? (
          orders.length === 0 ? (
            <Empty text="No orders yet — tap BUY on a piece you love." />
          ) : (
            <View style={styles.ordersList}>
              {orders.map((o) => {
                const p = PRODUCTS.find((x) => x.id === o.productId);
                return (
                  <Pressable
                    key={`${o.productId}-${o.at}`}
                    onPress={() => p && openProduct(p)}
                    disabled={!p}
                    style={({ pressed }) => [styles.orderRow, pressed && p && { opacity: 0.7 }]}
                  >
                    <View style={styles.orderThumbWrap}>
                      {p ? (
                        <Image source={p.image} style={styles.orderThumb} resizeMode="cover" />
                      ) : (
                        <View style={styles.orderThumb} />
                      )}
                    </View>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderName} numberOfLines={1}>{o.name}</Text>
                      <Text style={styles.orderMeta} numberOfLines={1}>
                        {(o.brand || 'WEROL').toUpperCase()} · {relTime(o.at)}
                      </Text>
                    </View>
                    {p && (
                      <Text style={styles.orderPrice}>
                        {formatPrice(p.price.current, p.price.currency)}
                      </Text>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )
        ) : openCollection ? (
          /* Inside a collection → its products */
          (() => {
            const coll = openCollection === 'all'
              ? { name: 'All saved', productIds: saved }
              : collections.find((c) => c.id === openCollection);
            const items = (coll?.productIds ?? [])
              .map((id) => PRODUCTS.find((p) => p.id === id))
              .filter((p): p is Product => !!p);
            return (
              <View>
                <Pressable onPress={() => setOpenCollection(null)} style={styles.collBack} hitSlop={8}>
                  <Text style={styles.collBackText}>‹ {coll?.name ?? 'Collection'}</Text>
                </Pressable>
                {items.length === 0 ? (
                  <Empty text="This collection is empty." />
                ) : (
                  <View style={styles.grid}>
                    {items.map((p) => (
                      <Pressable key={p.id} onPress={() => openProduct(p)} style={[styles.tile, { width: tile, height: tileH }]}>
                        <Image source={p.image} style={styles.tileImg} resizeMode="cover" />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })()
        ) : saved.length === 0 && collections.length === 0 ? (
          <Empty text="Nothing saved yet — tap the bookmark on a piece." />
        ) : (
          /* Collections grid: All + your collections (cover = first item) */
          <View style={styles.grid}>
            <CollectionTile
              name="All saved"
              count={saved.length}
              cover={savedProducts[0]?.image}
              width={tile}
              height={tileH}
              onPress={() => setOpenCollection('all')}
            />
            {collections.map((c) => {
              const coverP = c.productIds.map((id) => PRODUCTS.find((p) => p.id === id)).find(Boolean);
              return (
                <CollectionTile
                  key={c.id}
                  name={c.name}
                  count={c.productIds.length}
                  cover={coverP?.image}
                  width={tile}
                  height={tileH}
                  onPress={() => setOpenCollection(c.id)}
                />
              );
            })}
          </View>
        )}

        {/* Settings */}
        <View onLayout={(e) => (settingsY.current = e.nativeEvent.layout.y)} style={styles.settings}>
          <Text style={styles.settingsTitle}>Settings</Text>
          {!!email && <SettingRow icon="mail-outline" label="Email" trailing={email} />}
          <SettingRow icon="notifications-outline" label="Notifications">
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: WEROL_TOKENS.line2, true: WEROL_TOKENS.lime }}
              thumbColor={WEROL_TOKENS.paper}
              ios_backgroundColor={WEROL_TOKENS.line2}
            />
          </SettingRow>
          <SettingRow
            icon="globe-outline"
            label="Language"
            trailing={language === 'sk' ? 'Slovenčina' : 'English'}
            onPress={() => setLangOpen(true)}
          />
          <SettingRow icon="key-outline" label="Change password" onPress={handlePasswordReset} />
          <SettingRow
            icon="sparkles-outline"
            label="Reset recommendations"
            onPress={() => {
              useEngagementStore.getState().reset();
              useProductsStore.getState().hydrate();
              showToast('Recommendations reset — feed refreshed');
            }}
          />
          <Pressable
            onPress={() => signOut()}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="log-out-outline" size={18} color={WEROL_TOKENS.tintRed} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>

      <LanguageSheet visible={langOpen} onClose={() => setLangOpen(false)} />
      <EditProfileSheet visible={editOpen} onClose={() => setEditOpen(false)} />
      <OutfitViewer
        outfit={viewedOutfit}
        products={PRODUCTS}
        onClose={() => setViewedOutfit(null)}
        onOpenProduct={(p) => {
          setViewedOutfit(null);
          openProduct(p);
        }}
        onDelete={(o) => {
          deleteOutfit(o.id);
          setViewedOutfit(null);
          showToast('Outfit deleted');
        }}
      />
    </View>
  );
}

// Edit-profile bottom sheet — name / handle / bio, saved to Supabase profiles.
function EditProfileSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const profile = useUserStore((s) => s.profile);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const showToast = useShareStore((s) => s.showToast);

  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle.replace(/^@/, ''));
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form whenever the sheet opens with fresh profile data.
  const wasVisible = useRef(false);
  if (visible && !wasVisible.current) {
    wasVisible.current = true;
    if (name !== profile.name) setName(profile.name);
    if (handle !== profile.handle.replace(/^@/, '')) setHandle(profile.handle.replace(/^@/, ''));
    if (bio !== (profile.bio ?? '')) setBio(profile.bio ?? '');
  } else if (!visible && wasVisible.current) {
    wasVisible.current = false;
  }

  const canSave = name.trim().length >= 2 && handle.trim().length >= 3 && !saving;

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const { error: err } = await updateProfile({ name, handle, bio });
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    showToast('Profile saved');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetBackdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetLabel}>EDIT PROFILE</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={WEROL_TOKENS.paper} />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>NAME</Text>
          <TextInput
            value={name}
            onChangeText={(v) => { setName(v); setError(null); }}
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={WEROL_TOKENS.muted2}
            maxLength={40}
          />
          <Text style={styles.fieldLabel}>HANDLE</Text>
          <TextInput
            value={handle}
            onChangeText={(v) => { setHandle(v.toLowerCase().replace(/[^a-z0-9]/g, '')); setError(null); }}
            style={styles.input}
            placeholder="handle"
            placeholderTextColor={WEROL_TOKENS.muted2}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={24}
          />
          <Text style={styles.fieldLabel}>BIO</Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            style={[styles.input, styles.inputMultiline]}
            placeholder="A few words about your style…"
            placeholderTextColor={WEROL_TOKENS.muted2}
            multiline
            maxLength={160}
          />
          {error && <Text style={styles.sheetError}>{error}</Text>}
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            style={({ pressed }) => [styles.saveBtn, !canSave && { opacity: 0.4 }, pressed && canSave && { opacity: 0.85 }]}
          >
            <Text style={styles.saveText}>{saving ? 'SAVING…' : 'ULOŽIŤ'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Full-screen viewer for a saved FIT — snapshot, pieces, delete.
function OutfitViewer({
  outfit,
  products,
  onClose,
  onOpenProduct,
  onDelete,
}: {
  outfit: Outfit | null;
  products: Product[];
  onClose: () => void;
  onOpenProduct: (p: Product) => void;
  onDelete: (o: Outfit) => void;
}) {
  const insets = useSafeAreaInsets();
  if (!outfit) return null;
  const pieces = Object.values(outfit.slots)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);
  const first = pieces[0];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.viewerRoot}>
        {outfit.image ? (
          <Image source={{ uri: outfit.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : first ? (
          <Image source={first.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View style={styles.viewerScrim} />

        <View style={[styles.viewerTop, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.viewerBtn}>
            <Ionicons name="close" size={22} color={WEROL_TOKENS.paper} />
          </Pressable>
          <Text style={styles.viewerTitle}>{outfit.name}</Text>
          <Pressable onPress={() => onDelete(outfit)} hitSlop={10} style={styles.viewerBtn}>
            <Ionicons name="trash-outline" size={20} color={WEROL_TOKENS.tintRed} />
          </Pressable>
        </View>

        {pieces.length > 0 && (
          <View style={[styles.viewerPieces, { paddingBottom: insets.bottom + 20 }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.viewerStrip}>
              {pieces.map((p) => (
                <Pressable key={p.id} onPress={() => onOpenProduct(p)} style={styles.viewerTag}>
                  <Image source={p.image} style={styles.viewerThumb} resizeMode="contain" />
                  <View>
                    <Text style={styles.viewerBrand} numberOfLines={1}>{p.brand || 'SHOP'}</Text>
                    <Text style={styles.viewerName} numberOfLines={1}>{p.name}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
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

function CollectionTile({
  name,
  count,
  cover,
  width,
  height,
  onPress,
}: {
  name: string;
  count: number;
  cover?: Product['image'];
  width: number;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tile, { width, height }]}>
      {cover ? (
        <Image source={cover} style={styles.tileImg} resizeMode="cover" />
      ) : (
        <View style={[styles.tileImg, styles.collEmpty]} />
      )}
      <View style={styles.collOverlay} pointerEvents="none">
        <Text style={styles.collName} numberOfLines={1}>{name}</Text>
        <Text style={styles.collCount}>{count}</Text>
      </View>
    </Pressable>
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
      {trailing ? <Text style={styles.settingTrailing} numberOfLines={1}>{trailing}</Text> : null}
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
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  topBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: WEROL_TOKENS.tintRed,
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
    fontFamily: FONTS.archivoSemibold,
    fontSize: 21,
    color: WEROL_TOKENS.paper,
    marginTop: 12,
  },
  handle: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    marginTop: 2,
  },
  bio: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    lineHeight: 19,
    color: WEROL_TOKENS.paper,
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
  },
  joined: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.4,
    color: WEROL_TOKENS.muted2,
    marginTop: 8,
  },
  // Stat block — kit: surface card, big 800 numbers, gray labels
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 18,
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 23,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  },
  statLabel: {
    fontFamily: FONTS.manropeSemibold,
    fontSize: 13,
    color: '#8A8B90',
    marginTop: 2,
  },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.09)' },
  // Edit profile — kit secondary pill
  editBtn: {
    marginTop: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 9999,
    backgroundColor: WEROL_TOKENS.surface2,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  editText: {
    fontFamily: FONTS.manropeBold,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
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
    fontFamily: FONTS.archivoSemibold,
    fontSize: 12,
    letterSpacing: 0.3,
    color: WEROL_TOKENS.muted,
  },
  segTextActive: { color: WEROL_TOKENS.pitch },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: SPACING.section,
  },
  tile: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
  },
  addTile: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: WEROL_TOKENS.concrete,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTileText: { fontFamily: FONTS.manropeBold, fontSize: 26, color: '#3A3B40' },
  // Collections
  collEmpty: { backgroundColor: WEROL_TOKENS.concrete },
  collOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  collName: { fontFamily: FONTS.interSemibold, fontSize: 14, color: WEROL_TOKENS.paper },
  collCount: { fontFamily: FONTS.inter, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  collBack: { paddingHorizontal: SPACING.section, paddingBottom: 12 },
  collBackText: { fontFamily: FONTS.interSemibold, fontSize: 16, color: WEROL_TOKENS.paper },
  // Orders — clean list rows (thumb · name/brand/when · price)
  ordersList: { paddingHorizontal: SPACING.section },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  orderThumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.frame,
  },
  orderThumb: { width: '100%', height: '100%' },
  orderInfo: { flex: 1, gap: 2 },
  orderName: { fontFamily: FONTS.manropeSemibold, fontSize: 15, color: WEROL_TOKENS.paper },
  orderMeta: { fontFamily: FONTS.manropeSemibold, fontSize: 11, letterSpacing: 0.6, color: WEROL_TOKENS.muted2 },
  orderPrice: { fontFamily: FONTS.manropeExtraBold, fontSize: 15, color: WEROL_TOKENS.paper },
  tileImg: { width: '100%', height: '100%', backgroundColor: WEROL_TOKENS.concrete },
  empty: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: SPACING.section,
  },
  emptyText: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    textAlign: 'center',
  },
  settings: {
    marginTop: 28,
    paddingHorizontal: SPACING.section,
  },
  settingsTitle: {
    fontFamily: FONTS.archivoSemibold,
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
    fontFamily: FONTS.archivoRegular,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
  },
  settingTrailing: {
    fontFamily: FONTS.archivoRegular,
    fontSize: 14,
    color: WEROL_TOKENS.muted,
    maxWidth: 180,
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
    fontFamily: FONTS.archivoSemibold,
    fontSize: 14,
    color: WEROL_TOKENS.tintRed,
  },

  // edit-profile sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sheetLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  fieldLabel: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted2,
    marginTop: 6,
  },
  input: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: WEROL_TOKENS.paper,
    fontFamily: FONTS.archivoRegular,
    fontSize: 15,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  sheetError: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: WEROL_TOKENS.tintRed,
    letterSpacing: 0.5,
  },
  saveBtn: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: WEROL_TOKENS.lime,
    borderRadius: 9999,
    paddingVertical: 15,
  },
  saveText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.5,
    color: WEROL_TOKENS.pitch,
  },

  // outfit viewer
  viewerRoot: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  viewerScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,12,0.25)',
  },
  viewerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingBottom: 10,
  },
  viewerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,22,26,0.7)',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  viewerTitle: {
    fontFamily: FONTS.archivoSemibold,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
    letterSpacing: 0.2,
  },
  viewerPieces: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  viewerStrip: { gap: 8, paddingHorizontal: SPACING.section },
  viewerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 10,
    paddingRight: 12,
    paddingVertical: 5,
    paddingLeft: 5,
    maxWidth: 220,
  },
  viewerThumb: { width: 34, height: 34, borderRadius: 7, backgroundColor: WEROL_TOKENS.frame },
  viewerBrand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 8,
    letterSpacing: 1,
    color: WEROL_TOKENS.muted2,
  },
  viewerName: {
    fontFamily: FONTS.archivoSemibold,
    fontSize: 12,
    color: WEROL_TOKENS.pitch,
    maxWidth: 150,
  },
});
