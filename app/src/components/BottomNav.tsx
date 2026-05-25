import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BellIcon from '../assets/icons/bell.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HangerIcon from '../assets/icons/hanger.svg';
import HeartIcon from '../assets/icons/heart.svg';
import TrendIcon from '../assets/icons/trend.svg';
import { useT, type TKey } from '../i18n';
import { useUnreadCount } from '../store/messagesStore';
import { WEROL_TOKENS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { FONTS, TEXT_STYLES } from '../theme/typography';

type IconComponent = React.FC<{
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}>;

const ICONS: Record<string, { Icon: IconComponent; labelKey: TKey }> = {
  Home: { Icon: HeartIcon, labelKey: 'tab.feed' },
  Outfit: { Icon: HangerIcon, labelKey: 'tab.outfit' },
  Fit: { Icon: TrendIcon, labelKey: 'tab.fit' },
  Saved: { Icon: BookmarkIcon, labelKey: 'tab.saved' },
  Messages: { Icon: BellIcon, labelKey: 'tab.notifications' },
  Profile: { Icon: TrendIcon, labelKey: 'tab.profile' }, // TODO real ME icon
};

const TAB_ORDER = ['Home', 'Outfit', 'Fit', 'Saved', 'Messages', 'Profile'];

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  const t = useT();

  // Hide Search route from tab bar; preserve order per TAB_ORDER
  const orderedRoutes = TAB_ORDER
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {orderedRoutes.map((route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === index;
        const meta = ICONS[route.name] ?? ICONS.Home;
        const color = isFocused ? WEROL_TOKENS.lime : WEROL_TOKENS.muted2;
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
            <View style={styles.iconWrap}>
              <Icon
                width={20}
                height={20}
                stroke={color}
                strokeWidth={1.8}
                fill={isFocused ? color : 'none'}
              />
              {route.name === 'Messages' && unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
            <Text style={[TEXT_STYLES.navLabel, { color }]}>{t(meta.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    backgroundColor: WEROL_TOKENS.pitch,
    borderTopWidth: 1,
    borderTopColor: WEROL_TOKENS.line,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: WEROL_TOKENS.lime,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: WEROL_TOKENS.pitch,
  },
  badgeText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 10,
    color: WEROL_TOKENS.pitch,
    lineHeight: 12,
  },
});
