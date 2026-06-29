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
import HangerIcon from '../assets/icons/hanger.svg';
import HomeIcon from '../assets/icons/home.svg';
import UserIcon from '../assets/icons/user.svg';
import { useT, type TKey } from '../i18n';
import { useUiStore } from '../store/uiStore';
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
  Home: { Icon: HomeIcon, labelKey: 'tab.feed' },        // HOME — main feed
  Outfit: { Icon: HangerIcon, labelKey: 'tab.outfit' },  // FITS — community outfits
  Fit: { Icon: AddIcon, labelKey: 'tab.fit' },           // FIT — outfit builder
  Profile: { Icon: UserIcon, labelKey: 'tab.profile' },  // ME — profile
};

// Saved + Inbox were removed from the bar (reached elsewhere).
const TAB_ORDER = ['Home', 'Outfit', 'Fit', 'Profile'];

export function BottomNav({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const chromeHidden = useUiStore((s) => s.chromeHidden);
  const t = useT();

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
          const color = isFocused ? WEROL_TOKENS.lime : WEROL_TOKENS.muted;
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
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
              onPress={onPress}
              style={styles.tab}
            >
              <Icon width={23} height={23} stroke={color} strokeWidth={1.8} fill="none" />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {t(meta.labelKey)}
              </Text>
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
    backgroundColor: 'rgba(16,16,20,0.94)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: WEROL_TOKENS.line2,
    paddingVertical: 10,
    paddingHorizontal: 8,
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
    gap: 5,
    paddingVertical: 2,
  },
  label: {
    fontFamily: FONTS.spaceGroteskBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
});
