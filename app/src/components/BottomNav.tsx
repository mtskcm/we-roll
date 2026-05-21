import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT, type TKey } from '../i18n';
import { COLORS } from '../theme/colors';
import { SPACING } from '../theme/spacing';
import { TEXT_STYLES } from '../theme/typography';
import { useUnreadCount } from '../store/messagesStore';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconName; inactive: IconName; labelKey: TKey }> = {
  Home: { active: 'home', inactive: 'home-outline', labelKey: 'tab.feed' },
  Outfit: { active: 'shirt', inactive: 'shirt-outline', labelKey: 'tab.outfit' },
  Saved: { active: 'bookmark', inactive: 'bookmark-outline', labelKey: 'tab.saved' },
  Messages: {
    active: 'notifications',
    inactive: 'notifications-outline',
    labelKey: 'tab.notifications',
  },
  Profile: { active: 'person', inactive: 'person-outline', labelKey: 'tab.profile' },
};

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const unread = useUnreadCount();
  const t = useT();

  // Hide search route from tab bar entirely
  const visibleRoutes = state.routes.filter((r) => r.name !== 'Search');

  return (
    <View style={[styles.root, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {visibleRoutes.map((route) => {
        const index = state.routes.findIndex((r) => r.key === route.key);
        const isFocused = state.index === index;
        const meta = ICONS[route.name] ?? ICONS.Home;
        const color = isFocused ? COLORS.teal : COLORS.dim;
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
              <Ionicons
                name={isFocused ? meta.active : meta.inactive}
                size={22}
                color={color}
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
    backgroundColor: COLORS.ink2,
    borderTopWidth: 1,
    borderTopColor: COLORS.ink3,
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
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
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: COLORS.ink2,
  },
  badgeText: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 12,
  },
});
