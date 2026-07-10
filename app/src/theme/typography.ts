// WEROL — Typography (Edition 03 — "Streetwear app UI kit design-3")
// ONE family: Manrope, weights 400–800. Legacy FONT keys are kept as aliases
// (archivo* / jetbrainsMono*) so every screen restyles itself without renames;
// new code should prefer the manrope* keys.
//
// Kit scale: Display/logo 800·52/-3.5% · Screen title 700·34/-2% ·
// Heading/product 600·22 · Body 500·17 (#D6D7DB) · Technical label 700·13/+20% UPPER.

import type { TextStyle } from 'react-native';
import { WEROL_TOKENS } from './colors';

export const FONTS = {
  // Canonical Manrope keys
  manrope: 'Manrope_400Regular',
  manropeMedium: 'Manrope_500Medium',
  manropeSemibold: 'Manrope_600SemiBold',
  manropeBold: 'Manrope_700Bold',
  manropeExtraBold: 'Manrope_800ExtraBold',

  // Accents (per Matúš): serif for product name + price, Prosto One for buttons
  serif: 'CactusClassicalSerif_400Regular',
  button: 'ProstoOne_400Regular',

  // Legacy aliases — value swap restyles the whole app in one move
  archivo: 'Manrope_800ExtraBold',        // display / big numbers
  archivoBold: 'Manrope_700Bold',         // headings, CTAs, prices
  archivoSemibold: 'Manrope_600SemiBold', // subheads, product names, handles
  archivoMedium: 'Manrope_500Medium',     // emphasized body
  archivoRegular: 'Manrope_400Regular',   // body copy, captions, inputs
  jetbrainsMono: 'Manrope_600SemiBold',   // ex-technical accent → gray label
  jetbrainsMonoBold: 'Manrope_700Bold',   // ex-technical bold → label 700
} as const;

export const TEXT_STYLES = {
  /** Display / wordmark-weight statements (kit: 800 · 52 · -3.5%) */
  display: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 52,
    letterSpacing: -1.8,
    lineHeight: 52,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Screen title (kit: 700 · 34 · -2%) */
  heading: {
    fontFamily: FONTS.manropeBold,
    fontSize: 34,
    letterSpacing: -0.7,
    lineHeight: 38,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Section / product heading (kit: 600 · 22) */
  subheading: {
    fontFamily: FONTS.manropeSemibold,
    fontSize: 22,
    letterSpacing: -0.2,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  /** Body copy (kit: 500 · 17 · #D6D7DB) */
  body: {
    fontFamily: FONTS.manropeMedium,
    fontSize: 17,
    lineHeight: 24,
    color: WEROL_TOKENS.body,
  } satisfies TextStyle,
  /** Technical label (kit: 700 · 13 · +20% · UPPER) */
  label: {
    fontFamily: FONTS.manropeBold,
    fontSize: 13,
    letterSpacing: 2.6,
    textTransform: 'uppercase',
    color: WEROL_TOKENS.muted2,
  } satisfies TextStyle,
  productBrand: {
    fontFamily: FONTS.manropeBold,
    fontSize: 11,
    letterSpacing: 1.8,
    color: WEROL_TOKENS.lime,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  productPrice: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: WEROL_TOKENS.paper,
  } satisfies TextStyle,
  priceOld: {
    fontFamily: FONTS.manrope,
    fontSize: 13,
    color: WEROL_TOKENS.muted2,
    textDecorationLine: 'line-through',
  } satisfies TextStyle,
};
