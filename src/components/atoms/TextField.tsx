import { useState, type Ref } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
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
 *
 * Si es de contraseña (`secureTextEntry`), muestra a la derecha un ojito para ver u ocultar lo escrito: todos los campos
 * de contraseña de la app lo heredan sin hacer nada.
 */
export function TextField({
  invalid = false,
  editable = true,
  secureTextEntry = false,
  className,
  onFocus,
  onBlur,
  ...props
}: Readonly<TextFieldProps>) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const thick = focused || invalid;
  let borderColor = 'border-foreground';
  if (invalid) borderColor = 'border-destructive';
  else if (focused) borderColor = 'border-primary';

  const input = (
    <TextInput
      editable={editable}
      secureTextEntry={secureTextEntry && !revealed}
      aria-invalid={invalid}
      placeholderTextColorClassName="accent-foreground/60"
      selectionColorClassName="accent-primary"
      cursorColorClassName="accent-primary"
      className={cn(
        'h-11 rounded-sm bg-surface font-sans text-body text-foreground',
        thick ? 'border-2 px-[14px]' : 'border px-[15px]',
        secureTextEntry && 'pr-12',
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
  if (!secureTextEntry) return input;
  return (
    <View>
      {input}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        disabled={!editable}
        hitSlop={8}
        onPress={() => {
          setRevealed((current) => !current);
        }}
        className="absolute right-0 top-0 h-11 w-12 items-center justify-center active:opacity-60"
      >
        <Ionicons name={revealed ? 'eye-off-outline' : 'eye-outline'} size={22} color="#1C1B2E" />
      </Pressable>
    </View>
  );
}
