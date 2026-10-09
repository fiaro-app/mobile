import { View } from 'react-native';
import { PinDot } from '@/components/atoms/PinDot';
import { PIN_LENGTH } from '@/lib/pin';

/**
 * Indicador de los 4 dígitos del PIN. No dice cuántos dígitos hay a los lectores de pantalla más
 * que como valor del grupo (`accessibilityValue`), para no anunciar cada punto por separado.
 */
export function PinDots({ length, error }: Readonly<{ length: number; error: boolean }>) {
  return (
    <View
      accessible
      accessibilityLabel="PIN"
      accessibilityValue={{ text: `${String(length)} de ${String(PIN_LENGTH)} dígitos` }}
      className="flex-row justify-center gap-4"
    >
      {Array.from({ length: PIN_LENGTH }, (_, index) => (
        <PinDot key={index} filled={index < length} error={error} />
      ))}
    </View>
  );
}
