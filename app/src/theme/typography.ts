import type { TextStyle } from 'react-native';
import { COLORS } from './colors';

export const FONTS = {
  cormorantLight: 'CormorantGaramond_300Light',
  cormorantRegular: 'CormorantGaramond_400Regular',
  cormorantItalic: 'CormorantGaramond_400Regular_Italic',
  dmSansRegular: 'DMSans_400Regular',
  dmSansSemibold: 'DMSans_500Medium',
  spaceMonoRegular: 'SpaceMono_400Regular',
  spaceMonoBold: 'SpaceMono_700Bold',
} as const;

export const TEXT_STYLES = {
  wordmark: {
    fontFamily: FONTS.cormorantLight,
    fontSize: 24,
    letterSpacing: -1,
    color: COLORS.cream,
  } satisfies TextStyle,
  wordmarkAccent: {
    fontFamily: FONTS.cormorantItalic,
    fontSize: 24,
    letterSpacing: -1,
    color: COLORS.teal,
  } satisfies TextStyle,
  productName: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 22,
    letterSpacing: -0.3,
    lineHeight: 26,
    color: COLORS.cream,
  } satisfies TextStyle,
  productBrand: {
    fontFamily: FONTS.spaceMonoBold,
    fontSize: 9,
    letterSpacing: 2.5,
    color: COLORS.teal,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  productPrice: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 16,
    letterSpacing: -0.3,
    color: COLORS.cream,
  } satisfies TextStyle,
  priceOld: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 12,
    color: COLORS.stone,
    textDecorationLine: 'line-through',
  } satisfies TextStyle,
  shopName: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 13,
    letterSpacing: -0.2,
    color: COLORS.cream,
  } satisfies TextStyle,
  shopUrl: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 9,
    letterSpacing: 1,
    color: COLORS.cream3,
  } satisfies TextStyle,
  navLabel: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 9,
    letterSpacing: 0.5,
    color: COLORS.dim,
  } satisfies TextStyle,
  actionCount: {
    fontFamily: FONTS.spaceMonoRegular,
    fontSize: 10,
    color: COLORS.cream2,
  } satisfies TextStyle,
  takeItText: {
    fontFamily: FONTS.dmSansSemibold,
    fontSize: 14,
    letterSpacing: 0.3,
  } satisfies TextStyle,
  body: {
    fontFamily: FONTS.dmSansRegular,
    fontSize: 14,
    color: COLORS.cream,
  } satisfies TextStyle,
  heading: {
    fontFamily: FONTS.cormorantRegular,
    fontSize: 28,
    letterSpacing: -0.5,
    color: COLORS.cream,
  } satisfies TextStyle,
};
