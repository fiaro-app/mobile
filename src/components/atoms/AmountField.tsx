import { TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface AmountFieldProps extends Omit<TextInputProps, 'style'> {
  readonly label: string;
  readonly hint: string;
  /** Mensaje de error del monto; pinta el borde de rojo. */
  readonly error?: string | null;
}

/**
 * Tarjeta del monto a cobrar: etiqueta, cifra grande editable (34 px, color de marca) y una ayuda. El
 * texto llega ya con puntos de miles; el prefijo `$` es parte del diseño y no del valor. Teclado numérico:
 * el cobrador solo escribe dígitos.
 */
export function AmountField({ label, hint, error, ...input }: Readonly<AmountFieldProps>) {
  return (
    <View className={cn('gap-1 rounded-md border-[1.5px] bg-surface px-5 py-4', error ? 'border-destructive' : 'border-primary')}>
      <AppText variant="caption" className="font-sans">
        {label}
      </AppText>
      <View className="flex-row items-center">
        <AppText className="font-display-semibold text-[34px] leading-[44px] text-primary">$</AppText>
        <TextInput
          accessibilityLabel={label}
          keyboardType="number-pad"
          selectionColorClassName="accent-primary"
          cursorColorClassName="accent-primary"
          className="h-11 flex-1 p-0 font-display-semibold text-[34px] text-primary outline-none"
          {...input}
        />
      </View>
      {error ? (
        <AppText variant="caption" tone="destructive" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted" className="font-sans text-[11px]">
          {hint}
        </AppText>
      )}
    </View>
  );
}
