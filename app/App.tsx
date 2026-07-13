import 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import WordmarkOnDark from './src/assets/logos/wordmark-on-dark.svg';
import { SaveToCollectionSheet } from './src/components/SaveToCollectionSheet';
import { Toast } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { useProductsStore } from './src/store/productsStore';
import { useShareStore } from './src/store/shareStore';
import { useUserStore } from './src/store/userStore';
import { useLiveMessages } from './src/store/useLiveMessages';

function AppShell() {
  useLiveMessages();
  const [splashDone, setSplashDone] = React.useState(false);

  // Pull real products from Supabase on launch (falls back to mock if empty/offline),
  // and restore the auth session (sets isAuthenticated from the Supabase session).
  React.useEffect(() => {
    useProductsStore.getState().hydrate();
    useUserStore.getState().bootstrap();
  }, []);

  const toastMessage = useShareStore((s) => s.toastMessage);
  const hideToast = useShareStore((s) => s.hideToast);

  return (
    <>
      <RootNavigator />
      <SaveToCollectionSheet />
      <Toast visible={!!toastMessage} message={toastMessage ?? ''} onHide={hideToast} />
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
    </>
  );
}

// Shown INSTANTLY while fonts load — SVG needs no fonts, so instead of a black
// screen the user sees the brand immediately (the animated splash follows).
function BootSplash() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
      <WordmarkOnDark width={148} height={26} />
    </View>
  );
}

export default function App() {
  const [loaded, fontError] = useFonts({
    // Display — Archivo (headings, prices, big numbers, buttons)
    'Archivo-Regular': require('./src/assets/fonts/Archivo-Regular.ttf'),
    'Archivo-Medium': require('./src/assets/fonts/Archivo-Medium.ttf'),
    'Archivo-SemiBold': require('./src/assets/fonts/Archivo-SemiBold.ttf'),
    'Archivo-Bold': require('./src/assets/fonts/Archivo-Bold.ttf'),
    'Archivo-ExtraBold': require('./src/assets/fonts/Archivo-ExtraBold.ttf'),
    'Archivo-Black': require('./src/assets/fonts/Archivo-Black.ttf'),
    // Body / UI — Inter
    'Inter-Regular': require('./src/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('./src/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('./src/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('./src/assets/fonts/Inter-Bold.ttf'),
    'Inter-ExtraBold': require('./src/assets/fonts/Inter-ExtraBold.ttf'),
    // Technical labels — JetBrains Mono
    'JetBrainsMono-Medium': require('./src/assets/fonts/JetBrainsMono-Medium.ttf'),
    'JetBrainsMono-Bold': require('./src/assets/fonts/JetBrainsMono-Bold.ttf'),
  });

  // Never hang on black: show the logo while loading, and if a font fails,
  // continue with system fallbacks rather than blocking the whole app.
  if (!loaded && !fontError) return <BootSplash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" translucent />
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
