import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Esqueleto de las pantallas de estado: una sola tarjeta centrada con 24 px de margen lateral. */
export function CenteredTemplate({ children }: Readonly<{ children: ReactNode }>) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 items-center justify-center bg-background px-6"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  );
}
