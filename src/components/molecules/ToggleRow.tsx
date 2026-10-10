import { Switch, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';

export interface ToggleRowProps {
  readonly label: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
  readonly disabled?: boolean;
}

/** Fila con una etiqueta y un interruptor (48 px de alto). El interruptor usa el color de marca cuando está encendido. */
export function ToggleRow({ label, value, onChange, disabled = false }: Readonly<ToggleRowProps>) {
  return (
    <View className="min-h-12 flex-row items-center justify-between gap-3">
      <AppText variant="body" className="flex-1">
        {label}
      </AppText>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} disabled={disabled} trackColor={{ true: '#3B3382', false: '#D9D6E4' }} />
    </View>
  );
}
