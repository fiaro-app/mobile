import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppShell } from '@/providers/AppShell';
import { queryClient } from '@/providers/query-client';
import { FONT_SOURCES } from '@/lib/theme/fonts';

void SplashScreen.preventAutoHideAsync();

/** Raíz de la app: proveedores globales y la puerta de entrada (`AppShell`). No decide pantallas. */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_SOURCES);
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppShell fontsLoaded={fontsLoaded || fontError !== null} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
