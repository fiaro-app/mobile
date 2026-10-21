import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextLink } from '@/components/atoms/TextLink';

export interface AlertBannerProps {
  readonly message: string;
  readonly kind?: 'warning' | 'error';
  /** Una acción bajo el mensaje (por ejemplo «Renovar en la web»); sin ella solo informa. */
  readonly action?: { readonly label: string; readonly onPress: () => void };
}

/** Aviso del Resumen ("3 cobradores aún no han iniciado su ruta hoy."): ámbar por defecto (informa sin ser un error) o rojo (`error`, modo de solo lectura). Puede llevar una acción. */
export function AlertBanner({ message, kind = 'warning', action }: Readonly<AlertBannerProps>) {
  return (
    <View accessibilityRole="alert" className={kind === 'error' ? 'gap-2 rounded-md bg-destructive/10 px-4 py-3' : 'gap-2 rounded-md bg-warning/15 px-4 py-3'}>
      <AppText variant="label" className={kind === 'error' ? 'text-destructive' : 'text-warning'}>
        {message}
      </AppText>
      {action ? <TextLink label={action.label} onPress={action.onPress} className="self-start" /> : null}
    </View>
  );
}
