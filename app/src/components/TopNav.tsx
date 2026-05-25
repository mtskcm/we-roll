// TopNav — Maroš v2 design.
// WEROL. wordmark left, N° XX/YY page indicator + search/bell icons right.

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BellIcon from '../assets/icons/bell.svg';
import SearchIcon from '../assets/icons/search.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  currentIndex: number;
  total: number;
  onSearch: () => void;
  onNotifications?: () => void;
};

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function TopNav({ currentIndex, total, onSearch, onNotifications }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoArea}>
        <WordmarkOnDark width={108} height={20} />
      </View>

      <View style={styles.rightArea}>
        <View style={styles.indicator}>
          <Text style={styles.indicatorCur}>N°{pad2(currentIndex + 1)}</Text>
          <Text style={styles.indicatorSep}> / </Text>
          <Text style={styles.indicatorTotal}>{pad2(total)}</Text>
        </View>
        <Pressable
          accessibilityLabel="Search"
          onPress={onSearch}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <SearchIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
        </Pressable>
        <Pressable
          accessibilityLabel="Notifications"
          onPress={onNotifications}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <BellIcon width={18} height={18} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    gap: SPACING.md,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(22,22,26,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  indicatorCur: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 1,
    color: WEROL_TOKENS.paper,
  },
  indicatorSep: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    color: WEROL_TOKENS.muted2,
  },
  indicatorTotal: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    letterSpacing: 1,
    color: WEROL_TOKENS.muted,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(22,22,26,0.6)',
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
});
