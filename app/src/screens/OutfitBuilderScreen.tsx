import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoryShareSheet } from '../components/StoryShareSheet';
import { OutfitBuilderPrototype } from './OutfitBuilderPrototype';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { OUTFIT_SLOTS, SLOT_BY_ID } from '../data/outfitSlots';
import { useProducts } from '../store/productsStore';
import { COLORS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';
import { useColors } from '../theme/useColors';
import type { OutfitSlotId, Product } from '../types';

// PROTOTYPE GATE — dev builds cycle outfit-builder variants via the floating
// bar; production renders the original screen. See OutfitBuilderPrototype.tsx.
export function OutfitBuilderScreen() {
  return <OutfitBuilderPrototype Original={OutfitBuilderOriginal} />;
}

export function OutfitBuilderOriginal() {
  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const C = useColors();
  const s = useMemo(() => makeStyles(C), [C]);
  const PRODUCTS = useProducts();

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const setSlot = useUserStore((u) => u.setSlot);
  const clearDraft = useUserStore((u) => u.clearDraftOutfit);
  const saveOutfit = useUserStore((u) => u.saveOutfit);
  const showToast = useShareStore((sh) => sh.showToast);

  const [pickerSlot, setPickerSlot] = useState<OutfitSlotId | null>(null);
  const [storyOpen, setStoryOpen] = useState(false);

  const stageSize = Math.min(winWidth - SPACING.section * 2, 360);

  const totalPrice = useMemo(() => {
    return Object.values(draftOutfit).reduce((sum, pid) => {
      const p = PRODUCTS.find((x) => x.id === pid);
      return sum + (p?.price.current ?? 0);
    }, 0);
  }, [draftOutfit]);

  const pieceCount = Object.keys(draftOutfit).length;

  const handleSave = () => {
    if (pieceCount === 0) return;
    saveOutfit();
    showToast(`FIT uložený · ${pieceCount} kúskov`);
  };

  const heroImage = useMemo(() => {
    const firstFilled = Object.values(draftOutfit).find((pid): pid is string => !!pid);
    if (!firstFilled) return undefined;
    return PRODUCTS.find((p) => p.id === firstFilled)?.image;
  }, [draftOutfit]);

  return (
    <View style={[s.root, { paddingTop: insets.top + SPACING.lg }]}>
      <View style={s.header}>
        <View>
          <Text style={s.eyebrow}>FIT BUILDER</Text>
          <Text style={[TEXT_STYLES.heading, { color: C.cream }]}>Tvoj outfit</Text>
        </View>
        {pieceCount > 0 && (
          <Pressable onPress={clearDraft} style={s.clearBtn} hitSlop={8}>
            <Ionicons name="refresh" size={14} color={C.cream2} />
            <Text style={s.clearText}>Vyčistiť</Text>
          </Pressable>
        )}
      </View>

      <View style={[s.stage, { width: stageSize, height: stageSize * 1.25 }]}>
        <Mannequin size={stageSize} C={C} />
        {OUTFIT_SLOTS.map((slot) => {
          const filled = draftOutfit[slot.id];
          const product = filled ? PRODUCTS.find((p) => p.id === filled) : null;
          return (
            <Pressable
              key={slot.id}
              onPress={() => setPickerSlot(slot.id)}
              style={[
                s.slotPin,
                {
                  left: `${slot.x}%`,
                  top: `${slot.y}%`,
                  borderColor: product ? C.teal : C.ink4,
                  backgroundColor: product ? C.ink : C.ink2,
                },
              ]}
            >
              {product ? (
                <Image source={product.image} style={s.slotImage} resizeMode="contain" />
              ) : (
                <Text style={[s.slotLabel, { color: C.cream3 }]}>+</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      <View style={s.summary}>
        <View style={s.summaryRow}>
          <View>
            <Text style={s.summaryLabel}>PIECES</Text>
            <Text style={s.summaryValue}>{pieceCount} / 5</Text>
          </View>
          <View style={s.summaryRowDivider} />
          <View>
            <Text style={s.summaryLabel}>TOTAL</Text>
            <Text style={s.summaryValue}>{totalPrice} €</Text>
          </View>
        </View>

        <View style={s.ctaRow}>
          <Pressable
            onPress={handleSave}
            disabled={pieceCount === 0}
            style={({ pressed }) => [
              s.saveBtn,
              pieceCount === 0 && { opacity: 0.4 },
              pressed && pieceCount > 0 && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="bookmark" size={16} color={C.ink} />
            <Text style={s.saveBtnText}>SAVE FIT</Text>
          </Pressable>
          <Pressable
            onPress={() => pieceCount > 0 && setStoryOpen(true)}
            disabled={pieceCount === 0}
            style={({ pressed }) => [
              s.shareBtn,
              pieceCount === 0 && { opacity: 0.4 },
              pressed && pieceCount > 0 && { opacity: 0.7 },
            ]}
          >
            <Ionicons name="share-outline" size={16} color={C.cream} />
            <Text style={s.shareBtnText}>SHARE STORY</Text>
          </Pressable>
        </View>
      </View>

      <SlotPickerSheet
        slotId={pickerSlot}
        onClose={() => setPickerSlot(null)}
        onPick={(productId) => {
          if (pickerSlot) setSlot(pickerSlot, productId);
          setPickerSlot(null);
        }}
        onClear={() => {
          if (pickerSlot) setSlot(pickerSlot, undefined);
          setPickerSlot(null);
        }}
        C={C}
      />

      <StoryShareSheet
        visible={storyOpen}
        outfit={{
          pieceCount,
          totalPrice,
          currency: '€',
          heroImage,
        }}
        onClose={() => setStoryOpen(false)}
        onCopied={() => showToast('Link copied')}
      />
    </View>
  );
}

function Mannequin({ size, C }: { size: number; C: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.mannequin, { width: size, height: size * 1.25 }]}>
      <View
        style={[
          styles.mannequinSilhouette,
          { borderColor: C.ink3, backgroundColor: C.ink2 },
        ]}
      />
    </View>
  );
}

export function SlotPickerSheet({
  slotId,
  onClose,
  onPick,
  onClear,
  C,
}: {
  slotId: OutfitSlotId | null;
  onClose: () => void;
  onPick: (productId: string) => void;
  onClear: () => void;
  C: ReturnType<typeof useColors>;
}) {
  const insets = useSafeAreaInsets();
  const visible = slotId !== null;
  const slotDef = slotId ? SLOT_BY_ID[slotId] : null;

  const opacity = useSharedValue(0);
  const translate = useSharedValue(400);

  React.useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 220 });
      translate.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      opacity.value = withTiming(0, { duration: 180 });
      translate.value = withTiming(400, { duration: 220 });
    }
  }, [visible, opacity, translate]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }));

  const draftOutfit = useUserStore((u) => u.draftOutfit);
  const currentProductId = slotId ? draftOutfit[slotId] : undefined;
  const PRODUCTS = useProducts();

  const matching = useMemo(() => {
    if (!slotDef) return [] as Product[];
    return PRODUCTS.filter((p) => slotDef.categories.includes(p.category));
  }, [slotDef, PRODUCTS]);

  const s = makeSheetStyles(C);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[s.sheet, sheetStyle, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={s.grabber} />
          <View style={s.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.eyebrow}>SLOT</Text>
              <Text style={s.title}>{slotDef?.label}</Text>
            </View>
            {currentProductId && (
              <Pressable onPress={onClear} hitSlop={8} style={s.removeBtn}>
                <Ionicons name="trash-outline" size={14} color={C.likeRed} />
                <Text style={[s.removeText, { color: C.likeRed }]}>Odstrániť</Text>
              </Pressable>
            )}
          </View>

          <FlatList
            data={matching}
            keyExtractor={(p) => p.id}
            horizontal={false}
            numColumns={2}
            columnWrapperStyle={s.gridRow}
            contentContainerStyle={s.grid}
            renderItem={({ item }) => {
              const active = item.id === currentProductId;
              return (
                <Pressable
                  onPress={() => onPick(item.id)}
                  style={[
                    s.tile,
                    active && { borderColor: C.teal, borderWidth: 2 },
                  ]}
                >
                  <View style={s.tileImage}>
                    <Image source={item.image} style={s.tileImg} resizeMode="contain" />
                  </View>
                  <Text style={s.tileBrand} numberOfLines={1}>
                    {item.brand}
                  </Text>
                  <Text style={s.tileName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={s.tilePrice}>
                    {item.price.current} {item.price.currency}
                  </Text>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Žiadne produkty v tejto kategórii.</Text>
              </View>
            }
          />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.ink, paddingHorizontal: SPACING.section },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: SPACING.lg,
    },
    eyebrow: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 9,
      letterSpacing: 2,
      color: C.teal,
      marginBottom: 4,
    },
    clearBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: C.ink3,
    },
    clearText: {
      fontFamily: FONTS.interSemibold,
      fontSize: 11,
      color: C.cream2,
    },
    stage: {
      alignSelf: 'center',
      marginTop: SPACING.lg,
      position: 'relative',
    },
    slotPin: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginLeft: -28,
      marginTop: -28,
    },
    slotImage: { width: 50, height: 50 },
    slotLabel: { fontFamily: FONTS.interSemibold, fontSize: 22 },
    summary: {
      marginTop: 'auto',
      marginBottom: SPACING.section + 78,
      gap: SPACING.lg,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.ink2,
      borderRadius: RADII.md,
      borderWidth: 1,
      borderColor: C.ink3,
      paddingHorizontal: SPACING.section,
      paddingVertical: SPACING.lg,
      gap: SPACING.section,
    },
    summaryLabel: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 9,
      letterSpacing: 1.5,
      color: C.cream3,
    },
    summaryValue: {
      fontFamily: FONTS.archivoBold,
      fontSize: 26,
      color: C.cream,
      marginTop: 4,
    },
    summaryRowDivider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: C.ink3,
    },
    ctaRow: {
      flexDirection: 'row',
      gap: 8,
    },
    saveBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: C.teal,
      borderRadius: RADII.md,
      paddingVertical: 14,
    },
    saveBtnText: {
      fontFamily: FONTS.archivoBold,
      fontSize: 13,
      color: C.ink,
      letterSpacing: 0.5,
    },
    shareBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: 'transparent',
      borderRadius: RADII.md,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: C.ink4,
    },
    shareBtnText: {
      fontFamily: FONTS.archivoBold,
      fontSize: 13,
      color: C.cream,
      letterSpacing: 0.5,
    },
  });
}

const styles = StyleSheet.create({
  mannequin: { position: 'absolute', alignItems: 'center' },
  mannequinSilhouette: {
    position: 'absolute',
    top: '5%',
    left: '20%',
    right: '20%',
    bottom: '5%',
    borderRadius: 999,
    borderWidth: 1,
  },
});

function makeSheetStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: C.ink2,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: SPACING.section,
      paddingTop: SPACING.lg,
      maxHeight: '85%',
    },
    grabber: {
      alignSelf: 'center',
      width: 38,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.ink4,
      marginBottom: SPACING.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: SPACING.lg,
    },
    eyebrow: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 9,
      letterSpacing: 2,
      color: C.teal,
      marginBottom: 4,
    },
    title: {
      fontFamily: FONTS.archivoBold,
      fontSize: 26,
      color: C.cream,
    },
    removeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1,
      borderColor: `${COLORS.likeRed}55`,
    },
    removeText: { fontFamily: FONTS.interSemibold, fontSize: 11 },
    grid: { gap: SPACING.lg, paddingBottom: SPACING.section },
    gridRow: { gap: SPACING.lg, marginBottom: SPACING.lg },
    tile: {
      flex: 1,
      backgroundColor: C.ink3,
      borderRadius: RADII.md,
      borderWidth: 1,
      borderColor: C.ink4,
      padding: SPACING.md,
      gap: 4,
    },
    tileImage: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: C.imagePlaceholder,
      borderRadius: RADII.sm,
      overflow: 'hidden',
      marginBottom: 6,
    },
    tileImg: { width: '100%', height: '100%' },
    tileBrand: {
      fontFamily: FONTS.jetbrainsMonoBold,
      fontSize: 8,
      letterSpacing: 1.5,
      color: C.teal,
      textTransform: 'uppercase',
    },
    tileName: {
      fontFamily: FONTS.archivoBold,
      fontSize: 14,
      color: C.cream,
    },
    tilePrice: {
      fontFamily: FONTS.interSemibold,
      fontSize: 12,
      color: C.cream2,
    },
    empty: { paddingVertical: SPACING.hero, alignItems: 'center' },
    emptyText: {
      fontFamily: FONTS.inter,
      fontSize: 13,
      color: C.cream3,
    },
  });
}
