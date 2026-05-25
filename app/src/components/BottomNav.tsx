import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import BellIcon from '../assets/icons/bell.svg';
import BookmarkIcon from '../assets/icons/bookmark.svg';
import HangerIcon from '../assets/icons/hanger.svg';
import HomeIcon from '../assets/icons/home.svg';
import UserIcon from '../assets/icons/user.svg';
import { useT, type TKey } from '../i18n';
import { useUnreadCount } from '../store/messagesStore';
import { WEROL_TOKENS } from '../theme/colors';
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

  const orderedRoutes = TAB_ORDER
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View style={styles.pill}>
        {orderedRoutes.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const meta = ICONS[route.name] ?? ICONS.Home;
          const iconColor = isFocused ? WEROL_TOKENS.pitch : WEROL_TOKENS.muted;
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
                    width={20}
                    height={20}
                    stroke={iconColor}
                    strokeWidth={1.8}
                    fill="none"
                  />
                  {route.name === 'Messages' && unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {unread > 9 ? '9+' : unread}
                      </Text>
                    </View>
                  )}
                </View>
                {isFocused && (
                  <Text style={styles.label} numberOfLines={1}>
                    {t(meta.labelKey)}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,16,20,0.94)',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    paddingHorizontal: 6,
    paddingVertical: 6,
    gap: 2,
    // soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9999,
    minWidth: 44,
    justifyContent: 'center',
  },
  tabInnerActive: {
    backgroundColor: WEROL_TOKENS.lime,
    paddingHorizontal: 14,
  },
  iconWrap: {
    position: 'relative',
  },
  label: {
    fontFamily: FONTS.archivoBold,
    fontSize: 11,
    letterSpacing: 0.4,
    color: WEROL_TOKENS.pitch,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E63946',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: 'rgba(16,16,20,1)',
  },
  badgeText: {
    fontFamily: FONTS.jetbrainsMonoBold,
    fontSize: 9,
    color: WEROL_TOKENS.paper,
    lineHeight: 11,
  },
});
