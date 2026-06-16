// ============================================================================
// PROTOTYPE — THROWAWAY CODE, DO NOT SHIP
//
// Question: what shape should the gamified outfit builder take?
// Three variants on the existing Fit tab, cycled via the floating dev bar:
//   A — pseudo-3D avatar: drag to rotate (perspective rotateY), slot chips
//   B — character-select dress-up: arrows cycle pieces directly on a doll
//   C — flat-lay collage: editorial grid, no avatar at all
// Plus the original screen for comparison. Dev-only; production renders
// the original untouched. Delete this file once a direction wins.
// ============================================================================

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OUTFIT_SLOTS, SLOT_BY_ID } from '../data/outfitSlots';
import { useProducts } from '../store/productsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { FONTS } from '../theme/typography';
import { useColors } from '../theme/useColors';
import type { OutfitSlotId, Product } from '../types';
import { SlotPickerSheet } from './OutfitBuilderScreen';

type VariantKey = 'A' | 'B' | 'C' | 'original';

const VARIANTS: { key: VariantKey; name: string }[] = [
  { key: 'A', name: 'A — 3D rotácia' },
  { key: 'B', name: 'B — Šatník (dress-up)' },
  { key: 'C', name: 'C — Flat-lay koláž' },
  { key: 'original', name: 'Pôvodný builder' },
];

export function OutfitBuilderPrototype({
  Original,
}: {
  Original: React.ComponentType;
}) {
  const [idx, setIdx] = useState(0);
  if (!__DEV__) return <Original />;

  const variant = VARIANTS[idx].key;
  const cycle = (dir: 1 | -1) =>
    setIdx((i) => (i + dir + VARIANTS.length) % VARIANTS.length);

  return (
    <View style={{ flex: 1 }}>
      {variant === 'A' && <VariantA />}
      {variant === 'B' && <VariantB />}
      {variant === 'C' && <VariantC />}
      {variant === 'original' && <Original />}
      <SwitcherBar
        label={VARIANTS[idx].name}
        onPrev={() => cycle(-1)}
        onNext={() => cycle(1)}
      />
    </View>
  );
}

// ---------------------------------------------------------------- shared ---

function useDraft() {
  const PRODUCTS = useProducts();
  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const showToast = useShareStore((sh) => sh.showToast);

  const productFor = (slotId: OutfitSlotId): Product | undefined => {
    const pid = draftOutfit[slotId];
    return pid ? PRODUCTS.find((p) => p.id === pid) : undefined;
  };

  const pieceCount = Object.values(draftOutfit).filter(Boolean).length;
  const totalPrice = Object.values(draftOutfit).reduce((sum, pid) => {
    const p = PRODUCTS.find((x) => x.id === pid);
    return sum + (p?.price.current ?? 0);
  }, 0);

  const save = () => {
    if (pieceCount === 0) return;
    saveOutfit();
    showToast(`FIT uložený · ${pieceCount} kúskov`);
  };

  return { PRODUCTS, draftOutfit, setSlot, productFor, pieceCount, totalPrice, save };
}

function Eyebrow({ children, color }: { children: string; color: string }) {
  return (
    <Text
      style={{
        fontFamily: FONTS.jetbrainsMonoBold,
        fontSize: 9,
        letterSpacing: 2,
        color,
        marginBottom: 4,
      }}
    >
      {children}
    </Text>
  );
}

function SaveBar({
  C,
  pieceCount,
  totalPrice,
  onSave,
}: {
  C: ReturnType<typeof useColors>;
  pieceCount: number;
  totalPrice: number;
  onSave: () => void;
}) {
  return (
    <View style={sh.saveBar}>
      <View>
        <Text style={[sh.saveBarLabel, { color: C.cream3 }]}>
          {pieceCount} / 5 KÚSKOV
        </Text>
        <Text style={[sh.saveBarTotal, { color: C.cream }]}>{totalPrice} €</Text>
      </View>
      <Pressable
        onPress={onSave}
        disabled={pieceCount === 0}
        style={[
          sh.saveBtn,
          { backgroundColor: C.teal },
          pieceCount === 0 && { opacity: 0.4 },
        ]}
      >
        <Ionicons name="bookmark" size={15} color={C.ink} />
        <Text style={[sh.saveBtnText, { color: C.ink }]}>SAVE FIT</Text>
      </Pressable>
    </View>
  );
}

// ------------------------------------------------- A · pseudo-3D rotácia ---

// Garment overlay geometry per slot: vertical position + width, in % of stage.
const A_LAYERS: Record<OutfitSlotId, { top: number; width: number; z: number }> = {
  head: { top: 1, width: 26, z: 5 },
  top: { top: 20, width: 58, z: 3 },
  mid: { top: 24, width: 70, z: 4 },
  bottom: { top: 46, width: 46, z: 2 },
  feet: { top: 80, width: 42, z: 1 },
};

function VariantA() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const { productFor, pieceCount, totalPrice, save, setSlot } = useDraft();
  const [pickerSlot, setPickerSlot] = useState<OutfitSlotId | null>(null);

  const stageW = Math.min(winWidth - 80, 280);
  const stageH = stageW * 1.45;

  const angle = useSharedValue(0);
  const startAngle = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart(() => {
      startAngle.value = angle.value;
    })
    .onUpdate((e) => {
      angle.value = startAngle.value + e.translationX * 0.7;
    })
    .onEnd(() => {
      // snap to nearest front/back face
      const snapped = Math.round(angle.value / 180) * 180;
      angle.value = withSpring(snapped, { damping: 16, stiffness: 140 });
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 900 }, { rotateY: `${angle.value}deg` }],
  }));

  const backOverlayStyle = useAnimatedStyle(() => {
    const a = ((angle.value % 360) + 360) % 360;
    const showingBack = a > 90 && a < 270;
    return { opacity: showingBack ? 1 : 0 };
  });

  return (
    <View style={[styA.root, { backgroundColor: C.ink, paddingTop: insets.top + 18 }]}>
      <View style={styA.header}>
        <View>
          <Eyebrow color={C.teal}>PROTOTYP A · 360°</Eyebrow>
          <Text style={[styA.title, { color: C.cream }]}>Otoč si avatara</Text>
        </View>
        <Text style={[styA.hint, { color: C.cream3 }]}>POTIAHNI ←→</Text>
      </View>

      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <GestureDetector gesture={pan}>
          <View style={{ width: stageW, height: stageH }}>
            <Animated.View style={[{ width: stageW, height: stageH }, cardStyle]}>
              <Silhouette C={C} />
              {/* garments, painted back-to-front */}
              {(['feet', 'bottom', 'top', 'mid', 'head'] as OutfitSlotId[]).map(
                (slotId) => {
                  const p = productFor(slotId);
                  if (!p) return null;
                  const g = A_LAYERS[slotId];
                  const w = (stageW * g.width) / 100;
                  return (
                    <View
                      key={slotId}
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: (stageH * g.top) / 100,
                        left: 0,
                        right: 0,
                        alignItems: 'center',
                        zIndex: g.z,
                      }}
                    >
                      <Image
                        source={p.image}
                        style={{ width: w, height: w }}
                        resizeMode="contain"
                      />
                    </View>
                  );
                },
              )}
            </Animated.View>

            {/* back-side badge — outside the rotating card so it isn't mirrored */}
            <Animated.View
              pointerEvents="none"
              style={[styA.backOverlay, backOverlayStyle]}
            >
              <View style={[styA.backChip, { backgroundColor: C.ink2, borderColor: C.ink4 }]}>
                <Ionicons name="sync" size={12} color={C.teal} />
                <Text style={[styA.backChipText, { color: C.cream2 }]}>
                  ZADNÁ STRANA
                </Text>
              </View>
            </Animated.View>

            {/* floor shadow */}
            <View
              pointerEvents="none"
              style={[
                styA.floor,
                { backgroundColor: C.ink3, width: stageW * 0.6, left: stageW * 0.2 },
              ]}
            />
          </View>
        </GestureDetector>
      </View>

      {/* slot chips */}
      <View style={styA.chipRow}>
        {OUTFIT_SLOTS.map((slot) => {
          const p = productFor(slot.id);
          return (
            <Pressable
              key={slot.id}
              onPress={() => setPickerSlot(slot.id)}
              style={[
                styA.chip,
                {
                  borderColor: p ? C.teal : C.ink4,
                  backgroundColor: p ? C.ink : C.ink2,
                },
              ]}
            >
              {p ? (
                <Image
                  source={p.image}
                  style={{ width: 44, height: 44 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: C.cream3, fontSize: 16 }}>+</Text>
              )}
              <Text style={[styA.chipLabel, { color: p ? C.teal : C.cream3 }]}>
                {slot.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 78 + 16 }}>
        <SaveBar C={C} pieceCount={pieceCount} totalPrice={totalPrice} onSave={save} />
      </View>

      <SlotPickerSheet
        slotId={pickerSlot}
        onClose={() => setPickerSlot(null)}
        onPick={(pid) => {
          if (pickerSlot) setSlot(pickerSlot, pid);
          setPickerSlot(null);
        }}
        onClear={() => {
          if (pickerSlot) setSlot(pickerSlot, undefined);
          setPickerSlot(null);
        }}
        C={C}
      />
    </View>
  );
}

function Silhouette({ C }: { C: ReturnType<typeof useColors> }) {
  // simple body built from views — stands in for an illustrated avatar
  const tint = C.ink3;
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* head */}
      <View
        style={{
          position: 'absolute',
          top: '0%',
          alignSelf: 'center',
          width: '15%',
          aspectRatio: 1,
          borderRadius: 999,
          backgroundColor: tint,
        }}
      />
      {/* torso */}
      <View
        style={{
          position: 'absolute',
          top: '13%',
          alignSelf: 'center',
          width: '38%',
          height: '32%',
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
          backgroundColor: tint,
        }}
      />
      {/* legs */}
      <View
        style={{
          position: 'absolute',
          top: '45%',
          alignSelf: 'center',
          flexDirection: 'row',
          gap: 8,
          height: '46%',
          width: '34%',
          justifyContent: 'center',
        }}
      >
        <View style={{ flex: 1, borderRadius: 14, backgroundColor: tint }} />
        <View style={{ flex: 1, borderRadius: 14, backgroundColor: tint }} />
      </View>
    </View>
  );
}

const styA = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  title: { fontFamily: FONTS.archivoBold, fontSize: 24 },
  hint: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 9, letterSpacing: 1.5 },
  backOverlay: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
  backChipText: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 9, letterSpacing: 1.5 },
  floor: {
    position: 'absolute',
    bottom: -14,
    height: 12,
    borderRadius: 99,
    opacity: 0.8,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    width: 58,
    height: 70,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    overflow: 'hidden',
  },
  chipLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 7, letterSpacing: 1 },
});

// --------------------------------------- B · character-select dress-up ---

const B_ZONES: Record<OutfitSlotId, number> = {
  head: 64,
  top: 104,
  mid: 76,
  bottom: 104,
  feet: 72,
};

function VariantB() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { PRODUCTS, draftOutfit, setSlot, productFor, pieceCount, totalPrice, save } =
    useDraft();

  const cycleSlot = (slotId: OutfitSlotId, dir: 1 | -1) => {
    const slotDef = SLOT_BY_ID[slotId];
    const matching = PRODUCTS.filter((p) => slotDef.categories.includes(p.category));
    if (matching.length === 0) return;
    const currentId = draftOutfit[slotId];
    const curIdx = matching.findIndex((p) => p.id === currentId);
    const next = matching[(curIdx + dir + matching.length) % matching.length];
    setSlot(slotId, next.id);
  };

  const score = pieceCount * 20;
  const levelName =
    pieceCount === 5 ? 'IKONA' : pieceCount >= 3 ? 'ŠTÝLOVKA' : pieceCount >= 1 ? 'ZAČIATOČNÍK' : '—';

  return (
    <View style={[styB.root, { backgroundColor: C.ink, paddingTop: insets.top + 18 }]}>
      <View style={styB.header}>
        <View style={{ flex: 1 }}>
          <Eyebrow color={C.teal}>PROTOTYP B · DRESS-UP</Eyebrow>
          <Text style={[styB.title, { color: C.cream }]}>Obleč postavu</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styB.scoreLabel, { color: C.cream3 }]}>FIT SCORE</Text>
          <Text style={[styB.scoreValue, { color: C.teal }]}>{score}</Text>
        </View>
      </View>

      {/* score bar */}
      <View style={[styB.scoreBar, { backgroundColor: C.ink3 }]}>
        <View
          style={[
            styB.scoreFill,
            { backgroundColor: C.teal, width: `${score}%` as any },
          ]}
        />
      </View>
      <Text style={[styB.levelText, { color: C.cream3 }]}>ÚROVEŇ: {levelName}</Text>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingVertical: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {OUTFIT_SLOTS.map((slot) => {
          const p = productFor(slot.id);
          const h = B_ZONES[slot.id];
          return (
            <View key={slot.id} style={styB.zoneRow}>
              <Pressable
                onPress={() => cycleSlot(slot.id, -1)}
                style={[styB.arrow, { borderColor: C.ink4 }]}
                hitSlop={6}
              >
                <Ionicons name="chevron-back" size={18} color={C.cream2} />
              </Pressable>

              <View style={[styB.zoneBody, { height: h }]}>
                {p ? (
                  <>
                    <Image
                      source={p.image}
                      style={{ width: h * 1.1, height: h }}
                      resizeMode="contain"
                    />
                    <View style={styB.zoneMeta}>
                      <Text
                        numberOfLines={1}
                        style={[styB.zoneBrand, { color: C.teal }]}
                      >
                        {p.brand}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styB.zoneName, { color: C.cream2 }]}
                      >
                        {p.name} · {p.price.current} {p.price.currency}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setSlot(slot.id, undefined)}
                      style={[styB.clearDot, { backgroundColor: C.ink3 }]}
                      hitSlop={6}
                    >
                      <Ionicons name="close" size={11} color={C.cream2} />
                    </Pressable>
                  </>
                ) : (
                  <View
                    style={[
                      styB.zoneEmpty,
                      { borderColor: C.ink4, height: h - 12 },
                    ]}
                  >
                    <Text style={[styB.zoneEmptyLabel, { color: C.cream3 }]}>
                      {slot.label}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={() => cycleSlot(slot.id, 1)}
                style={[styB.arrow, { borderColor: C.ink4 }]}
                hitSlop={6}
              >
                <Ionicons name="chevron-forward" size={18} color={C.cream2} />
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ marginBottom: 78 + 16 }}>
        <SaveBar C={C} pieceCount={pieceCount} totalPrice={totalPrice} onSave={save} />
      </View>
    </View>
  );
}

const styB = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  title: { fontFamily: FONTS.archivoBold, fontSize: 24 },
  scoreLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 8, letterSpacing: 1.5 },
  scoreValue: { fontFamily: FONTS.archivoBold, fontSize: 22 },
  scoreBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreFill: { height: 6, borderRadius: 3 },
  levelText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  zoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: -2,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneBody: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  zoneMeta: { position: 'absolute', right: 0, bottom: 4, maxWidth: 110 },
  zoneBrand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  zoneName: { fontFamily: FONTS.interSemibold, fontSize: 9, textAlign: 'right' },
  clearDot: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneEmpty: {
    alignSelf: 'stretch',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneEmptyLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 9, letterSpacing: 2 },
});

// ------------------------------------------------- C · flat-lay collage ---

function VariantC() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { productFor, pieceCount, totalPrice, save, setSlot } = useDraft();
  const [pickerSlot, setPickerSlot] = useState<OutfitSlotId | null>(null);

  const Tile = ({
    slotId,
    style,
    big,
  }: {
    slotId: OutfitSlotId;
    style?: object;
    big?: boolean;
  }) => {
    const p = productFor(slotId);
    return (
      <Pressable
        onPress={() => setPickerSlot(slotId)}
        style={[
          styC.tile,
          { backgroundColor: C.stone },
          !p && { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.ink4 },
          style,
        ]}
      >
        {p ? (
          <>
            <Image
              source={p.image}
              style={{ width: '86%', height: '86%' }}
              resizeMode="contain"
            />
            <View style={[styC.priceTag, { backgroundColor: C.teal }]}>
              <Text style={[styC.priceTagText, { color: C.ink }]}>
                {p.price.current} €
              </Text>
            </View>
            <Pressable
              onPress={() => setSlot(slotId, undefined)}
              style={[styC.tileClear, { backgroundColor: C.ink2 }]}
              hitSlop={6}
            >
              <Ionicons name="close" size={11} color={C.cream2} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styC.tilePlus, { color: C.cream3 }]}>+</Text>
            <Text style={[styC.tileLabel, { color: C.cream3 }]}>
              {SLOT_BY_ID[slotId].label}
            </Text>
          </>
        )}
      </Pressable>
    );
  };

  return (
    <View style={[styC.root, { backgroundColor: C.ink, paddingTop: insets.top + 18 }]}>
      <View style={{ marginBottom: 14 }}>
        <Eyebrow color={C.teal}>PROTOTYP C · FLAT-LAY</Eyebrow>
        <Text style={[styC.title, { color: C.cream }]}>Poskladaj koláž</Text>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styC.row}>
          <Tile slotId="top" style={{ flex: 1.5, aspectRatio: 0.92 }} big />
          <View style={{ flex: 1, gap: 10 }}>
            <Tile slotId="head" style={{ flex: 1 }} />
            <Tile slotId="mid" style={{ flex: 1 }} />
          </View>
        </View>
        <View style={[styC.row, { marginTop: 10 }]}>
          <Tile slotId="bottom" style={{ flex: 1, aspectRatio: 0.8 }} />
          <View style={{ flex: 1.1, gap: 10 }}>
            <Tile slotId="feet" style={{ flex: 1 }} />
            {/* receipt */}
            <View style={[styC.receipt, { backgroundColor: C.cream }]}>
              <Text style={[styC.receiptLabel, { color: C.ink }]}>
                SPOLU · {pieceCount}/5
              </Text>
              <Text style={[styC.receiptTotal, { color: C.ink }]}>
                {totalPrice} €
              </Text>
              <Pressable
                onPress={save}
                disabled={pieceCount === 0}
                style={[
                  styC.receiptBtn,
                  { backgroundColor: C.ink },
                  pieceCount === 0 && { opacity: 0.3 },
                ]}
              >
                <Text style={[styC.receiptBtnText, { color: C.teal }]}>
                  SAVE FIT
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={{ height: 78 + 24 }} />
      </ScrollView>

      <SlotPickerSheet
        slotId={pickerSlot}
        onClose={() => setPickerSlot(null)}
        onPick={(pid) => {
          if (pickerSlot) setSlot(pickerSlot, pid);
          setPickerSlot(null);
        }}
        onClear={() => {
          if (pickerSlot) setSlot(pickerSlot, undefined);
          setPickerSlot(null);
        }}
        C={C}
      />
    </View>
  );
}

const styC = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  title: { fontFamily: FONTS.archivoBold, fontSize: 24 },
  row: { flexDirection: 'row', gap: 10 },
  tile: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    minHeight: 90,
  },
  tilePlus: { fontFamily: FONTS.archivoBold, fontSize: 22 },
  tileLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 8, letterSpacing: 1.5 },
  priceTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    transform: [{ rotate: '-5deg' }],
  },
  priceTagText: { fontFamily: FONTS.archivoBold, fontSize: 11 },
  tileClear: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receipt: {
    flex: 1.2,
    borderRadius: 14,
    padding: 14,
    justifyContent: 'space-between',
  },
  receiptLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 8, letterSpacing: 1.5 },
  receiptTotal: { fontFamily: FONTS.archivoBold, fontSize: 26 },
  receiptBtn: {
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  receiptBtnText: { fontFamily: FONTS.archivoBold, fontSize: 11, letterSpacing: 1 },
});

// ------------------------------------------------------- floating switcher ---

function SwitcherBar({
  label,
  onPrev,
  onNext,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[sh.switcherWrap, { bottom: insets.bottom + 84 }]}
    >
      <View style={sh.switcher}>
        <Pressable onPress={onPrev} hitSlop={10} style={sh.switcherArrow}>
          <Ionicons name="chevron-back" size={16} color="#0A0A0C" />
        </Pressable>
        <Text style={sh.switcherLabel}>{label}</Text>
        <Pressable onPress={onNext} hitSlop={10} style={sh.switcherArrow}>
          <Ionicons name="chevron-forward" size={16} color="#0A0A0C" />
        </Pressable>
      </View>
    </View>
  );
}

const sh = StyleSheet.create({
  saveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16161A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1F1F22',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  saveBarLabel: { fontFamily: FONTS.jetbrainsMonoBold, fontSize: 8, letterSpacing: 1.5 },
  saveBarTotal: { fontFamily: FONTS.archivoBold, fontSize: 22, marginTop: 2 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  saveBtnText: { fontFamily: FONTS.archivoBold, fontSize: 12, letterSpacing: 0.5 },
  switcherWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  switcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 99,
    paddingHorizontal: 6,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  switcherArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D6FF3D',
  },
  switcherLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#0A0A0C',
    minWidth: 130,
    textAlign: 'center',
  },
});
