import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface InfoRowProps {
  readonly label: string;
  readonly value: string;
  /** Pinta el valor de rojo (por ejemplo, días de mora). */
  readonly alert?: boolean;
}

/** Fila de dato (44 px): etiqueta a la izquierda y valor en peso medio a la derecha, como "Saldo actual $420.000". */
export function InfoRow({ label, value, alert = false }: Readonly<InfoRowProps>) {
  return (
    <View className="min-h-11 flex-row items-center justify-between gap-4 px-5 py-2.5">
      <AppText variant="small">{label}</AppText>
      <AppText variant="label" tone={alert ? 'destructive' : 'default'} className="flex-1 text-right" numberOfLines={2}>
        {value}
      </AppText>
    </View>
  );
}
