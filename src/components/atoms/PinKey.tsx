import { Pressable } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface PinKeyProps {
  readonly digit: string;
  readonly onPress: (digit: string) => void;
  readonly disabled?: boolean;
}

/**
 * Tecla numérica del teclado de PIN. 72 px de alto: más grande que el mínimo táctil (44 px)
 * porque se usa con una mano, de pie y a veces con guantes o sol de frente. Presionada se atenúa.
 */
export function PinKey({ digit, onPress, disabled = false }: Readonly<PinKeyProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={digit}
      disabled={disabled}
      onPress={() => {
        onPress(digit);
      }}
      className="h-[72px] flex-1 items-center justify-center rounded-md active:bg-surface-3"
    >
      <AppText variant="pin">{digit}</AppText>
    </Pressable>
  );
}
