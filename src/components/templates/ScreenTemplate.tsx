import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Esqueleto de las pantallas con barra superior: fondo del diseño y la barra arriba. El contenido
 * ocupa el resto. La zona segura de arriba la resuelve `TopBar`; la de abajo, cada lista con su
 * propio relleno, porque una lista debe poder desplazarse por debajo de la barra de gestos.
 */
export function ScreenTemplate({ topBar, children }: Readonly<{ topBar: ReactNode; children: ReactNode }>) {
  return (
    <View className="flex-1 bg-background">
      {topBar}
      <View className="flex-1">{children}</View>
    </View>
  );
}
