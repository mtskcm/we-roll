import 'react-native-gesture-handler';
import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShareSheet } from './src/components/ShareSheet';
import { Toast } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useShareStore } from './src/store/shareStore';
import { useLiveMessages } from './src/store/useLiveMessages';

function AppShell() {
  useLiveMessages();
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
    </>
  );
}

export default function App() {
  const [loaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
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
