import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

/** Aviso del Resumen ("3 cobradores aún no han iniciado su ruta hoy."): ámbar por defecto (informa sin ser un error) o rojo (`error`, modo de solo lectura). */
export function AlertBanner({ message, kind = 'warning' }: Readonly<{ message: string; kind?: 'warning' | 'error' }>) {
  return (
    <View accessibilityRole="alert" className={kind === 'error' ? 'rounded-md bg-destructive/10 px-4 py-3' : 'rounded-md bg-warning/15 px-4 py-3'}>
      <AppText variant="label" className={kind === 'error' ? 'text-destructive' : 'text-warning'}>
        {message}
      </AppText>
    </View>
  );
}
