import { View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

/** Intención del distintivo: bueno (verde), aviso (ámbar), malo (rojo), neutro (gris) o de marca. */
export type BadgeKind = 'good' | 'warning' | 'bad' | 'neutral' | 'primary';

const KIND_CLASSES: Record<BadgeKind, string> = {
  good: 'bg-success',
  warning: 'bg-warning',
  bad: 'bg-destructive',
  neutral: 'bg-foreground/60',
  primary: 'bg-primary',
};

/** Pastilla de estado de ancho libre (24 px): ACTIVO, PENDIENTE, APROBADO... A diferencia de `StatusChip`, el texto es libre. */
export function Badge({ label, kind }: Readonly<{ label: string; kind: BadgeKind }>) {
  return (
    <View className={cn('h-6 items-center justify-center self-start rounded-full px-3', KIND_CLASSES[kind])}>
      <AppText variant="caption" tone="inverse" className="text-[11px]">
        {label}
      </AppText>
    </View>
  );
}
