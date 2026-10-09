import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/**
 * Franja ámbar con el aviso de visitas guardadas en el teléfono que todavía no llegaron al servidor
 * ("2 visitas pendientes de sincronizar"). Por ahora ninguna pantalla la usa: depende de la cola de
 * visitas sin conexión, que llega con "Registrar visita".
 */
export function SyncBanner({ message }: Readonly<{ message: string }>) {
  return (
    <View accessibilityRole="alert" className="bg-warning/10 px-5 py-2.5">
      <AppText variant="caption" className="text-warning">
        {message}
      </AppText>
    </View>
  );
}
