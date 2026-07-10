// StatBlock — UI kit primitive (Edition 03). Surface card with N stats
// separated by hairline dividers (e.g. Outfits · Likes · Saved).

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  stats: Array<{ value: string | number; label: string }>;
};

export function StatBlock({ stats }: Props) {
  return (
    <View style={styles.block}>
      {stats.map((s, i) => (
        <React.Fragment key={s.label}>
          {i > 0 && <View style={styles.divider} />}
          <View style={styles.stat}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    flexDirection: 'row',
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.lg,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.09)' },
  value: { fontFamily: FONTS.manropeExtraBold, fontSize: 23, color: WEROL_TOKENS.paper },
  label: { fontFamily: FONTS.manropeSemibold, fontSize: 13, color: '#8A8B90', marginTop: 2 },
});
