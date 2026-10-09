import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { cn } from '@/lib/cn';

export type BadgeTone = 'primary' | 'destructive' | 'neutral' | 'success';

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-primary/10',
  destructive: 'bg-destructive/10',
  neutral: 'bg-surface shadow-lg shadow-foreground/10',
  success: 'bg-success/10',
};

const ICON_COLORS: Record<BadgeTone, string> = {
  primary: '#3B3382',
  destructive: '#AE3730',
  neutral: '#8A879A',
  success: '#106B32',
};

/**
 * Círculo de 72 px con un ícono centrado, el distintivo de las pantallas de estado ("Sin conexión",
 * "En mantenimiento"). El ícono usa el color como valor porque `Ionicons` no acepta clases; deben
 * coincidir con `--color-primary` y `--color-destructive` de `global.css`.
 */
export function IconBadge({ icon, tone }: Readonly<{ icon: keyof typeof Ionicons.glyphMap; tone: BadgeTone }>) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={cn('size-[72px] items-center justify-center rounded-full', TONE_CLASSES[tone])}
    >
      <Ionicons name={icon} size={32} color={ICON_COLORS[tone]} />
    </View>
  );
}
