import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/** Aviso ámbar del Resumen ("3 cobradores aún no han iniciado su ruta hoy."): informa sin ser un error. */
export function AlertBanner({ message }: Readonly<{ message: string }>) {
  return (
    <View accessibilityRole="alert" className="rounded-md bg-warning/15 px-4 py-3">
      <AppText variant="label" className="text-warning">
        {message}
      </AppText>
    </View>
  );
}
