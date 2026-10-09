import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextField } from '@/components/atoms/TextField';

export interface AmountRowProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (text: string) => void;
  readonly editable?: boolean;
}

/** Fila "medio de pago + monto": la etiqueta a la izquierda y un campo numérico con `$` a la derecha. */
export function AmountRow({ label, value, onChangeText, editable = true }: Readonly<AmountRowProps>) {
  return (
    <View className="flex-row items-center justify-between gap-4">
      <AppText variant="label">{label}</AppText>
      <View className="w-40 flex-row items-center gap-2">
        <AppText variant="label" tone="muted">
          $
        </AppText>
        <TextField
          accessibilityLabel={label}
          keyboardType="number-pad"
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          className="flex-1 text-right"
        />
      </View>
    </View>
  );
}
