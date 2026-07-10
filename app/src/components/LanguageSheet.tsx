import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '../i18n';
import { useSettingsStore, type Language } from '../store/settingsStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const OPTIONS: { key: Language; flag: string; labelKey: 'lang.sk' | 'lang.en' }[] = [
  { key: 'sk', flag: '🇸🇰', labelKey: 'lang.sk' },
  { key: 'en', flag: '🇬🇧', labelKey: 'lang.en' },
];

export function LanguageSheet({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const backdropOpacity = useSharedValue(0);
  const sheetTranslate = useSharedValue(400);

  // Keep the Modal mounted while the exit animation plays — unmounting the
  // moment `visible` flips false would cut the slide-out short.
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      backdropOpacity.value = withTiming(1, { duration: 220 });
      sheetTranslate.value = withTiming(0, {
        duration: 280,
        easing: Easing.out(Easing.cubic),
      });
      return undefined;
    }
    backdropOpacity.value = withTiming(0, { duration: 180 });
    sheetTranslate.value = withTiming(400, { duration: 220 });
    const timer = setTimeout(() => setRendered(false), 240);
    return () => clearTimeout(timer);
  }, [visible, backdropOpacity, sheetTranslate]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslate.value }],
  }));

  const handlePick = (lang: Language) => {
    setLanguage(lang);
    onClose();
  };

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[styles.sheet, sheetStyle, { paddingBottom: insets.bottom + SPACING.lg }]}
        >
          <View style={styles.grabber} />
          <Text style={styles.title}>{t('lang.title')}</Text>
          <View style={styles.list}>
            {OPTIONS.map((opt) => {
              const active = language === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => handlePick(opt.key)}
                  style={({ pressed }) => [
                    styles.row,
                    active && styles.rowActive,
                    pressed && styles.rowPressed,
                  ]}
                >
                  <Text style={styles.flag}>{opt.flag}</Text>
                  <Text style={[styles.label, active && { color: WEROL_TOKENS.paper }]}>
                    {t(opt.labelKey)}
                  </Text>
                  {active && <Ionicons name="checkmark" size={20} color={WEROL_TOKENS.lime} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WEROL_TOKENS.concrete,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: WEROL_TOKENS.line2,
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.archivoBold,
    fontSize: 24,
    color: WEROL_TOKENS.paper,
    letterSpacing: -0.3,
  },
  list: {
    gap: SPACING.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    backgroundColor: WEROL_TOKENS.line,
    borderRadius: RADII.md,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowActive: {
    borderColor: WEROL_TOKENS.lime,
  },
  rowPressed: {
    opacity: 0.7,
  },
  flag: {
    fontSize: 22,
  },
  label: {
    flex: 1,
    fontFamily: FONTS.archivoSemibold,
    fontSize: 15,
    color: WEROL_TOKENS.muted,
  },
});
