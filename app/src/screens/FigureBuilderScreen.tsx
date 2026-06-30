// FigureBuilderScreen (CREATE) — AI try-on studio. The figure is shown full and
// uncluttered (drag to tilt it). Tap "Vytvoriť outfit" → a sheet to pick pieces →
// "Obleč figurínu" → FASHN dresses a white mannequin with the real product photos
// → the whole dressed figure shows → "Uložiť outfit" stores that snapshot.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { formatPrice } from '../lib/format';
import { dressGarment, MANNEQUIN, type Gender } from '../lib/tryon';
import { useProducts } from '../store/productsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

const BOTTOM_NAV_HEIGHT = 78;
const TOP_CATS = ['tshirts', 'hoodies', 'jackets'];
const BOTTOM_CATS = ['pants', 'shorts'];

const urlOf = (p?: Product): string | undefined => {
  const img = p?.image as { uri?: string } | undefined;
  return img && typeof img === 'object' && 'uri' in img ? img.uri : undefined;
};

export function FigureBuilderScreen() {
  const insets = useSafeAreaInsets();
  const PRODUCTS = useProducts();

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const showToast = useShareStore((sh) => sh.showToast);

  const [gender, setGender] = useState<Gender>('female');
  const [activeSlot, setActiveSlot] = useState<'top' | 'bottom'>('top');
  const [figureImg, setFigureImg] = useState<string | null>(null);
  const [appliedTop, setAppliedTop] = useState<string | null>(null);
  const [appliedBottom, setAppliedBottom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const tops = useMemo(() => PRODUCTS.filter((p) => TOP_CATS.includes(p.category) && urlOf(p)).slice(0, 40), [PRODUCTS]);
  const bottoms = useMemo(() => PRODUCTS.filter((p) => BOTTOM_CATS.includes(p.category) && urlOf(p)).slice(0, 40), [PRODUCTS]);

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

  // drag-to-tilt (UI thread → smooth)
  const rot = useSharedValue(0);
  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          'worklet';
          const v = e.translationX * 0.16;
          rot.value = v < -26 ? -26 : v > 26 ? 26 : v;
        })
        .onEnd(() => {
          'worklet';
          rot.value = withSpring(0, { damping: 14, stiffness: 120 });
        }),
    [rot],
  );
  const figureAnim = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${rot.value}deg` }, { scale: 1.05 }],
  }));

  const onDress = async () => {
    if (!hasPending) return;
    setPickerOpen(false);
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
      showToast('AI: ' + (e?.message || 'chyba'));
    } finally {
      setLoading(false);
    }
  };

  const onReset = () => {
    setFigureImg(null);
    setAppliedTop(null);
    setAppliedBottom(null);
  };

  const onSave = () => {
    if (!figureImg || !selected.length) return;
    saveOutfit(undefined, figureImg); // snapshot of the dressed figure
    showToast(`Outfit uložený · ${selected.length} kúskov`);
  };

  const figureSource = useMemo(() => ({ uri: figureImg ?? MANNEQUIN[gender] }), [figureImg, gender]);
  const dressed = !!figureImg;

  return (
    <View style={styles.root}>
      {/* Full-bleed figure — drag to tilt. The transform is on the wrapper View
          (not the Image) + backfaceVisibility hidden, so it doesn't flicker. */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.figureWrap, figureAnim]}>
          <Image source={figureSource} style={StyleSheet.absoluteFill} resizeMode="cover" />
        </Animated.View>
      </GestureDetector>

      {/* Top gradient + WEROL bar + gender toggle */}
      <LinearGradient
        colors={['rgba(10,10,12,0.92)', 'rgba(10,10,12,0.35)', 'transparent']}
        style={[styles.topGrad, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.topBar}>
          <WordmarkOnDark width={104} height={19} />
          <View style={styles.toggle}>
            {(['female', 'male'] as Gender[]).map((g) => (
              <Pressable key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, gender === g && styles.toggleBtnOn]}>
                <Text style={[styles.toggleText, gender === g && styles.toggleTextOn]}>{g === 'female' ? 'Žena' : 'Muž'}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </LinearGradient>

      {/* Branded AI loader */}
      {loading && <TryOnLoader />}

      {/* Bottom: single CTA (clean) */}
      <LinearGradient
        colors={['transparent', 'rgba(10,10,12,0.6)', 'rgba(10,10,12,0.96)']}
        style={[styles.bottomGrad, { paddingBottom: insets.bottom + BOTTOM_NAV_HEIGHT + 8 }]}
      >
        {dressed ? (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selected.length} KÚSKY</Text>
              <Text style={styles.summaryTotal}>{formatPrice(totalPrice, currency)}</Text>
            </View>
            <Pressable onPress={onSave} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.primaryText}>ULOŽIŤ OUTFIT</Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.secondaryText}>UPRAVIŤ</Text>
              </Pressable>
              <Pressable onPress={() => setStoryOpen(true)} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.secondaryText}>ZDIEĽAŤ</Text>
              </Pressable>
              <Pressable onPress={onReset} style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.7 }]}>
                <Text style={styles.resetText}>↺</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable onPress={() => setPickerOpen(true)} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.primaryText}>VYTVORIŤ OUTFIT</Text>
          </Pressable>
        )}
      </LinearGradient>

      {/* Piece picker sheet */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setPickerOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Vyber kúsky</Text>

          {(['top', 'bottom'] as const).map((slot) => {
            const items = slot === 'top' ? tops : bottoms;
            return (
              <View key={slot} style={{ display: activeSlot === slot ? 'flex' : 'none' }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
                  {items.map((p) => {
                    const on = draftOutfit[slot] === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => setSlot(slot, on ? undefined : p.id)}
                        style={[styles.swatch, on && styles.swatchOn]}
                      >
                        <Image source={p.image} style={styles.swatchImg} resizeMode="contain" />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}

          <View style={styles.chips}>
            {(['top', 'bottom'] as const).map((s) => {
              const p = s === 'top' ? topProduct : bottomProduct;
              const active = activeSlot === s;
              return (
                <Pressable key={s} onPress={() => setActiveSlot(s)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s === 'top' ? 'Vrch' : 'Spodok'}</Text>
                  {p && <Text style={[styles.chipPrice, active && styles.chipTextActive]} numberOfLines={1}>{formatPrice(p.price.current, p.price.currency)}</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={onDress}
            disabled={!hasPending}
            style={({ pressed }) => [styles.primaryBtn, !hasPending && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.primaryText}>{hasPending ? 'OBLEČ FIGURÍNU (AI)' : 'OBLEČENÉ ✓'}</Text>
          </Pressable>
        </View>
      </Modal>

      <StoryShareSheet
        visible={storyOpen}
        outfit={{ pieceCount: selected.length, totalPrice, currency: '€', heroImage: figureImg ? { uri: figureImg } : undefined }}
        onClose={() => setStoryOpen(false)}
        onCopied={() => showToast('Link copied')}
      />
    </View>
  );
}

// Branded AI loader — spinning lime ring + pulsing label, on a dark blur.
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
      <Animated.Text style={[styles.loaderLabel, glowStyle]}>AI OBLIEKA FIGURÍNU</Animated.Text>
      <Text style={styles.loaderSub}>~15 sekúnd</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  figureWrap: { backfaceVisibility: 'hidden', overflow: 'hidden' },
  topGrad: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 20, paddingBottom: 24, zIndex: 5 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(22,22,26,0.85)', borderRadius: 9999, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  toggleBtnOn: { backgroundColor: WEROL_TOKENS.lime },
  toggleText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 11, color: WEROL_TOKENS.paper },
  toggleTextOn: { color: WEROL_TOKENS.pitch },

  bottomGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 60 },
  summaryRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 10, letterSpacing: 1.5, color: WEROL_TOKENS.muted },
  summaryTotal: { fontFamily: FONTS.archivo, fontSize: 22, letterSpacing: -0.6, color: WEROL_TOKENS.paper },
  primaryBtn: { alignItems: 'center', backgroundColor: WEROL_TOKENS.lime, borderRadius: 14, paddingVertical: 16 },
  primaryText: { fontFamily: FONTS.archivoBold, fontSize: 14, letterSpacing: 0.5, color: WEROL_TOKENS.pitch },
  secondaryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  secondaryBtn: { flex: 1, alignItems: 'center', paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  secondaryText: { fontFamily: FONTS.archivoBold, fontSize: 12, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
  resetBtn: { width: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  resetText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 18, color: WEROL_TOKENS.paper },

  // sheet
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(10,10,12,0.6)' },
  sheet: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  sheetHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: WEROL_TOKENS.line2, marginBottom: 12 },
  sheetTitle: { fontFamily: FONTS.spaceGroteskBold, fontSize: 18, color: WEROL_TOKENS.paper, marginBottom: 12 },
  strip: { gap: 8, paddingVertical: 2, paddingRight: 8, marginBottom: 10 },
  swatch: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F3F5', padding: 5, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: WEROL_TOKENS.lime },
  swatchImg: { width: '100%', height: '100%' },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: WEROL_TOKENS.pitch },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 12, color: WEROL_TOKENS.paper },
  chipTextActive: { color: WEROL_TOKENS.pitch },
  chipPrice: { fontFamily: FONTS.inter, fontSize: 10, color: WEROL_TOKENS.muted, marginTop: 2 },

  // branded loader
  loaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,12,0.7)', zIndex: 8 },
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
  loaderLabel: { fontFamily: FONTS.spaceGroteskBold, fontSize: 14, letterSpacing: 1, color: WEROL_TOKENS.paper, marginTop: 18 },
  loaderSub: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 10, letterSpacing: 1.5, color: WEROL_TOKENS.lime, marginTop: 6 },
});
