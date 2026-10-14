import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Esqueleto de las pantallas de PIN: contenido centrado en columna, sin scroll (el teclado ocupa la pantalla). */
export function PinTemplate({ children }: Readonly<{ children: ReactNode }>) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 items-center bg-background px-6" style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16 }}>
      {children}
    </View>
  );
}
