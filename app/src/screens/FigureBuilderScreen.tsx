// FigureBuilderScreen (CREATE) — AI try-on studio. Pick real products; FASHN
// dresses a plain white mannequin (male/female) with the actual product photos
// (no cutouts needed). The dressed figure auto-rotates; results are cached.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { formatPrice } from '../lib/format';
import { MANNEQUIN, tryOnOutfit, type Gender } from '../lib/tryon';
import { useProducts } from '../store/productsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import type { Product } from '../types';

const MANNEQUIN_IMG: Record<Gender, any> = {
  female: require('../assets/mannequins/female.png'),
  male: require('../assets/mannequins/male.png'),
};

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
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const tops = useMemo(
    () => PRODUCTS.filter((p) => TOP_CATS.includes(p.category) && urlOf(p)).slice(0, 40),
    [PRODUCTS],
  );
  const bottoms = useMemo(
    () => PRODUCTS.filter((p) => BOTTOM_CATS.includes(p.category) && urlOf(p)).slice(0, 40),
    [PRODUCTS],
  );

  const topProduct = PRODUCTS.find((p) => p.id === draftOutfit.top);
  const bottomProduct = PRODUCTS.find((p) => p.id === draftOutfit.bottom);
  const selected = [topProduct, bottomProduct].filter(Boolean) as Product[];
  const totalPrice = selected.reduce((s, p) => s + p.price.current, 0);
  const currency = selected[0]?.price.currency ?? 'EUR';

  // changing the figure or pieces invalidates the rendered try-on
  useEffect(() => setResult(null), [gender, draftOutfit.top, draftOutfit.bottom]);

  // continuous gentle auto-rotation (native driver = smooth)
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    spin.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [spin, result, gender]);
  const rotateY = spin.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '22deg', '0deg', '-22deg', '0deg'],
  });

  const onDress = async () => {
    const topUrl = urlOf(topProduct);
    const bottomUrl = urlOf(bottomProduct);
    if (!topUrl && !bottomUrl) {
      showToast('Vyber aspoň jeden kúsok');
      return;
    }
    setLoading(true);
    try {
      const url = await tryOnOutfit({ gender, topUrl, bottomUrl });
      setResult(url);
    } catch (e: any) {
      showToast('AI: ' + (e?.message || 'chyba'));
    } finally {
      setLoading(false);
    }
  };

  const onSave = () => {
    if (!selected.length) return;
    saveOutfit();
    showToast(`FIT uložený · ${selected.length} kúskov`);
  };

  const figureSource = result ? { uri: result } : MANNEQUIN_IMG[gender];
  const slotItems = activeSlot === 'top' ? tops : bottoms;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Top bar: WEROL wordmark + gender toggle */}
      <View style={styles.topBar}>
        <WordmarkOnDark width={104} height={19} />
        <View style={styles.toggle}>
          {(['female', 'male'] as Gender[]).map((g) => (
            <Pressable key={g} onPress={() => setGender(g)} style={[styles.toggleBtn, gender === g && styles.toggleBtnOn]}>
              <Text style={[styles.toggleText, gender === g && styles.toggleTextOn]}>
                {g === 'female' ? 'Žena' : 'Muž'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Figure stage */}
      <View style={styles.stage}>
        <Animated.View style={[styles.figureWrap, { transform: [{ perspective: 900 }, { rotateY }] }]}>
          <Image source={figureSource} style={styles.figure} resizeMode="contain" />
        </Animated.View>
        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator color={WEROL_TOKENS.lime} size="large" />
            <Text style={styles.loaderText}>AI oblieka figurínu…</Text>
            <Text style={styles.loaderSub}>~15 sekúnd</Text>
          </View>
        )}
        {!result && !loading && <Text style={styles.stageHint}>Vyber kúsky a ťukni „Obleč figurínu"</Text>}
      </View>

      {/* Slot chips */}
      <View style={styles.chips}>
        {(['top', 'bottom'] as const).map((s) => {
          const p = s === 'top' ? topProduct : bottomProduct;
          const active = activeSlot === s;
          return (
            <Pressable key={s} onPress={() => setActiveSlot(s)} style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s === 'top' ? 'Vrch' : 'Spodok'}</Text>
              {p && (
                <Text style={[styles.chipPrice, active && styles.chipTextActive]} numberOfLines={1}>
                  {formatPrice(p.price.current, p.price.currency)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Product picker strip */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        {slotItems.map((p) => {
          const on = draftOutfit[activeSlot] === p.id;
          return (
            <Pressable key={p.id} onPress={() => setSlot(activeSlot, p.id)} style={[styles.swatch, on && styles.swatchOn]}>
              <Image source={p.image} style={styles.swatchImg} resizeMode="contain" />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Dress + actions */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) + 78 }]}>
        <Pressable
          onPress={onDress}
          disabled={loading || !selected.length}
          style={({ pressed }) => [styles.dressBtn, (loading || !selected.length) && { opacity: 0.4 }, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.dressText}>{loading ? 'AI GENERUJE…' : 'OBLEČ FIGURÍNU (AI)'}</Text>
        </Pressable>
        <View style={styles.actions}>
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>{selected.length} KÚSKY</Text>
            <Text style={styles.totalValue}>{formatPrice(totalPrice, currency)}</Text>
          </View>
          <Pressable onPress={onSave} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.saveText}>SAVE</Text>
          </Pressable>
          <Pressable
            onPress={() => result && setStoryOpen(true)}
            disabled={!result}
            style={({ pressed }) => [styles.shareBtn, !result && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.shareText}>SHARE</Text>
          </Pressable>
        </View>
      </View>

      <StoryShareSheet
        visible={storyOpen}
        outfit={{ pieceCount: selected.length, totalPrice, currency: '€', heroImage: result ? { uri: result } : undefined }}
        onClose={() => setStoryOpen(false)}
        onCopied={() => showToast('Link copied')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch, paddingHorizontal: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 36 },
  toggle: { flexDirection: 'row', backgroundColor: WEROL_TOKENS.concrete, borderRadius: 9999, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  toggleBtnOn: { backgroundColor: WEROL_TOKENS.lime },
  toggleText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 11, color: WEROL_TOKENS.muted },
  toggleTextOn: { color: WEROL_TOKENS.pitch },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  figureWrap: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' },
  figure: { width: '100%', height: '100%' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,12,0.55)', gap: 8 },
  loaderText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 15, color: WEROL_TOKENS.paper },
  loaderSub: { fontFamily: FONTS.inter, fontSize: 12, color: WEROL_TOKENS.muted },
  stageHint: { position: 'absolute', bottom: 8, fontFamily: FONTS.inter, fontSize: 12, color: WEROL_TOKENS.muted2 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: WEROL_TOKENS.concrete },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 12, color: WEROL_TOKENS.paper },
  chipTextActive: { color: WEROL_TOKENS.pitch },
  chipPrice: { fontFamily: FONTS.inter, fontSize: 10, color: WEROL_TOKENS.muted, marginTop: 2 },
  strip: { gap: 8, paddingVertical: 2, paddingRight: 8, marginBottom: 10 },
  swatch: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F3F5', padding: 5, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: WEROL_TOKENS.lime },
  swatchImg: { width: '100%', height: '100%' },
  bottom: { paddingTop: 4 },
  dressBtn: { alignItems: 'center', backgroundColor: WEROL_TOKENS.lime, borderRadius: 12, paddingVertical: 15, marginBottom: 10 },
  dressText: { fontFamily: FONTS.archivoBold, fontSize: 14, letterSpacing: 0.5, color: WEROL_TOKENS.pitch },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  totalWrap: { flex: 1 },
  totalLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 9, letterSpacing: 1.5, color: WEROL_TOKENS.muted },
  totalValue: { fontFamily: FONTS.archivo, fontSize: 22, letterSpacing: -0.6, color: WEROL_TOKENS.paper },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: WEROL_TOKENS.line2 },
  saveText: { fontFamily: FONTS.archivoBold, fontSize: 12, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
  shareBtn: { paddingHorizontal: 18, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: WEROL_TOKENS.line2 },
  shareText: { fontFamily: FONTS.archivoBold, fontSize: 12, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
});
