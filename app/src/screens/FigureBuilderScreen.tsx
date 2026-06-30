// FigureBuilderScreen (CREATE) — dress-up figure. Garments are real cutouts
// lifted off the model with AI cloth-segmentation (see scripts/gen-cutout-
// capsule.py); they're layered over a neutral male/female silhouette so it reads
// as a dressed figure. The figure auto-rotates (gentle 2.5D sway, native driver
// so it stays smooth) and the spin resets whenever you swap a piece.

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FigureSilhouette, type FigureVariant } from '../components/FigureSilhouette';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { CUTOUT_CAPSULE, type CutoutSlot } from '../data/cutoutCapsule';
import { formatPrice } from '../lib/format';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';

const SLOTS: { key: CutoutSlot; label: string }[] = [
  { key: 'top', label: 'Vrch' },
  { key: 'bottom', label: 'Spodok' },
  { key: 'feet', label: 'Obuv' },
];

// where each garment sits on the figure box (fractions of figure w/h)
const PLACEMENT: Record<CutoutSlot, { left: number; width: number; top: number; height: number }> = {
  top: { left: 0.0, width: 1.0, top: 0.11, height: 0.43 },
  bottom: { left: 0.12, width: 0.76, top: 0.45, height: 0.44 },
  feet: { left: 0.18, width: 0.64, top: 0.86, height: 0.14 },
};

export function FigureBuilderScreen() {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const showToast = useShareStore((sh) => sh.showToast);

  const [activeSlot, setActiveSlot] = useState<CutoutSlot | null>('top');
  const [variant, setVariant] = useState<FigureVariant>('female');
  const [storyOpen, setStoryOpen] = useState(false);

  // dress the figure with capsule pieces on first open
  useEffect(() => {
    (['top', 'bottom', 'feet'] as CutoutSlot[]).forEach((slot) => {
      const cur = draftOutfit[slot];
      const inCapsule = CUTOUT_CAPSULE[slot].some((p) => p.id === cur);
      if (!inCapsule && CUTOUT_CAPSULE[slot][0]) setSlot(slot, CUTOUT_CAPSULE[slot][0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pieceFor = (slot: CutoutSlot) =>
    CUTOUT_CAPSULE[slot].find((p) => p.id === draftOutfit[slot]);

  const selected = (['top', 'bottom', 'feet'] as CutoutSlot[]).map(pieceFor).filter(Boolean);
  const pieceCount = selected.length;
  const totalPrice = selected.reduce((s, p) => s + (p?.price ?? 0), 0);
  const currency = selected[0]?.currency ?? 'EUR';

  // figure fills the whole stage (the flex area between header and controls)
  const [stageH, setStageH] = useState(0);
  const figH = stageH > 0 ? Math.min(stageH, (winW - 16) / (120 / 285)) : winH * 0.5;
  const figW = figH * (120 / 285);

  // continuous auto-rotation (gentle sway). Native driver = smooth, no stutter.
  // Resets and restarts whenever the outfit or figure changes.
  const spin = useRef(new Animated.Value(0)).current;
  const selKey = `${draftOutfit.top}|${draftOutfit.bottom}|${draftOutfit.feet}|${variant}`;
  useEffect(() => {
    spin.stopAnimation();
    spin.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [selKey, spin]);
  const rotateY = spin.interpolate({
    inputRange: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1],
    outputRange: ['0deg', '17deg', '24deg', '17deg', '0deg', '-17deg', '-24deg', '-17deg', '0deg'],
  });

  const handleSave = () => {
    if (!pieceCount) return;
    saveOutfit();
    showToast(`FIT uložený · ${pieceCount} kúskov`);
  };
  const heroImage = pieceFor('top')?.cutout ?? pieceFor('bottom')?.cutout;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>CREATE</Text>
          <Text style={styles.title}>Obleč si figurínu</Text>
        </View>
        <View style={styles.toggle}>
          {(['female', 'male'] as FigureVariant[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => setVariant(v)}
              style={[styles.toggleBtn, variant === v && styles.toggleBtnOn]}
            >
              <Text style={[styles.toggleText, variant === v && styles.toggleTextOn]}>
                {v === 'female' ? 'Žena' : 'Muž'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Figure stage */}
      <View style={styles.stage} onLayout={(e) => setStageH(e.nativeEvent.layout.height)}>
        <Animated.View
          style={[
            styles.figure,
            { width: figW, height: figH, transform: [{ perspective: 900 }, { rotateY }] },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <FigureSilhouette width={figW} height={figH} variant={variant} />
          </View>
          {(['feet', 'bottom', 'top'] as CutoutSlot[]).map((slot) => {
            const piece = pieceFor(slot);
            if (!piece) return null;
            const pl = PLACEMENT[slot];
            return (
              <Pressable
                key={slot}
                onPress={() => setActiveSlot(slot)}
                style={{
                  position: 'absolute',
                  left: figW * pl.left,
                  width: figW * pl.width,
                  top: figH * pl.top,
                  height: figH * pl.height,
                }}
              >
                <Image source={piece.cutout} style={styles.garment} resizeMode="contain" />
              </Pressable>
            );
          })}
        </Animated.View>
      </View>

      <Text style={styles.hint}>Otáča sa automaticky · ťukni na časť na výmenu</Text>

      {/* Slot chips */}
      <View style={styles.chips}>
        {SLOTS.map((s) => {
          const active = activeSlot === s.key;
          const piece = pieceFor(s.key);
          return (
            <Pressable
              key={s.key}
              onPress={() => setActiveSlot(active ? null : s.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
              {piece && (
                <Text style={[styles.chipPrice, active && styles.chipTextActive]}>
                  {formatPrice(piece.price, piece.currency)}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Piece picker strip */}
      {activeSlot && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {CUTOUT_CAPSULE[activeSlot].map((p) => {
            const on = draftOutfit[activeSlot] === p.id;
            return (
              <Pressable
                key={p.id}
                onPress={() => setSlot(activeSlot, p.id)}
                style={[styles.swatch, on && styles.swatchOn]}
              >
                <Image source={p.cutout} style={styles.swatchImg} resizeMode="contain" />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 12) + 78 }]}>
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>{pieceCount} KÚSKY</Text>
          <Text style={styles.summaryTotal}>{formatPrice(totalPrice, currency)}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}>
            <Text style={styles.saveText}>SAVE FIT</Text>
          </Pressable>
          <Pressable onPress={() => setStoryOpen(true)} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}>
            <Text style={styles.shareText}>SHARE</Text>
          </Pressable>
        </View>
      </View>

      <StoryShareSheet
        visible={storyOpen}
        outfit={{ pieceCount, totalPrice, currency: '€', heroImage }}
        onClose={() => setStoryOpen(false)}
        onCopied={() => showToast('Link copied')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 10, letterSpacing: 2, color: WEROL_TOKENS.lime, marginBottom: 4 },
  title: { fontFamily: FONTS.spaceGroteskBold, fontSize: 24, letterSpacing: -0.4, color: WEROL_TOKENS.paper },
  toggle: { flexDirection: 'row', backgroundColor: WEROL_TOKENS.concrete, borderRadius: 9999, padding: 3 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999 },
  toggleBtnOn: { backgroundColor: WEROL_TOKENS.lime },
  toggleText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 11, color: WEROL_TOKENS.muted },
  toggleTextOn: { color: WEROL_TOKENS.pitch },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  figure: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  garment: { width: '100%', height: '100%' },
  hint: { fontFamily: FONTS.inter, fontSize: 11, color: WEROL_TOKENS.muted2, textAlign: 'center', marginBottom: 12 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: WEROL_TOKENS.concrete },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 12, color: WEROL_TOKENS.paper },
  chipTextActive: { color: WEROL_TOKENS.pitch },
  chipPrice: { fontFamily: FONTS.inter, fontSize: 10, color: WEROL_TOKENS.muted, marginTop: 2 },
  strip: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  swatch: { width: 64, height: 64, borderRadius: 12, backgroundColor: '#F3F3F5', padding: 5, borderWidth: 2, borderColor: 'transparent' },
  swatchOn: { borderColor: WEROL_TOKENS.lime },
  swatchImg: { width: '100%', height: '100%' },
  bottom: { paddingTop: 14 },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 10, letterSpacing: 1.5, color: WEROL_TOKENS.muted },
  summaryTotal: { fontFamily: FONTS.archivo, fontSize: 26, letterSpacing: -1, color: WEROL_TOKENS.paper },
  actions: { flexDirection: 'row', gap: 8 },
  saveBtn: { flex: 1, alignItems: 'center', backgroundColor: WEROL_TOKENS.lime, borderRadius: 12, paddingVertical: 15 },
  saveText: { fontFamily: FONTS.archivoBold, fontSize: 13, letterSpacing: 0.5, color: WEROL_TOKENS.pitch },
  shareBtn: { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 15, borderWidth: 1, borderColor: WEROL_TOKENS.line2 },
  shareText: { fontFamily: FONTS.archivoBold, fontSize: 13, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
});
