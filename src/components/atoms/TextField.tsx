import { useState, type Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/cn';

export interface TextFieldProps extends TextInputProps {
  /** Borde rojo de 2 px. Quien lo usa es dueño del mensaje (ver `FormField`). */
  readonly invalid?: boolean;
  readonly className?: string;
  readonly ref?: Ref<TextInput>;
}

/**
 * Campo de texto de una línea con los estados del diseño: reposo (borde de 1 px en tinta), foco
 * (2 px en color de marca), error (2 px en rojo) y deshabilitado (40 %).
 *
 * El borde pasa de 1 a 2 px: para que el texto no salte, el relleno horizontal baja 1 px a la vez
 * (15 → 14). Es el mismo truco de la web (`ring-1`), que React Native no tiene.
 */
export function TextField({
  invalid = false,
  editable = true,
  className,
  onFocus,
  onBlur,
  ...props
}: Readonly<TextFieldProps>) {
  const [focused, setFocused] = useState(false);
  const thick = focused || invalid;
  let borderColor = 'border-foreground';
  if (invalid) borderColor = 'border-destructive';
  else if (focused) borderColor = 'border-primary';

  return (
    <TextInput
      editable={editable}
      aria-invalid={invalid}
      placeholderTextColorClassName="accent-foreground/60"
      selectionColorClassName="accent-primary"
      cursorColorClassName="accent-primary"
      className={cn(
        'h-11 rounded-sm bg-surface font-sans text-body text-foreground',
        thick ? 'border-2 px-[14px]' : 'border px-[15px]',
        borderColor,
        !editable && 'opacity-40',
        className,
      )}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...props}
    />
  );
}
