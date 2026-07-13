// BottomNav — UI kit tab bar (Edition 03): floating surface1 card, radius 26,
// icon-only tabs (2.5 stroke), volt = active. Hides while scrolling the feed
// (chromeHidden) and in long-press zen mode.

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddIcon from '../assets/icons/add.svg';
import HomeIcon from '../assets/icons/home.svg';
import SearchIcon from '../assets/icons/search.svg';
import UserIcon from '../assets/icons/user.svg';
import { useUiStore } from '../store/uiStore';
import { WEROL_TOKENS } from '../theme/colors';
import { RADII } from '../theme/spacing';

type IconComponent = React.FC<{
  width?: number;
  height?: number;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
}>;

const ICONS: Record<string, { Icon: IconComponent; label: string }> = {
  Home: { Icon: HomeIcon, label: 'Home' },            // HOME — main feed
  Discover: { Icon: SearchIcon, label: 'Discover' },  // DISCOVER — catalog grid
  Fit: { Icon: AddIcon, label: 'Create' },            // CREATE — outfit builder
  Profile: { Icon: UserIcon, label: 'Profile' },
};

// Home · Discover · Create · Profile (FITS removed per design).
const TAB_ORDER = ['Home', 'Discover', 'Fit', 'Profile'];

const INACTIVE = '#8A8B90';

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const chromeHidden = useUiStore((s) => s.chromeHidden);

  const orderedRoutes = TAB_ORDER
    .map((name) => state.routes.find((r) => r.name === name))
    .filter((r): r is NonNullable<typeof r> => !!r);

  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withTiming(chromeHidden ? 120 : 0, {
      duration: chromeHidden ? 280 : 360,
      easing: chromeHidden ? Easing.in(Easing.cubic) : Easing.out(Easing.cubic),
    });
  }, [chromeHidden, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1 - Math.min(1, translateY.value / 120) * 0.85,
  }));

  // Hide the bar on detail screens nested inside a tab (e.g. ProductDetails)
  // so they can use their own sticky bottom bar.
  const activeTab = state.routes[state.index] as { state?: { index?: number; routes?: { name: string }[] } };
  const nested = activeTab.state;
  const nestedRoute = nested?.routes?.[nested.index ?? 0]?.name;
  if (nestedRoute === 'ProductDetails') return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <Animated.View style={[styles.bar, animatedStyle]}>
        {orderedRoutes.map((route) => {
          const index = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === index;
          const meta = ICONS[route.name] ?? ICONS.Home;
          const color = isFocused ? WEROL_TOKENS.lime : INACTIVE;
          const { options } = descriptors[route.key];
          const { Icon } = meta;

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
              accessibilityLabel={options.tabBarAccessibilityLabel ?? meta.label}
              onPress={onPress}
              style={styles.tab}
            >
              <Icon width={26} height={26} stroke={color} strokeWidth={2.5} fill="none" />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: WEROL_TOKENS.concrete,
    borderRadius: RADII.sheet,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line,
    paddingVertical: 17,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
