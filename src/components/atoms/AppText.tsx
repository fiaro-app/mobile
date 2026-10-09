import { Text, type TextProps } from 'react-native';
import { cn } from '@/lib/cn';

/** Estilos tipográficos del diseño (Penpot › "1 · Fundamentos"). */
export type TextVariant = 'brand' | 'title' | 'body' | 'small' | 'label' | 'caption' | 'pin';
/** Color del texto: tinta, marca, error o tinta atenuada. */
export type TextTone = 'default' | 'primary' | 'destructive' | 'muted' | 'inverse';

const VARIANT_CLASSES: Record<TextVariant, string> = {
  brand: 'font-display text-brand',
  title: 'font-display-semibold text-h3',
  body: 'font-sans text-body',
  small: 'font-sans text-label',
  label: 'font-sans-medium text-label',
  caption: 'font-sans-medium text-caption',
  pin: 'font-sans-medium text-pin',
};

const TONE_CLASSES: Record<TextTone, string> = {
  default: 'text-foreground',
  primary: 'text-primary',
  destructive: 'text-destructive',
  muted: 'text-foreground/70',
  inverse: 'text-primary-foreground',
};

export interface AppTextProps extends TextProps {
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  readonly className?: string;
}

/**
 * Único componente de texto de la app: aplica la fuente, el tamaño y el color del diseño. Existe
 * porque en React Native el peso de la fuente no se hereda ni se deriva (cada peso es una fuente
 * distinta), así que el estilo se elige por `variant`, no con `font-bold`.
 *
 * @example
 * <AppText variant="title">Inicia sesión</AppText>
 */
export function AppText({ variant = 'body', tone = 'default', className, ...props }: Readonly<AppTextProps>) {
  return <Text className={cn(VARIANT_CLASSES[variant], TONE_CLASSES[tone], className)} {...props} />;
}
