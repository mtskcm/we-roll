import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import BellIcon from '../assets/icons/bell.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HangerIcon from '../assets/icons/hanger.svg';
import HomeIcon from '../assets/icons/home.svg';
import UserIcon from '../assets/icons/user.svg';
import { useT, type TKey } from '../i18n';
import { useUnreadCount } from '../store/messagesStore';
import { useUiStore } from '../store/uiStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS } from '../theme/typography';

type IconComponent = React.FC<{
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}>;

const ICONS: Record<string, { Icon: IconComponent; labelKey: TKey }> = {
  Home: { Icon: HomeIcon, labelKey: 'tab.feed' },
  Outfit: { Icon: HangerIcon, labelKey: 'tab.outfit' },     // FITS — other people's outfits
  Fit: { Icon: AddIcon, labelKey: 'tab.fit' },              // FIT — outfit builder
  Saved: { Icon: BookmarkIcon, labelKey: 'tab.saved' },
  Messages: { Icon: BellIcon, labelKey: 'tab.notifications' },
  Profile: { Icon: UserIcon, labelKey: 'tab.profile' },
};

const TAB_ORDER = ['Home', 'Outfit', 'Fit', 'Saved', 'Messages', 'Profile'];

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  const t = useT();
  const chromeHidden = useUiStore((s) => s.chromeHidden);

  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withTiming(chromeHidden ? 130 : 0, {
      duration: chromeHidden ? 360 : 420,
      easing: chromeHidden ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
    });
  }, [chromeHidden, translateY]);

  const hideStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.min(1, translateY.value / 130),
  }));

  const orderedRoutes = TAB_ORDER
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <Animated.View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }, hideStyle]}>
      {orderedRoutes.map((route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === index;
        const meta = ICONS[route.name] ?? ICONS.Home;
        const iconColor = isFocused ? WEROL_TOKENS.pitch : WEROL_TOKENS.muted2;
        const labelColor = isFocused ? WEROL_TOKENS.pitch : WEROL_TOKENS.muted2;
        const { options } = descriptors[route.key];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const { Icon } = meta;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
            onPress={onPress}
            style={styles.tab}
          >
            <View
              style={[
                styles.tabInner,
                isFocused && styles.tabInnerActive,
              ]}
            >
              <View style={styles.iconWrap}>
                <Icon
                  width={19}
                  height={19}
                  stroke={iconColor}
                  strokeWidth={1.8}
                  fill="none"
                />
                {route.name === 'Messages' && unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.label, { color: labelColor }]}>
                {t(meta.labelKey)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
    paddingTop: SPACING.md,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabInner: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tabInnerActive: {
    backgroundColor: WEROL_TOKENS.lime,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: WEROL_TOKENS.pitch,
  },
  badgeText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    color: WEROL_TOKENS.paper,
    lineHeight: 11,
  },
});
