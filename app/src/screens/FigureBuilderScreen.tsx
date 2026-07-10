// FigureBuilderScreen (CREATE) — AI try-on studio, UI kit layout:
// header (logo + Women/Men segmented) · mannequin stage in a radius-22 card ·
// persistent "Pick your pieces" panel (chips with counts, swatches, volt CTA).
// FASHN dresses the mannequin with your SAVED pieces; saving publishes the fit.

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { formatPrice } from '../lib/format';
import { publishOutfit } from '../lib/publishOutfit';
import { dressGarment, MANNEQUIN, type Gender } from '../lib/tryon';
import { useFeedStore } from '../store/feedStore';
import { useOutfitsStore } from '../store/outfitsStore';
import { useProducts } from '../store/productsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import { SegmentedControl } from '../ui/SegmentedControl';
import { Sheet } from '../ui/Sheet';
import type { Product } from '../types';

const BOTTOM_NAV_HEIGHT = 78;
const BOTTOM_CATS = ['pants', 'shorts'];

// Garment types shown as picker chips → each maps to a FASHN try-on region.
// (FASHN handles tops/bottoms only — caps/shoes aren't garment try-on.)
const GARMENT_TYPES = [
  { key: 'tshirts', label: 'Tees' },
  { key: 'hoodies', label: 'Hoodies' },
  { key: 'jackets', label: 'Jackets' },
  { key: 'shorts', label: 'Shorts' },
  { key: 'pants', label: 'Pants' },
];
const regionOf = (cat: string): 'top' | 'bottom' => (BOTTOM_CATS.includes(cat) ? 'bottom' : 'top');

const urlOf = (p?: Product): string | undefined => {
  const img = p?.image as { uri?: string } | undefined;
  return img && typeof img === 'object' && 'uri' in img ? img.uri : undefined;
};

export function FigureBuilderScreen() {
  const insets = useSafeAreaInsets();
  const PRODUCTS = useProducts();

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const clearDraftOutfit = useUserStore((u) => u.clearDraftOutfit);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const saved = useFeedStore((s) => s.saved);
  const showToast = useShareStore((sh) => sh.showToast);

  const [gender, setGender] = useState<Gender>('female');
  const [activeType, setActiveType] = useState<string>('tshirts');
  const [figureImg, setFigureImg] = useState<string | null>(null);
  const [appliedTop, setAppliedTop] = useState<string | null>(null);
  const [appliedBottom, setAppliedBottom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  // Only YOUR saved pieces are pickable for the figure.
  const savedProducts = useMemo(
    () => PRODUCTS.filter((p) => saved.includes(p.id) && urlOf(p)),
    [PRODUCTS, saved],
  );
  const typeItems = savedProducts.filter((p) => p.category === activeType);

  const topProduct = PRODUCTS.find((p) => p.id === draftOutfit.top);
  const bottomProduct = PRODUCTS.find((p) => p.id === draftOutfit.bottom);
  const selected = [topProduct, bottomProduct].filter(Boolean) as Product[];
  const totalPrice = selected.reduce((s, p) => s + p.price.current, 0);
  const currency = selected[0]?.price.currency ?? 'EUR';

  const pendingTop = !!topProduct && draftOutfit.top !== appliedTop;
  const pendingBottom = !!bottomProduct && draftOutfit.bottom !== appliedBottom;
  const hasPending = pendingTop || pendingBottom;

  useEffect(() => {
    setFigureImg(null);
    setAppliedTop(null);
    setAppliedBottom(null);
  }, [gender]);

  const onDress = async () => {
    if (!hasPending) return;
    setLoading(true);
    try {
      let img = figureImg ?? MANNEQUIN[gender];
      let nextTop = appliedTop;
      let nextBottom = appliedBottom;
      if (pendingTop) { img = await dressGarment(img, urlOf(topProduct)!, 'tops'); nextTop = draftOutfit.top!; }
      if (pendingBottom) { img = await dressGarment(img, urlOf(bottomProduct)!, 'bottoms'); nextBottom = draftOutfit.bottom!; }
      setFigureImg(img);
      setAppliedTop(nextTop);
      setAppliedBottom(nextBottom);
    } catch (e: any) {
      showToast('AI: ' + (e?.message || 'error'));
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setFigureImg(null);
    setAppliedTop(null);
    setAppliedBottom(null);
    clearDraftOutfit(); // full fresh start — bare figure, no selected pieces
  };

  const onSave = () => {
    if (!figureImg || !selected.length) return;
    const tagged = selected.map((p) => p.id); // capture before saveOutfit clears the draft
    saveOutfit(undefined, figureImg); // snapshot of the dressed figure (local)
    showToast(`Outfit saved · ${selected.length} ${selected.length === 1 ? 'piece' : 'pieces'}`);
    // Publish (Supabase) so it shows on the profile — fire & forget with toasts.
    const { isAuthenticated, userId } = useUserStore.getState();
    if (isAuthenticated && userId) {
      publishOutfit({ userId, imageUrl: figureImg, taggedProductIds: tagged })
        .then((r) => {
          if (r.error) showToast(`Publishing failed: ${r.error}`);
          else {
            showToast('Your fit is live ✓');
            useOutfitsStore.getState().hydrate();
          }
        });
    }
  };

  const figureSource = useMemo(() => ({ uri: figureImg ?? MANNEQUIN[gender] }), [figureImg, gender]);
  const dressed = !!figureImg;
  const canSave = dressed && !hasPending && selected.length > 0;

  return (
    <View style={styles.root}>
      {/* Full-bleed figure — exactly as the original CREATE (cover, whole screen) */}
      <Image source={figureSource} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Floating header: logo + gender segmented on a dark top gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.35)', 'transparent']}
        style={[styles.topGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBar}>
          <WordmarkOnDark width={104} height={19} />
          <SegmentedControl
            compact
            options={[
              { key: 'female', label: 'Women' },
              { key: 'male', label: 'Men' },
            ]}
            value={gender}
            onChange={(g) => setGender(g as Gender)}
          />
        </View>
      </LinearGradient>

      {loading && <TryOnLoader />}

      {/* Spacer pushes the panel to the bottom over the figure */}
      <View style={{ flex: 1 }} pointerEvents="none" />

      {/* Bottom actions — float over the figure on a dark gradient; the piece
          picker itself opens as a sheet so it never covers the mannequin */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.95)']}
        style={[styles.bottomGrad, { paddingBottom: insets.bottom + BOTTOM_NAV_HEIGHT + 10 }]}
      >
        {canSave ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {selected.length} {selected.length === 1 ? 'PIECE' : 'PIECES'}
              </Text>
              <Text style={styles.summaryTotal}>{formatPrice(totalPrice, currency)}</Text>
            </View>
            <Pressable onPress={onSave} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.primaryText}>SAVE OUTFIT</Text>
            </Pressable>
            <View style={styles.ctaRow}>
              <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.ghostText}>EDIT PIECES</Text>
              </Pressable>
              <Pressable onPress={() => setStoryOpen(true)} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.ghostText}>SHARE</Text>
              </Pressable>
              <Pressable onPress={onReset} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.iconBtnText}>↺</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            onPress={hasPending ? onDress : () => setPickerOpen(true)}
            disabled={loading}
            style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }, loading && styles.primaryDisabled]}
          >
            <Text style={[styles.primaryText, loading && styles.primaryTextDisabled]}>
              {loading ? 'DRESSING…' : hasPending ? 'DRESS THE MANNEQUIN (AI)' : 'PICK YOUR PIECES'}
            </Text>
          </Pressable>
        )}
      </LinearGradient>

      {/* Piece picker sheet — revealed on demand */}
      <Sheet visible={pickerOpen} onClose={() => setPickerOpen(false)}>
        <View style={styles.panelHead}>
          <Text style={styles.panelTitle}>Pick your pieces</Text>
          {selected.length > 0 && (
            <Pressable onPress={clearDraftOutfit} hitSlop={8}>
              <Text style={styles.panelClear}>Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Garment-type chips (with saved counts) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {GARMENT_TYPES.map((t) => {
            const active = activeType === t.key;
            const count = savedProducts.filter((p) => p.category === t.key).length;
            return (
              <Pressable key={t.key} onPress={() => setActiveType(t.key)} style={[styles.typeChip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t.label}
                  {count ? <Text style={active ? styles.chipCountActive : styles.chipCount}>  {count}</Text> : null}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Your saved pieces of the active type */}
        {typeItems.length === 0 ? (
          <Text style={styles.emptyHint}>No saved pieces of this type yet — save some from the feed (🔖).</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
            {typeItems.map((p) => {
              const region = regionOf(p.category);
              const on = draftOutfit[region] === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSlot(region, on ? undefined : p.id)}
                  style={[styles.swatch, on && styles.swatchOn]}
                >
                  <Image source={p.image} style={styles.swatchImg} resizeMode="contain" />
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Pressable
          onPress={() => { setPickerOpen(false); onDress(); }}
          disabled={!hasPending}
          style={({ pressed }) => [
            styles.primaryBtn,
            !hasPending && styles.primaryDisabled,
            pressed && hasPending && { opacity: 0.85 },
          ]}
        >
          <Text style={[styles.primaryText, !hasPending && styles.primaryTextDisabled]}>
            {hasPending ? 'DRESS THE MANNEQUIN (AI)' : dressed ? 'DRESSED ✓' : 'PICK PIECES ABOVE'}
          </Text>
        </Pressable>
      </Sheet>

      <StoryShareSheet
        visible={storyOpen}
        outfit={{ pieceCount: selected.length, totalPrice, currency: '€', heroImage: figureImg ? { uri: figureImg } : undefined }}
        onClose={() => setStoryOpen(false)}
        onCopied={() => showToast('Link copied')}
      />
    </View>
  );
}

// Branded AI loader — spinning volt ring + pulsing label over the stage.
function TryOnLoader() {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0.5);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1);
    pulse.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [spin, pulse]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.5 + pulse.value * 0.5 }));
  return (
    <View style={styles.loaderOverlay} pointerEvents="none">
      <View style={styles.loaderRingWrap}>
        <Animated.View style={[styles.loaderGlow, glowStyle]} />
        <Animated.View style={[styles.loaderRing, ringStyle]} />
      </View>
      <Animated.Text style={[styles.loaderLabel, glowStyle]}>AI IS DRESSING THE MANNEQUIN</Animated.Text>
      <Text style={styles.loaderSub}>~15 seconds</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  topGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 24,
    zIndex: 5,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  bottomGrad: {
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  panelTitle: { fontFamily: FONTS.manropeExtraBold, fontSize: 18, color: WEROL_TOKENS.paper },
  panelClear: { fontFamily: FONTS.manropeBold, fontSize: 14, color: WEROL_TOKENS.lime },

  typeRow: { gap: 10, paddingBottom: 14 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    backgroundColor: WEROL_TOKENS.surface2,
  },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.manropeSemibold, fontSize: 13, color: '#D6D7DB' },
  chipTextActive: { fontFamily: FONTS.manropeBold, color: WEROL_TOKENS.pitch },
  chipCount: { color: WEROL_TOKENS.muted2 },
  chipCountActive: { color: 'rgba(10,11,12,0.6)' },

  strip: { gap: 10, paddingVertical: 2, paddingRight: 8, marginBottom: 16 },
  swatch: {
    width: 66,
    height: 66,
    borderRadius: 14,
    backgroundColor: WEROL_TOKENS.frame,
    padding: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: WEROL_TOKENS.lime },
  swatchImg: { width: '100%', height: '100%' },
  emptyHint: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 13,
    color: WEROL_TOKENS.muted,
    paddingVertical: 20,
    textAlign: 'center',
  },

  summaryRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontFamily: FONTS.manropeBold, fontSize: 11, letterSpacing: 1.8, color: WEROL_TOKENS.muted },
  summaryTotal: { fontFamily: FONTS.manropeExtraBold, fontSize: 22, letterSpacing: -0.5, color: WEROL_TOKENS.paper },

  primaryBtn: {
    alignItems: 'center',
    backgroundColor: WEROL_TOKENS.lime,
    borderRadius: RADII.pill,
    paddingVertical: 16,
  },
  primaryDisabled: { backgroundColor: '#2A2B2E' },
  primaryText: { fontFamily: FONTS.manropeExtraBold, fontSize: 15, letterSpacing: 0.5, color: WEROL_TOKENS.pitch },
  primaryTextDisabled: { color: '#5A5B60' },
  ctaRow: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 10 },
  ghostBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  ghostText: { fontFamily: FONTS.manropeBold, fontSize: 12, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: { fontFamily: FONTS.manropeBold, fontSize: 20, color: WEROL_TOKENS.paper },

  // branded loader
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    // light scrim — the mannequin stays visible while the AI dresses it
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  loaderRingWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  loaderGlow: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: WEROL_TOKENS.lime, opacity: 0.25 },
  loaderRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: WEROL_TOKENS.lime,
  },
  loaderLabel: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 13,
    letterSpacing: 1,
    color: WEROL_TOKENS.paper,
    marginTop: 18,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  loaderSub: { fontFamily: FONTS.manropeBold, fontSize: 11, letterSpacing: 1.5, color: WEROL_TOKENS.lime, marginTop: 6 },
});
