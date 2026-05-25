// Shared frame for Welcome / SignIn / SignUp screens.
// Renders: top wordmark + WEAR·ALL tagline, decorative giant outline letters
// in background, eyebrow + hero text, and a children slot for screen-specific UI.

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WordmarkOnDark from '../assets/logos/wordmark-on-dark.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  eyebrow: string; // e.g. "WELCOME BACK" / "JOIN WEROL"
  hero: string[];  // e.g. ["One feed.", "Every drop.", "Your people."] — last char of last line gets lime period accent
  children: React.ReactNode;
};

export function AuthFrame({ eyebrow, hero, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* Decorative giant outlined letters in background */}
      <Text style={styles.decorBg} numberOfLines={1}>
        AR
      </Text>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Wordmark + tagline */}
        <View style={styles.brand}>
          <WordmarkOnDark width={148} height={26} />
          <Text style={styles.tagline}>WEAR · ALL</Text>
        </View>

        <View style={styles.spacer} />

        {/* Eyebrow + hero */}
        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>— {eyebrow}</Text>
          <View style={styles.heroLines}>
            {hero.map((line, i) => {
              const isLast = i === hero.length - 1;
              const hasPeriod = line.trim().endsWith('.');
              if (isLast && hasPeriod) {
                const body = line.replace(/\.$/, '');
                return (
                  <View key={i} style={styles.heroRow}>
                    <Text style={styles.heroText}>{body}</Text>
                    <Text style={styles.heroPeriod}>.</Text>
                  </View>
                );
              }
              return (
                <Text key={i} style={styles.heroText}>
                  {line}
                </Text>
              );
            })}
          </View>
        </View>

        {/* Children: form / buttons */}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WEROL_TOKENS.pitch,
  },
  decorBg: {
    position: 'absolute',
    top: '6%',
    left: -30,
    right: -30,
    fontFamily: FONTS.archivo,
    fontSize: 460,
    lineHeight: 460,
    letterSpacing: -24,
    color: WEROL_TOKENS.paper,
    opacity: 0.06,
    textAlign: 'center',
    pointerEvents: 'none',
  },
  scroll: {
    paddingHorizontal: SPACING.section,
    minHeight: '100%',
  },
  brand: {
    gap: 6,
  },
  tagline: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 10,
    letterSpacing: 4,
    color: WEROL_TOKENS.lime,
    textTransform: 'uppercase',
  },
  spacer: {
    flex: 1,
    minHeight: 80,
  },
  heroBlock: {
    gap: 16,
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: FONTS.jetbrainsMono,
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 3,
    color: WEROL_TOKENS.lime,
    textTransform: 'uppercase',
  },
  heroLines: {
    gap: 0,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  heroText: {
    fontFamily: FONTS.archivo,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -2,
    color: WEROL_TOKENS.paper,
  },
  heroPeriod: {
    fontFamily: FONTS.archivo,
    fontSize: 44,
    lineHeight: 48,
    color: WEROL_TOKENS.lime,
  },
  body: {
    gap: 14,
    paddingTop: 12,
  },
});
