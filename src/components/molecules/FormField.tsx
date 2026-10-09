import { useId, type ReactNode } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { FieldLabel } from '@/components/atoms/FieldLabel';

export interface FormFieldProps {
  readonly label: string;
  /** Mensaje de error; reemplaza a `hint` y lo anuncia a los lectores de pantalla. */
  readonly error?: string | null;
  /** Texto de ayuda gris, visible mientras no haya error. */
  readonly hint?: string;
  readonly children: (accessibility: { readonly accessibilityLabelledBy: string }) => ReactNode;
}

/**
 * Agrupa etiqueta, control y mensaje de un campo con el espaciado del diseño (4 px entre etiqueta
 * e input, 4 px hasta el mensaje). El control se recibe como función para pasarle el
 * `accessibilityLabelledBy` que lo une a su etiqueta: así cada campo queda accesible sin repetirlo
 * a mano en cada pantalla.
 *
 * @example
 * <FormField label="Teléfono" error={phone.error}>
 *   {(a) => <TextField {...a} invalid={Boolean(phone.error)} />}
 * </FormField>
 */
export function FormField({ label, error, hint, children }: Readonly<FormFieldProps>) {
  const labelId = useId();
  return (
    <View className="gap-1">
      <FieldLabel nativeID={labelId}>{label}</FieldLabel>
      {children({ accessibilityLabelledBy: labelId })}
      {error ? (
        <AppText variant="caption" tone="destructive" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </AppText>
      ) : null}
      {!error && hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
