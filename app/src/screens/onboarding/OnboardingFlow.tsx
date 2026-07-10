// Onboarding — shown once after the first sign-in (gated on empty
// profiles.preferences). Four quick steps: gender → style vibes → favourite
// brands → sizes. Saves everything to profiles.preferences (the seed for the
// recommendation algorithm) and syncs sizes + followed brands into the store.

import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useEngagementStore } from '../../store/engagementStore';
import { getAllProducts } from '../../store/productsStore';
import { useUserStore, type Sizes } from '../../store/userStore';
import { WEROL_TOKENS } from '../../theme/colors';
import { RADII, SPACING } from '../../theme/spacing';
import { FONTS } from '../../theme/typography';

type Gender = 'female' | 'male' | 'all';

const GENDERS: Array<{ key: Gender; label: string }> = [
  { key: 'female', label: 'Women' },
  { key: 'male', label: 'Men' },
  { key: 'all', label: 'Everything' },
];

const VIBES = [
  'Streetwear', 'Minimal', 'Sporty', 'Vintage', 'Techwear', 'Y2K',
  'Skate', 'Outdoor', 'Elegant', 'Casual', 'Grunge', 'Luxury',
];

const SIZE_OPTIONS: Record<keyof Sizes, string[]> = {
  top: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottom: ['28', '29', '30', '31', '32', '33', '34', '36', '38'],
  shoes: ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
};

const SIZE_LABEL: Record<keyof Sizes, string> = { top: 'Top', bottom: 'Bottom', shoes: 'Shoes' };

const FALLBACK_BRANDS = [
  'Nike', 'Adidas', 'Jordan', 'New Balance', '4F', 'Puma', 'New Era', 'Champion',
  'Timberland', 'Vans', 'Converse', 'Reebok', 'Dickies', 'Levi’s®', 'Ellesse', 'Asics',
];

/** Top brands from the live catalog (by product count), falling back to a
 * curated list if the catalog hasn't hydrated yet. */
function topBrands(limit = 24): string[] {
  const counts = new Map<string, number>();
  for (const p of getAllProducts()) {
    const b = (p.brand || '').trim();
    if (b) counts.set(b, (counts.get(b) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([b]) => b);
  return (sorted.length ? sorted : FALLBACK_BRANDS).slice(0, limit);
}

const toggle = (arr: string[], v: string) =>
  arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

const STEP_COUNT = 4;

export function OnboardingFlow() {
  const insets = useSafeAreaInsets();
  const savePreferences = useUserStore((s) => s.savePreferences);
  const setFollowedBrands = useUserStore((s) => s.setFollowedBrands);
  const setSize = useUserStore((s) => s.setSize);

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [vibes, setVibes] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [sizes, setSizes] = useState<Sizes>({ top: null, bottom: null, shoes: null });
  const [saving, setSaving] = useState(false);

  const brandOptions = useMemo(() => topBrands(24), []);
  const canAdvance = step === 0 ? !!gender : true;

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setFollowedBrands(brands);
    useEngagementStore.getState().seedBrands(brands); // seed the algorithm's taste
    (Object.keys(sizes) as Array<keyof Sizes>).forEach((k) => setSize(k, sizes[k]));
    // Always non-empty (onboarded flag) so a skipped step doesn't re-trigger
    // onboarding on the next launch.
    await savePreferences({ onboarded: true, gender, styles: vibes, brands, sizes });
  };

  const next = () => (step < STEP_COUNT - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);

  const HEADS = [
    { eyebrow: 'FOR WHO', title: 'What are you shopping for?', sub: "We'll tune your feed." },
    { eyebrow: 'YOUR STYLE', title: 'Which vibes are you into?', sub: 'Pick as many as you like.' },
    { eyebrow: 'BRANDS', title: 'What do you wear the most?', sub: "We'll show you more of them." },
    { eyebrow: 'SIZES', title: 'Your sizes', sub: 'Optional — you can add them later.' },
  ];
  const head = HEADS[step];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      {/* Header: back · progress · skip */}
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={10} style={styles.headerBtn} disabled={step === 0}>
          <Text style={[styles.headerArrow, step === 0 && { opacity: 0 }]}>←</Text>
        </Pressable>
        <View style={styles.progress}>
          {Array.from({ length: STEP_COUNT }).map((_, i) => (
            <View key={i} style={[styles.progressSeg, i <= step && styles.progressSegOn]} />
          ))}
        </View>
        <Pressable onPress={finish} hitSlop={10} style={styles.headerBtn} disabled={saving}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <Animated.View key={step} entering={FadeInRight.duration(220)} style={styles.body}>
        <Text style={styles.eyebrow}>— {head.eyebrow}</Text>
        <Text style={styles.title}>{head.title}</Text>
        <Text style={styles.sub}>{head.sub}</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {step === 0 && (
            <View style={styles.genderCol}>
              {GENDERS.map((g) => (
                <Chip
                  key={g.key}
                  label={g.label}
                  active={gender === g.key}
                  block
                  onPress={() => setGender(g.key)}
                />
              ))}
            </View>
          )}

          {step === 1 && (
            <View style={styles.wrap}>
              {VIBES.map((v) => (
                <Chip key={v} label={v} active={vibes.includes(v)} onPress={() => setVibes((a) => toggle(a, v))} />
              ))}
            </View>
          )}

          {step === 2 && (
            <View style={styles.wrap}>
              {brandOptions.map((b) => (
                <Chip key={b} label={b} active={brands.includes(b)} onPress={() => setBrands((a) => toggle(a, b))} />
              ))}
            </View>
          )}

          {step === 3 &&
            (Object.keys(SIZE_OPTIONS) as Array<keyof Sizes>).map((k) => (
              <View key={k} style={styles.sizeGroup}>
                <Text style={styles.sizeLabel}>{SIZE_LABEL[k]}</Text>
                <View style={styles.wrap}>
                  {SIZE_OPTIONS[k].map((s) => (
                    <Chip
                      key={s}
                      label={s}
                      active={sizes[k] === s}
                      onPress={() => setSizes((prev) => ({ ...prev, [k]: prev[k] === s ? null : s }))}
                    />
                  ))}
                </View>
              </View>
            ))}
        </ScrollView>
      </Animated.View>

      {/* Continue */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={next}
          disabled={!canAdvance || saving}
          style={({ pressed }) => [
            styles.cta,
            (!canAdvance || saving) && styles.ctaDisabled,
            pressed && canAdvance && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.ctaText}>{step === STEP_COUNT - 1 ? 'Done' : 'Continue'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  block,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  block?: boolean;
}) {
  return (
    <Animated.View entering={FadeIn} style={block ? styles.chipBlockWrap : undefined}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.chip,
          block && styles.chipBlock,
          active && styles.chipActive,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: WEROL_TOKENS.pitch },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 44,
    gap: 12,
  },
  headerBtn: { minWidth: 64 },
  headerArrow: { fontFamily: FONTS.archivoBold, fontSize: 24, color: WEROL_TOKENS.paper },
  skip: { fontFamily: FONTS.archivoMedium, fontSize: 14, color: WEROL_TOKENS.muted, textAlign: 'right' },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: WEROL_TOKENS.line2 },
  progressSegOn: { backgroundColor: WEROL_TOKENS.lime },

  body: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 24 },
  eyebrow: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 2,
    color: WEROL_TOKENS.lime,
    marginBottom: 10,
  },
  title: { fontFamily: FONTS.archivoBold, fontSize: 30, letterSpacing: -0.8, color: WEROL_TOKENS.paper },
  sub: { fontFamily: FONTS.archivoRegular, fontSize: 15, color: WEROL_TOKENS.muted, marginTop: 6 },

  scroll: { flex: 1, marginTop: 24 },
  scrollContent: { paddingBottom: 24 },

  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  genderCol: { gap: 12 },

  chip: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADII.pill,
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  chipBlockWrap: { width: '100%' },
  chipBlock: { alignItems: 'center', paddingVertical: 18 },
  chipActive: { backgroundColor: WEROL_TOKENS.lime, borderColor: WEROL_TOKENS.lime },
  chipText: { fontFamily: FONTS.archivoBold, fontSize: 15, color: WEROL_TOKENS.paper },
  chipTextActive: { color: WEROL_TOKENS.pitch },

  sizeGroup: { marginBottom: 22 },
  sizeLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: WEROL_TOKENS.muted,
    marginBottom: 10,
  },

  footer: { paddingHorizontal: SPACING.lg, paddingTop: 8 },
  cta: {
    alignItems: 'center',
    backgroundColor: WEROL_TOKENS.lime,
    borderRadius: RADII.pill,
    paddingVertical: 17,
  },
  ctaDisabled: { backgroundColor: WEROL_TOKENS.line2 },
  ctaText: { fontFamily: FONTS.archivoBold, fontSize: 15, letterSpacing: 0.3, color: WEROL_TOKENS.pitch },
});
