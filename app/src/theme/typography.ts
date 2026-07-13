// WEROL — Typography (Edition 04). THREE families, strict roles:
//   Archivo        — display: headings, prices, big numbers, buttons.
//   Inter          — body/UI: product names, captions, inputs, settings, handles.
//   JetBrains Mono — technical accent: eyebrows, SKUs, timestamps, micro-labels.
//
// Bundled locally (src/assets/fonts). Legacy FONT keys are kept as aliases and
// mapped BY ROLE, so every screen restyles itself without edits.

import type { TextStyle } from 'react-native';
import { WEROL_TOKENS } from './colors';

export const FONTS = {
  // Display — Archivo
  display: 'Archivo-Black',
  archivo: 'Archivo-ExtraBold',
  archivoBold: 'Archivo-Bold',
  archivoSemibold: 'Archivo-SemiBold',
  archivoMedium: 'Archivo-Medium',
  archivoRegular: 'Archivo-Regular',

  // Body / UI — Inter
  inter: 'Inter-Regular',
  interMedium: 'Inter-Medium',
  interSemibold: 'Inter-SemiBold',
  interBold: 'Inter-Bold',
  interExtraBold: 'Inter-ExtraBold',

  // Technical labels — JetBrains Mono
  mono: 'JetBrainsMono-Medium',
  monoBold: 'JetBrainsMono-Bold',
  jetbrainsMono: 'JetBrainsMono-Medium',
  jetbrainsMonoBold: 'JetBrainsMono-Bold',

  // --- Legacy aliases (from the Manrope edition) → remapped by ROLE ---
  // Base/body weights → Inter; heavy weights → Archivo display.
  manrope: 'Inter-Regular',
  manropeMedium: 'Inter-Medium',
  manropeSemibold: 'Inter-SemiBold',
  manropeBold: 'Archivo-Bold',
  manropeExtraBold: 'Archivo-ExtraBold',
  // Retired accents → Archivo display.
  serif: 'Archivo-ExtraBold',
  button: 'Archivo-Bold',
} as const;

export const TEXT_STYLES = {
  /** Display / wordmark-weight statements */
  display: {
    fontFamily: FONTS.display,
    fontSize: 48,
    letterSpacing: -1.5,
    lineHeight: 50,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Screen title */
  heading: {
    fontFamily: FONTS.archivo,
    fontSize: 32,
    letterSpacing: -0.6,
    lineHeight: 36,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Section / product heading */
  subheading: {
    fontFamily: FONTS.interSemibold,
    fontSize: 20,
    letterSpacing: -0.2,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Body copy */
  body: {
    fontFamily: FONTS.inter,
    fontSize: 16,
    lineHeight: 23,
    color: WEROL_TOKENS.body,
  } satisfies TextStyle,
  /** Technical label */
  label: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: WEROL_TOKENS.muted2,
  } satisfies TextStyle,
  productBrand: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: WEROL_TOKENS.lime,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  productPrice: {
    fontFamily: FONTS.archivo,
    fontSize: 18,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  priceOld: {
    fontFamily: FONTS.inter,
    fontSize: 13,
    color: WEROL_TOKENS.muted2,
    textDecorationLine: 'line-through',
  } satisfies TextStyle,
};
