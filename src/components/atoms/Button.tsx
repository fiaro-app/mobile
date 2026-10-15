import { useRef } from 'react';
import { Pressable, View, type PressableProps } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { LoadingDots } from '@/components/atoms/LoadingDots';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'danger-outline';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary',
  outline: 'border-[1.5px] border-primary bg-surface',
  danger: 'bg-destructive',
  'danger-outline': 'border-[1.5px] border-destructive bg-surface',
};

const TEXT_TONES = { primary: 'inverse', outline: 'primary', danger: 'inverse', 'danger-outline': 'destructive' } as const;

/** Dos toques seguidos más cerca que esto cuentan como uno: evita cobrar, anular o enviar dos veces. */
export const DOUBLE_TAP_WINDOW_MS = 700;

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  readonly label: string;
  readonly variant?: ButtonVariant;
  /** Reemplaza el texto por tres puntos y deshabilita el botón, sin cambiar su tamaño. */
  readonly loading?: boolean;
  readonly className?: string;
}

/**
 * La acción principal del producto: 48 px de alto, esquinas de 12 px (`radius.md` del diseño).
 * Estados: reposo, presionado (opacidad, en lugar del hover que no existe en móvil), deshabilitado
 * (40 %) y cargando (puntos). Mientras carga conserva el texto invisible para no cambiar de ancho.
 */
export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  className,
  onPress,
  ...props
}: Readonly<ButtonProps>) {
  const inactive = disabled === true || loading;
  const lastPress = useRef(0);
  const handlePress: PressableProps['onPress'] = (event) => {
    const now = Date.now();
    if (now - lastPress.current < DOUBLE_TAP_WINDOW_MS) return;
    lastPress.current = now;
    onPress?.(event);
  };
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={handlePress}
      className={cn(
        'h-12 items-center justify-center rounded-md px-6 active:opacity-70',
        VARIANT_CLASSES[variant],
        disabled === true && !loading && 'opacity-40',
        className,
      )}
      {...props}
    >
      <AppText variant="label" tone={TEXT_TONES[variant]} className={cn(loading && 'opacity-0')}>
        {label}
      </AppText>
      {loading && (
        <View className="absolute inset-0 items-center justify-center">
          <LoadingDots />
        </View>
      )}
    </Pressable>
  );
}
