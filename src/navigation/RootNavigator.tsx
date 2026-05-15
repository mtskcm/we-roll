import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { FeedScreen } from '../screens/FeedScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { OutfitBuilderScreen } from '../screens/OutfitBuilderScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { useColors } from '../theme/useColors';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const themeMode = useSettingsStore((s) => s.theme);
  const C = useColors();

  const navTheme = {
    ...(themeMode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeMode === 'dark' ? DarkTheme : DefaultTheme).colors,
      background: C.ink,
      card: C.ink2,
      text: C.cream,
      primary: C.teal,
      border: C.ink3,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {!isAuthenticated ? (
        <LoginScreen />
      ) : (
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <BottomNav {...props} />}
        >
          <Tab.Screen name="Home" component={FeedScreen} />
          <Tab.Screen name="Outfit" component={OutfitBuilderScreen} />
          <Tab.Screen name="Saved" component={SavedScreen} />
          <Tab.Screen name="Messages" component={MessagesScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
          <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{ tabBarButton: () => null }}
          />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
}
