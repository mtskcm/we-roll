// TopNav — Maroš v2 design.
// WEROL. wordmark left, search + bell icon buttons right.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import BellIcon from '../assets/icons/bell.svg';
import SearchIcon from '../assets/icons/search.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';

type Props = {
  onSearch: () => void;
  onNotifications?: () => void;
};

export function TopNav({ onSearch, onNotifications }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoArea}>
        <WordmarkOnDark width={108} height={20} />
      </View>

      <View style={styles.rightArea}>
        <Pressable
          accessibilityLabel="Search"
          onPress={onSearch}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <SearchIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
        </Pressable>
        <Pressable
          accessibilityLabel="Notifications"
          onPress={onNotifications}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <BellIcon width={20} height={20} stroke={WEROL_TOKENS.paper} strokeWidth={1.8} fill="none" />
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
    paddingTop: 4,
    paddingBottom: 4,
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
