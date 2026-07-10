// Sheet — the ONE bottom sheet (Edition 03). Scrim + surface2 panel with
// radius-26 top corners, 44×5 handle, optional centred title. Replaces the
// six bespoke sheet implementations across the app.

import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII, SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Panel height as a fraction of the window (default 0.6). Omit for auto height. */
  heightFraction?: number;
  /** Wrap content in KeyboardAvoidingView (sheets with text inputs). */
  avoidKeyboard?: boolean;
  children: React.ReactNode;
};

export function Sheet({ visible, onClose, title, heightFraction, avoidKeyboard, children }: Props) {
  const { height: winHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const panel = (
    <Animated.View
      entering={SlideInDown.duration(260)}
      exiting={SlideOutDown.duration(200)}
      style={[
        styles.sheet,
        { paddingBottom: Math.max(insets.bottom, 16) },
        heightFraction ? { height: Math.round(winHeight * heightFraction) } : null,
      ]}
    >
      <View style={styles.handle} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </Animated.View>
  );

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.avoider}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
          {panel}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.avoider} pointerEvents="box-none">
          {panel}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: WEROL_TOKENS.scrim },
  avoider: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: WEROL_TOKENS.surface2,
    borderTopLeftRadius: RADII.sheet,
    borderTopRightRadius: RADII.sheet,
    borderTopWidth: 1,
    borderColor: WEROL_TOKENS.line,
    paddingHorizontal: SPACING.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: RADII.pill,
    backgroundColor: '#3A3B40',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontFamily: FONTS.manropeExtraBold,
    fontSize: 19,
    color: WEROL_TOKENS.paper,
    textAlign: 'center',
    marginBottom: 20,
  },
});
