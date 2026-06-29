// WEROL — Typography (Edition 01 · 2026 · Maroš)
// Three families. One system. Strict roles — never swap.

import type { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const FONTS = {
  // Display — Archivo Black (wordmark, H1/H2/H3, buttons)
  archivo: 'Archivo_900Black',
  archivoBold: 'Archivo_800ExtraBold',
  archivoMedium: 'Archivo_500Medium',
  archivoRegular: 'Archivo_400Regular',

  // Body — Inter (paragraphs, long-form copy)
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemibold: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',

  // Technical — JetBrains Mono (labels, prices, SKUs, uppercase micro-type)
  jetbrainsMono: 'JetBrainsMono_500Medium',
  jetbrainsMonoRegular: 'JetBrainsMono_400Regular',
  jetbrainsMonoBold: 'JetBrainsMono_700Bold',

  // Nav / accent — Space Grotesk (tab labels, modern micro-type)
  spaceGrotesk: 'SpaceGrotesk_500Medium',
  spaceGroteskBold: 'SpaceGrotesk_600SemiBold',

  // Backward-compat aliases (old code calls these — point to new families)
  cormorantLight: 'Archivo_900Black',
  cormorantRegular: 'Archivo_800ExtraBold',
  cormorantItalic: 'Archivo_900Black',
  dmSansRegular: 'Inter_400Regular',
  dmSansSemibold: 'Inter_500Medium',
  spaceMonoRegular: 'JetBrainsMono_500Medium',
  spaceMonoBold: 'JetBrainsMono_700Bold',
} as const;

export const TEXT_STYLES = {
  // === WORDMARK ===
  wordmark: {
    fontFamily: FONTS.archivo,
    fontSize: 28,
    letterSpacing: -1.2,
    color: COLORS.cream,
  } satisfies TextStyle,
  wordmarkAccent: {
    // Old "italic O" used to be teal-colored; now we render as part of SVG.
    // Kept for legacy compat — same as wordmark but lime tint.
    fontFamily: FONTS.archivo,
    fontSize: 28,
    letterSpacing: -1.2,
    color: COLORS.teal,
  } satisfies TextStyle,

  // === HEADINGS ===
  heading: {
    fontFamily: FONTS.archivoBold,
    fontSize: 32,
    letterSpacing: -1,
    lineHeight: 36,
    color: COLORS.cream,
  } satisfies TextStyle,
  headingLarge: {
    fontFamily: FONTS.archivo,
    fontSize: 48,
    letterSpacing: -2,
    lineHeight: 52,
    color: COLORS.cream,
  } satisfies TextStyle,

  // === PRODUCT ===
  productName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 22,
    letterSpacing: -0.5,
    lineHeight: 26,
    color: COLORS.cream,
  } satisfies TextStyle,
  productBrand: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 2.2,
    color: COLORS.teal,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  productPrice: {
    fontFamily: FONTS.archivoBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: COLORS.cream,
  } satisfies TextStyle,
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: COLORS.cream3,
    textDecorationLine: 'line-through',
  } satisfies TextStyle,

  // === SHOP ===
  shopName: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: -0.2,
    color: COLORS.cream,
  } satisfies TextStyle,
  shopUrl: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: COLORS.cream3,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // === NAVIGATION ===
  navLabel: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: COLORS.dim,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // === ACTIONS ===
  actionCount: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    color: COLORS.cream2,
  } satisfies TextStyle,
  takeItText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  // === BODY ===
  body: {
    fontFamily: FONTS.inter,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.cream,
  } satisfies TextStyle,
  bodyMuted: {
    fontFamily: FONTS.inter,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.cream2,
  } satisfies TextStyle,
  caption: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.cream3,
  } satisfies TextStyle,

  // === TECHNICAL LABELS (uppercase mono) ===
  techLabel: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 2.2,
    color: COLORS.cream3,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  techLabelAccent: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 2.2,
    color: COLORS.teal,
    textTransform: 'uppercase',
  } satisfies TextStyle,
};
