import { Pressable, type PressableProps } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface TextLinkProps extends Omit<PressableProps, 'children'> {
  readonly label: string;
  readonly className?: string;
}

/**
 * Enlace de texto subrayado en color de marca (14 px, peso medio), como "¿Olvidaste tu
 * contraseña?" del diseño. Es un botón (`accessibilityRole="link"`) porque en la app no navega por
 * URL. El área táctil se amplía con `hitSlop` hasta los ~44 px recomendados sin cambiar el diseño.
 */
export function TextLink({ label, className, ...props }: Readonly<TextLinkProps>) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      className={cn('active:opacity-70', className)}
      {...props}
    >
      <AppText variant="label" tone="primary" className="underline">
        {label}
      </AppText>
    </Pressable>
  );
}
