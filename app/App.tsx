import 'react-native-gesture-handler';
import { Archivo_900Black } from '@expo-google-fonts/archivo';
import { CactusClassicalSerif_400Regular } from '@expo-google-fonts/cactus-classical-serif';
import { JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
import { ProstoOne_400Regular } from '@expo-google-fonts/prosto-one';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
      <Toast visible={!!toastMessage} message={toastMessage ?? ''} onHide={hideToast} />
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({
    // Brand — Manrope, the single family (UI kit Edition 03)
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    // Product name + price (serif accent) and buttons (Prosto One)
    CactusClassicalSerif_400Regular,
    ProstoOne_400Regular,
    // Splash-only brand moment (original launch logo look)
    Archivo_900Black,
    JetBrainsMono_700Bold,
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" translucent />
        <AppShell />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
