import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { TabSwipeWrapper } from '../components/TabSwipeWrapper';
import { FeedScreen } from '../screens/FeedScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { OutfitBuilderScreen } from '../screens/OutfitBuilderScreen';
import { OutfitDetailScreen } from '../screens/OutfitDetailScreen';
import { OutfitsFeedScreen } from '../screens/OutfitsFeedScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SavedScreen } from '../screens/SavedScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { useSettingsStore } from '../store/settingsStore';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { useColors } from '../theme/useColors';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const OutfitStackNav = createNativeStackNavigator();

function AuthFlow() {
  const showToast = useShareStore((s) => s.showToast);
  const ssoStub = (provider: string) => () =>
    showToast(`${provider} login — coming soon. Use email for now.`);

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
            onAppleSignIn={ssoStub('Apple')}
            onGoogleSignIn={ssoStub('Google')}
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

function HomeStack() {
  return (
    <HomeStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0C' },
        animation: 'slide_from_right',
      }}
    >
      <HomeStackNav.Screen name="Feed" component={FeedScreen} />
      <HomeStackNav.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </HomeStackNav.Navigator>
  );
}

function OutfitStack() {
  return (
    <OutfitStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0C' },
        animation: 'slide_from_right',
      }}
    >
      <OutfitStackNav.Screen name="OutfitsFeed" component={OutfitsFeedScreen} />
      <OutfitStackNav.Screen name="OutfitDetail" component={OutfitDetailScreen} />
      <OutfitStackNav.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </OutfitStackNav.Navigator>
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
          <Tab.Screen name="Home">
            {() => <TabSwipeWrapper><HomeStack /></TabSwipeWrapper>}
          </Tab.Screen>
          <Tab.Screen name="Outfit">
            {() => <TabSwipeWrapper><OutfitStack /></TabSwipeWrapper>}
          </Tab.Screen>
          <Tab.Screen name="Fit">
            {() => <TabSwipeWrapper><OutfitBuilderScreen /></TabSwipeWrapper>}
          </Tab.Screen>
          <Tab.Screen name="Saved">
            {() => <TabSwipeWrapper><SavedScreen /></TabSwipeWrapper>}
          </Tab.Screen>
          <Tab.Screen name="Messages">
            {() => <TabSwipeWrapper><MessagesScreen /></TabSwipeWrapper>}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {() => <TabSwipeWrapper><ProfileScreen /></TabSwipeWrapper>}
          </Tab.Screen>
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
