// FigureBuilderScreen (CREATE) — dress-up figure. Garments are real cutouts
// lifted off the model with AI cloth-segmentation (see scripts/gen-cutout-
// capsule.py); they're layered over a neutral silhouette so it reads as a
// dressed figure you can spin. Pick a piece per slot, save the fit or share it.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FigureSilhouette } from '../components/FigureSilhouette';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { CUTOUT_CAPSULE, type CutoutSlot } from '../data/cutoutCapsule';
import { formatPrice } from '../lib/format';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

const SLOTS: { key: CutoutSlot; label: string }[] = [
  { key: 'top', label: 'Vrch' },
  { key: 'bottom', label: 'Spodok' },
  { key: 'feet', label: 'Obuv' },
];

// where each garment sits on the figure box (fractions of figure w/h)
const PLACEMENT: Record<CutoutSlot, { left: number; width: number; top: number; height: number }> = {
  top: { left: 0.02, width: 0.96, top: 0.12, height: 0.42 },
  bottom: { left: 0.13, width: 0.74, top: 0.44, height: 0.44 },
  feet: { left: 0.2, width: 0.6, top: 0.85, height: 0.15 },
};

export function FigureBuilderScreen() {
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const showToast = useShareStore((sh) => sh.showToast);

  const [activeSlot, setActiveSlot] = useState<CutoutSlot | null>('top');
  const [storyOpen, setStoryOpen] = useState(false);

  // dress the figure with capsule pieces on first open (only capsule pieces
  // have cutouts, so anything else can't be rendered on the figure)
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

  // figure geometry
  const figH = Math.min(winH * 0.46, 460);
  const figW = figH * (120 / 280);

  // drag-to-rotate (stylised 2.5D turn — cutouts are front-only)
  const rotate = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => rotate.setValue(Math.max(-26, Math.min(26, g.dx * 0.35))),
      onPanResponderRelease: () =>
        Animated.spring(rotate, { toValue: 0, useNativeDriver: true, friction: 6, tension: 60 }).start(),
    }),
  ).current;
  const rotateY = rotate.interpolate({ inputRange: [-26, 26], outputRange: ['-26deg', '26deg'] });

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
        <View style={styles.aiTag}>
          <Text style={styles.aiTagText}>AI VÝREZY</Text>
        </View>
      </View>

      {/* Figure stage */}
      <View style={styles.stage}>
        <Animated.View
          {...pan.panHandlers}
          style={[
            styles.figure,
            { width: figW, height: figH, transform: [{ perspective: 900 }, { rotateY }] },
          ]}
        >
          <View style={StyleSheet.absoluteFill}>
            <FigureSilhouette width={figW} height={figH} />
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

      <Text style={styles.hint}>Potiahni pre rotáciu · ťukni na časť na výmenu</Text>

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
              {piece && <Text style={[styles.chipPrice, active && styles.chipTextActive]}>{formatPrice(piece.price, piece.currency)}</Text>}
            </Pressable>
          );
        })}
      </View>

      {/* Piece picker strip */}
      {activeSlot && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.strip}
        >
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
          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.saveText}>SAVE FIT</Text>
          </Pressable>
          <Pressable
            onPress={() => setStoryOpen(true)}
            style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
          >
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
  eyebrow: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.lime,
    marginBottom: 4,
  },
  title: { fontFamily: FONTS.spaceGroteskBold, fontSize: 24, letterSpacing: -0.4, color: WEROL_TOKENS.paper },
  aiTag: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  aiTagText: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 9, letterSpacing: 1.5, color: WEROL_TOKENS.muted },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  figure: { alignItems: 'center', justifyContent: 'center' },
  garment: { width: '100%', height: '100%' },
  hint: {
    fontFamily: FONTS.inter,
    fontSize: 11,
    color: WEROL_TOKENS.muted2,
    textAlign: 'center',
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: WEROL_TOKENS.concrete,
  },
  chipActive: { backgroundColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.spaceGroteskBold, fontSize: 12, color: WEROL_TOKENS.paper },
  chipTextActive: { color: WEROL_TOKENS.pitch },
  chipPrice: { fontFamily: FONTS.inter, fontSize: 10, color: WEROL_TOKENS.muted, marginTop: 2 },
  strip: { gap: 8, paddingVertical: 2, paddingRight: 8 },
  swatch: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#F3F3F5',
    padding: 5,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchOn: { borderColor: WEROL_TOKENS.lime },
  swatchImg: { width: '100%', height: '100%' },
  bottom: { paddingTop: 14 },
  summary: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 10, letterSpacing: 1.5, color: WEROL_TOKENS.muted },
  summaryTotal: { fontFamily: FONTS.archivo, fontSize: 26, letterSpacing: -1, color: WEROL_TOKENS.paper },
  actions: { flexDirection: 'row', gap: 8 },
  saveBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: WEROL_TOKENS.lime,
    borderRadius: 12,
    paddingVertical: 15,
  },
  saveText: { fontFamily: FONTS.archivoBold, fontSize: 13, letterSpacing: 0.5, color: WEROL_TOKENS.pitch },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  shareText: { fontFamily: FONTS.archivoBold, fontSize: 13, letterSpacing: 0.5, color: WEROL_TOKENS.paper },
});
