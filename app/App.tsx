import 'react-native-gesture-handler';
import {
  Archivo_400Regular,
  Archivo_500Medium,
  Archivo_800ExtraBold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShareSheet } from './src/components/ShareSheet';
import { Toast } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { useShareStore } from './src/store/shareStore';
import { useLiveMessages } from './src/store/useLiveMessages';

function AppShell() {
  useLiveMessages();
  const [splashDone, setSplashDone] = React.useState(false);
  const product = useShareStore((s) => s.product);
  const closeShare = useShareStore((s) => s.closeShare);
  const showToast = useShareStore((s) => s.showToast);
  const toastMessage = useShareStore((s) => s.toastMessage);
  const hideToast = useShareStore((s) => s.hideToast);

  return (
    <>
      <RootNavigator />
      <ShareSheet product={product} onClose={closeShare} onSent={showToast} />
      <Toast visible={!!toastMessage} message={toastMessage ?? ''} onHide={hideToast} />
      {!splashDone && <SplashScreen onFinish={() => setSplashDone(true)} />}
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({
    // Display
    Archivo_400Regular,
    Archivo_500Medium,
    Archivo_800ExtraBold,
    Archivo_900Black,
    // Body
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Technical
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
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
