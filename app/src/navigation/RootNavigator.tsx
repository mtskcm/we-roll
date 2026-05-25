import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { FeedScreen } from '../screens/FeedScreen';
import { FitScreen } from '../screens/FitScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { OutfitBuilderScreen } from '../screens/OutfitBuilderScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { useSettingsStore } from '../store/settingsStore';
import { useUserStore } from '../store/userStore';
import { useColors } from '../theme/useColors';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

function AuthFlow() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0C' },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen
            onSignIn={() => navigation.navigate('SignIn')}
            onSignUp={() => navigation.navigate('SignUp')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="SignIn">
        {({ navigation }) => (
          <SignInScreen
            onBack={() => navigation.goBack()}
            onSignUp={() => navigation.replace('SignUp')}
          />
        )}
      </AuthStack.Screen>
      <AuthStack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            onSignIn={() => navigation.replace('SignIn')}
          />
        )}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

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
        <AuthFlow />
      ) : (
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <BottomNav {...props} />}
        >
          <Tab.Screen name="Home" component={FeedScreen} />
          <Tab.Screen name="Outfit" component={OutfitBuilderScreen} />
          <Tab.Screen name="Fit" component={FitScreen} />
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
