// FilterSheet — the magnifier on HOME opens this instead of a search screen.
// Pick a query / categories / brands → the FEED shows only matching pieces
// (e.g. "adidas" + Tees → only adidas tees scroll by). Product rule: while a
// filter is active, interactions don't count into the recommendation
// algorithm (see productsStore).

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, type CategoryId } from '../data/categories';
import { STYLE_OPTIONS } from '../lib/productStyle';
import {
  getAllProducts,
  useFeedFilter,
  useProductsStore,
  type FeedFilter,
} from '../store/productsStore';
import { WEROL_TOKENS } from '../theme/colors';
import { FONTS } from '../theme/typography';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { SearchInput } from '../ui/Input';
import { Sheet } from '../ui/Sheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Called after Apply/Clear so the feed can scroll back to the top. */
  onApplied?: () => void;
};

const toggle = <T,>(arr: T[], v: T): T[] =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

/** Top catalog brands by product count. */
function topBrands(limit = 18): string[] {
  const counts = new Map<string, number>();
  for (const p of getAllProducts()) {
    const b = (p.brand || '').trim();
    if (b) counts.set(b, (counts.get(b) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b).slice(0, limit);
}

export function FilterSheet({ visible, onClose, onApplied }: Props) {
  const active = useFeedFilter();
  const setFilter = useProductsStore((s) => s.setFilter);

  // Draft state — applied only on "Show results".
  const [query, setQuery] = useState(active?.query ?? '');
  const [categories, setCategories] = useState<CategoryId[]>(active?.categories ?? []);
  const [brands, setBrands] = useState<string[]>(active?.brands ?? []);
  const [styles_, setStyles] = useState<string[]>(active?.styles ?? []);

  const brandOptions = useMemo(() => topBrands(), []);

  const apply = (f: FeedFilter | null) => {
    setFilter(f);
    onClose();
    onApplied?.();
  };

  const clear = () => {
    setQuery('');
    setCategories([]);
    setBrands([]);
    setStyles([]);
    apply(null);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Filter your feed" heightFraction={0.78} avoidKeyboard>
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder="Brands, products…"
        returnKeyType="done"
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Category</Text>
        <View style={styles.wrap}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={categories.includes(c.id)}
              onPress={() => setCategories((a) => toggle(a, c.id))}
            />
          ))}
        </View>

        <Text style={styles.label}>Style</Text>
        <View style={styles.wrap}>
          {STYLE_OPTIONS.map((s) => (
            <Chip
              key={s.key}
              label={s.label}
              active={styles_.includes(s.key)}
              onPress={() => setStyles((a) => toggle(a, s.key))}
            />
          ))}
        </View>

        <Text style={styles.label}>Brand</Text>
        <View style={styles.wrap}>
          {brandOptions.map((b) => (
            <Chip key={b} label={b} active={brands.includes(b)} onPress={() => setBrands((a) => toggle(a, b))} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Clear" variant="ghost" onPress={clear} style={styles.footerBtn} />
        <Button
          label="Show results"
          onPress={() => apply({ query, categories, brands, styles: styles_ })}
          style={styles.footerBtnWide}
        />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, marginTop: 8 },
  label: {
    fontFamily: FONTS.manropeBold,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: WEROL_TOKENS.muted2,
    marginTop: 22,
    marginBottom: 12,
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  footer: { flexDirection: 'row', gap: 12, paddingTop: 14 },
  footerBtn: { flex: 1 },
  footerBtnWide: { flex: 2 },
});
