// TopNav — WEROL wordmark left, search (magnifier) right. Transparent;
// floats over the full-bleed feed image.

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import SearchIcon from '../assets/icons/search.svg';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';

type Props = {
  onSearch: () => void;
};

export function TopNav({ onSearch }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.logoArea}>
        <WordmarkOnDark width={104} height={19} />
      </View>

      <Pressable
        accessibilityLabel="Search"
        onPress={onSearch}
        hitSlop={10}
        style={({ pressed }) => [styles.searchBtn, pressed && { opacity: 0.6 }]}
      >
        <SearchIcon width={25} height={25} stroke={WEROL_TOKENS.paper} strokeWidth={1.9} fill="none" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.section,
    paddingTop: 6,
    paddingBottom: 6,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    // subtle shadow so the white wordmark reads on light shots
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  searchBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
});
