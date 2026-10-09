import { View } from 'react-native';
import { cn } from '@/lib/cn';

export interface PinDotProps {
  readonly filled: boolean;
  readonly error: boolean;
}

/**
 * Un círculo del indicador de PIN: vacío (borde en tinta), lleno (relleno en tinta) o, tras un PIN
 * incorrecto, relleno en rojo (diseño "Login PIN — Error"). 16 px, como en el diseño.
 */
export function PinDot({ filled, error }: Readonly<PinDotProps>) {
  let color = 'border-foreground';
  if (error) color = 'border-destructive bg-destructive';
  else if (filled) color = 'border-foreground bg-foreground';
  return <View className={cn('size-4 rounded-full border-[1.5px]', color)} />;
}
