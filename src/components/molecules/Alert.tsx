import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/**
 * Mensaje de error en línea (el de "Teléfono o contraseña incorrectos."): fondo rojo al 10 %,
 * texto rojo, esquinas de 12 px. Se anuncia de inmediato a los lectores de pantalla porque aparece
 * como respuesta a una acción de la persona.
 */
export function Alert({ message }: Readonly<{ message: string }>) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" className="rounded-md bg-destructive/10 px-4 py-3">
      <AppText variant="label" tone="destructive" className="text-body">
        {message}
      </AppText>
    </View>
  );
}
