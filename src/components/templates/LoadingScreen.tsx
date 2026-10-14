import { ActivityIndicator, View } from 'react-native';

/** Pantalla de espera a pantalla completa (mientras se averiguan los roles de la persona). */
export function LoadingScreen() {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Cargando" className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color="#3B3382" />
    </View>
  );
}
