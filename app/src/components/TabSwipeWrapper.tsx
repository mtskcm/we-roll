// TabSwipeWrapper — wraps a tab screen with a horizontal-pan gesture that
// navigates to the previous / next tab in TAB_ORDER. The gesture only
// activates after a meaningful horizontal motion (25px) and fails if the
// user starts scrolling vertically first — so it plays nice with FlatList /
// ScrollView children.

import { useNavigation, useNavigationState } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

// Must match the visible bottom-bar tabs (BottomNav). Saved + Messages were
// removed from the bar, so they're not swipeable between either.
const TAB_ORDER = ['Home', 'Outfit', 'Fit', 'Profile'];
const VELOCITY_THRESHOLD = 400;
const TRANSLATION_THRESHOLD = 60;

type Props = { children: React.ReactNode };

export function TabSwipeWrapper({ children }: Props) {
  const navigation = useNavigation<any>();
  const currentRouteName = useNavigationState((state) => {
    // Find which top-level tab is currently active.
    const route = state.routes[state.index];
    return route?.name;
  });

  const goToTab = (name: string) => navigation.navigate(name);

  const onSwipe = (translationX: number, velocityX: number) => {
    const goLeft = translationX < -TRANSLATION_THRESHOLD || velocityX < -VELOCITY_THRESHOLD;
    const goRight = translationX > TRANSLATION_THRESHOLD || velocityX > VELOCITY_THRESHOLD;
    if (!goLeft && !goRight) return;
    const idx = TAB_ORDER.indexOf(currentRouteName ?? '');
    if (idx < 0) return;
    const nextIdx = goLeft ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= TAB_ORDER.length) return;
    goToTab(TAB_ORDER[nextIdx]);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-25, 25])
    .failOffsetY([-15, 15])
    .onEnd((event) => {
      runOnJS(onSwipe)(event.translationX, event.velocityX);
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
