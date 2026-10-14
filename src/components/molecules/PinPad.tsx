import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { PinKey } from '@/components/atoms/PinKey';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

export interface PinPadProps {
  readonly onDigit: (digit: string) => void;
  readonly onBackspace: () => void;
  /** Si se pasa, la esquina inferior izquierda muestra la huella; si no, queda vacía. */
  readonly onBiometrics?: () => void;
  readonly disabled?: boolean;
}

function IconKey({ icon, label, onPress }: Readonly<{ icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="h-[72px] flex-1 items-center justify-center rounded-md active:bg-surface-3"
    >
      <Ionicons name={icon} size={28} color="#1C1B2E" />
    </Pressable>
  );
}

/**
 * Teclado numérico del PIN: cuadrícula 3×4 con huella, 0 y borrar en la última fila, como en el
 * diseño. Solo dibuja y avisa: acumular dígitos y verificarlos es lógica de `usePinEntry`.
 */
export function PinPad({ onDigit, onBackspace, onBiometrics, disabled = false }: Readonly<PinPadProps>) {
  return (
    <View className="w-full">
      {ROWS.map((row) => (
        <View key={row[0]} className="flex-row">
          {row.map((digit) => (
            <PinKey key={digit} digit={digit} onPress={onDigit} disabled={disabled} />
          ))}
        </View>
      ))}
      <View className="flex-row">
        {onBiometrics ? (
          <IconKey icon="finger-print" label="Usar huella" onPress={onBiometrics} />
        ) : (
          <View className="flex-1" />
        )}
        <PinKey digit="0" onPress={onDigit} disabled={disabled} />
        <IconKey icon="backspace-outline" label="Borrar" onPress={onBackspace} />
      </View>
    </View>
  );
}
