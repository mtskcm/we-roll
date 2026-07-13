// SaveToCollectionSheet — global "Save to…" sheet (Pinterest-style). Tapping a
// product's bookmark opens it: quick "Saved" toggle + your collections with a
// checkmark, and "+ New collection". Rendered once in App.tsx.

import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import CheckIcon from '../assets/icons/check.svg';
import { useCollectionsStore } from '../store/collectionsStore';
import { useFeedStore, useIsSaved } from '../store/feedStore';
import { useProducts } from '../store/productsStore';
import { useSaveSheetStore } from '../store/saveSheetStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';
import { Sheet } from '../ui/Sheet';

export function SaveToCollectionSheet() {
  const product = useSaveSheetStore((s) => s.product);
  const close = useSaveSheetStore((s) => s.close);
  const collections = useCollectionsStore((s) => s.collections);
  const create = useCollectionsStore((s) => s.create);
  const toggleMember = useCollectionsStore((s) => s.toggleMember);
  const setSaved = useFeedStore((s) => s.setSaved);
  const saved = useIsSaved(product?.id ?? '');
  const products = useProducts();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  if (!product) return null;
  const pid = product.id;

  const coverFor = (productIds: string[]) => {
    const first = productIds[0] && products.find((p) => p.id === productIds[0]);
    return first ? first.image : undefined;
  };

  const addNew = () => {
    const name = newName.trim();
    if (!name) return;
    const id = create(name);
    toggleMember(id, pid);
    setNewName('');
    setCreating(false);
  };

  return (
    <Sheet visible={!!product} onClose={close} title="Save to…" heightFraction={0.7} avoidKeyboard>
      {/* Quick "Saved" (no folder) */}
      <Pressable style={styles.row} onPress={() => setSaved(pid, !saved)}>
        <View style={[styles.cover, styles.allCover]}>
          <Text style={styles.allMark}>★</Text>
        </View>
        <Text style={styles.name}>All saved</Text>
        {saved && <CheckIcon width={22} height={22} stroke={WEROL_TOKENS.lime} strokeWidth={2.5} fill="none" />}
      </Pressable>

      <FlatList
        data={collections}
        keyExtractor={(c) => c.id}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          creating ? (
            <View style={styles.newRow}>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Collection name…"
                placeholderTextColor={WEROL_TOKENS.muted2}
                style={styles.newInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={addNew}
              />
              <Pressable onPress={addNew} hitSlop={8} style={styles.newAdd}>
                <Text style={styles.newAddText}>Add</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.row} onPress={() => setCreating(true)}>
              <View style={[styles.cover, styles.newCover]}>
                <Text style={styles.plus}>+</Text>
              </View>
              <Text style={styles.name}>New collection</Text>
            </Pressable>
          )
        }
        renderItem={({ item }) => {
          const inIt = item.productIds.includes(pid);
          const cover = coverFor(item.productIds);
          return (
            <Pressable style={styles.row} onPress={() => toggleMember(item.id, pid)}>
              <View style={styles.cover}>
                {cover ? <Image source={cover} style={styles.coverImg} resizeMode="cover" /> : null}
              </View>
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.count}>{item.productIds.length} saved</Text>
              </View>
              {inIt && <CheckIcon width={22} height={22} stroke={WEROL_TOKENS.lime} strokeWidth={2.5} fill="none" />}
            </Pressable>
          );
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
  },
  coverImg: { width: '100%', height: '100%' },
  allCover: { alignItems: 'center', justifyContent: 'center', backgroundColor: WEROL_TOKENS.surface2 },
  allMark: { fontFamily: FONTS.archivo, fontSize: 20, color: WEROL_TOKENS.lime },
  newCover: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'transparent',
  },
  plus: { fontFamily: FONTS.archivoBold, fontSize: 24, color: WEROL_TOKENS.muted },
  info: { flex: 1 },
  name: { flex: 1, fontFamily: FONTS.interSemibold, fontSize: 16, color: WEROL_TOKENS.paper },
  count: { fontFamily: FONTS.inter, fontSize: 13, color: WEROL_TOKENS.muted2, marginTop: 1 },
  newRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  newInput: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
    borderRadius: RADII.pill,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: FONTS.inter,
    fontSize: 15,
    color: WEROL_TOKENS.paper,
  },
  newAdd: {
    backgroundColor: WEROL_TOKENS.lime,
    borderRadius: RADII.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  newAddText: { fontFamily: FONTS.button, fontSize: 14, color: WEROL_TOKENS.pitch },
});
