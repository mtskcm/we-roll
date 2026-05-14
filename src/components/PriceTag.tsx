import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SPACING } from '../theme/spacing';
import { TEXT_STYLES } from '../theme/typography';

type Props = {
  current: number;
  original?: number;
  currency: string;
};

export function PriceTag({ current, original, currency }: Props) {
  return (
    <View style={styles.row}>
      <Text style={TEXT_STYLES.productPrice}>
        {current} {currency}
      </Text>
      {original !== undefined && (
        <Text style={[TEXT_STYLES.priceOld, styles.old]}>
          {original} {currency}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
  },
  old: {
    marginLeft: 2,
  },
});
