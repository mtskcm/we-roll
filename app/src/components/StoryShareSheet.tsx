// StoryShareSheet — share my own assembled outfit to IG/Snap/WhatsApp/Copy.
// IG/Snap/WA via deep-link first (instagram-stories://, snapchat://, whatsapp://),
// falling back to the native share sheet if the target app isn't installed.

import React, { useEffect } from 'react';
import {
  Image,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import CloseIcon from '../assets/icons/close.svg';
import InstagramIcon from '../assets/icons/instagram.svg';
import SendIcon from '../assets/icons/send.svg';
import ShareIcon from '../assets/icons/share.svg';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type OutfitPreview = {
  pieceCount: number;
  totalPrice: number;
  currency: string;
  heroImage?: ImageSourcePropType;
};

type Props = {
  visible: boolean;
  outfit: OutfitPreview | null;
  onClose: () => void;
  onCopied?: () => void;
};

const SHARE_URL = 'https://werol.app';

async function tryLinkOrShare(deepLink: string, fallbackMessage: string) {
  try {
    const supported = await Linking.canOpenURL(deepLink);
    if (supported) {
      await Linking.openURL(deepLink);
      return;
    }
  } catch {}
  try {
    await Share.share({ message: fallbackMessage });
  } catch {}
}

export function StoryShareSheet({ visible, outfit, onClose, onCopied }: Props) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(700);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) });
      backdropOpacity.value = withTiming(1, { duration: 220 });
    } else {
      translateY.value = withTiming(700, { duration: 220, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, backdropOpacity]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));

  const summary = outfit
    ? `My FIT · ${outfit.pieceCount} pieces · ${outfit.totalPrice} ${outfit.currency}\n${SHARE_URL}`
    : `Check my fit\n${SHARE_URL}`;

  const handleInstagram = () =>
    tryLinkOrShare('instagram-stories://share?source_application=werol', summary);
  const handleSnapchat = () =>
    tryLinkOrShare('snapchat://creativekit/preview?text=werol', summary);
  const handleWhatsapp = () =>
    tryLinkOrShare(`whatsapp://send?text=${encodeURIComponent(summary)}`, summary);
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(summary);
      onCopied?.();
    } catch {}
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + SPACING.md },
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.headerLabel}>SHARE STORY</Text>
            <Pressable
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <CloseIcon
                width={20}
                height={20}
                stroke={WEROL_TOKENS.paper}
                strokeWidth={1.6}
                fill="none"
              />
            </Pressable>
          </View>

          <View style={styles.preview}>
            {outfit?.heroImage ? (
              <Image source={outfit.heroImage} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={[styles.previewImage, styles.previewPlaceholder]}>
                <Text style={styles.previewPlaceholderText}>YOUR FIT</Text>
              </View>
            )}
            <View style={styles.previewOverlay}>
              <Text style={styles.previewBrand}>
                WEROL<Text style={styles.previewPeriod}>.</Text>
              </Text>
              <Text style={styles.previewTagline}>
                {outfit ? `${outfit.pieceCount} PIECES · ${outfit.totalPrice} ${outfit.currency}` : 'WEAR · ALL'}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <ActionButton
              icon={
                <InstagramIcon
                  width={20}
                  height={20}
                  stroke={WEROL_TOKENS.pitch}
                  strokeWidth={1.6}
                  fill="none"
                />
              }
              label="POST TO INSTAGRAM"
              onPress={handleInstagram}
            />
            <ActionButton
              icon={
                <ShareIcon
                  width={18}
                  height={18}
                  stroke={WEROL_TOKENS.pitch}
                  strokeWidth={1.6}
                  fill="none"
                />
              }
              label="POST TO SNAPCHAT"
              onPress={handleSnapchat}
            />
            <ActionButton
              icon={
                <SendIcon
                  width={18}
                  height={18}
                  stroke={WEROL_TOKENS.pitch}
                  strokeWidth={1.6}
                  fill="none"
                />
              }
              label="WHATSAPP"
              onPress={handleWhatsapp}
            />
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.copyBtn, pressed && { opacity: 0.7 }]}
            >
              <Text style={styles.copyText}>COPY LINK</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.section,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLabel: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    letterSpacing: 2,
    color: WEROL_TOKENS.muted,
  },
  preview: {
    alignSelf: 'center',
    width: 200,
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: WEROL_TOKENS.concrete,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WEROL_TOKENS.concrete,
  },
  previewPlaceholderText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 11,
    letterSpacing: 2.5,
    color: WEROL_TOKENS.muted2,
  },
  previewOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    padding: 8,
    backgroundColor: 'rgba(10,10,12,0.65)',
    borderRadius: 8,
    alignItems: 'center',
  },
  previewBrand: {
    fontFamily: FONTS.archivo,
    fontSize: 22,
    letterSpacing: -1,
    color: WEROL_TOKENS.paper,
  },
  previewPeriod: {
    color: WEROL_TOKENS.lime,
  },
  previewTagline: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 2,
    color: WEROL_TOKENS.lime,
    marginTop: 2,
  },
  actions: {
    gap: 8,
    marginTop: SPACING.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: WEROL_TOKENS.paper,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 9999,
  },
  actionIcon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
    textAlign: 'center',
  },
  copyBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
  },
  copyText: {
    fontFamily: FONTS.archivoBold,
    fontSize: 13,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.paper,
  },
});
