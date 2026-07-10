import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BottomNav } from '../components/BottomNav';
import { DiscoverScreen } from '../screens/DiscoverScreen';
import { FeedScreen } from '../screens/FeedScreen';
import { MessagesScreen } from '../screens/MessagesScreen';
import { FigureBuilderScreen } from '../screens/FigureBuilderScreen';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { SignInScreen } from '../screens/auth/SignInScreen';
import { SignUpScreen } from '../screens/auth/SignUpScreen';
import { WelcomeScreen } from '../screens/auth/WelcomeScreen';
import { OnboardingFlow } from '../screens/onboarding/OnboardingFlow';
import { useShareStore } from '../store/shareStore';
import { useUserStore } from '../store/userStore';
import { WEROL_TOKENS } from '../theme/colors';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStackNav = createNativeStackNavigator();
const DiscoverStackNav = createNativeStackNavigator();

function AuthFlow() {
  const showToast = useShareStore((s) => s.showToast);
  const signInWithGoogle = useUserStore((s) => s.signInWithGoogle);
  const ssoStub = (provider: string) => () =>
    showToast(`${provider} login — coming soon. Use email for now.`);
  const handleGoogle = async () => {
    const { error } = await signInWithGoogle();
    if (error) showToast('Google: ' + error);
  };

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: WEROL_TOKENS.pitch },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Welcome">
        {({ navigation }) => (
          <WelcomeScreen
            onSignIn={() => navigation.navigate('SignIn')}
            onSignUp={() => navigation.navigate('SignUp')}
            onAppleSignIn={ssoStub('Apple')}
            onGoogleSignIn={handleGoogle}
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
        contentStyle: { backgroundColor: WEROL_TOKENS.pitch },
        animation: 'slide_from_right',
      }}
    >
      <HomeStackNav.Screen name="Feed" component={FeedScreen} />
      <HomeStackNav.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </HomeStackNav.Navigator>
  );
}

function DiscoverStack() {
  return (
    <DiscoverStackNav.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: WEROL_TOKENS.pitch },
        animation: 'slide_from_right',
      }}
    >
      <DiscoverStackNav.Screen name="DiscoverHome" component={DiscoverScreen} />
      <DiscoverStackNav.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </DiscoverStackNav.Navigator>
  );
}

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: WEROL_TOKENS.pitch,
    card: WEROL_TOKENS.concrete,
    text: WEROL_TOKENS.paper,
    primary: WEROL_TOKENS.lime,
    border: WEROL_TOKENS.line,
  },
};

export function RootNavigator() {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const authReady = useUserStore((s) => s.authReady);
  const needsOnboarding = useUserStore((s) => s.needsOnboarding);

  // Until the stored session is restored, render nothing (the splash overlay
  // covers this) — prevents the Welcome screen flashing for signed-in users.
  if (!authReady) return null;

  return (
    <NavigationContainer theme={navTheme}>
      {!isAuthenticated ? (
        <AuthFlow />
      ) : needsOnboarding ? (
        <OnboardingFlow />
      ) : (
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <BottomNav {...props} />}
        >
          {/* No swipe-between-tabs gesture — tab bar taps only (design decision) */}
          <Tab.Screen name="Home" component={HomeStack} />
          <Tab.Screen name="Discover" component={DiscoverStack} />
          <Tab.Screen name="Fit" component={FigureBuilderScreen} />
          <Tab.Screen name="Messages" component={MessagesScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      )}
    </NavigationContainer>
  );
}
