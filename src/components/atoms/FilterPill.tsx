import { Pressable } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface FilterPillProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
  /** `md` (37 px, ocupa el ancho disponible) para los medios de pago; `sm` (28 px) para filtros. */
  readonly size?: 'sm' | 'md';
}

/** Pastilla de filtro (28 px de alto): activa en color de marca, inactiva blanca con borde. */
export function FilterPill({ label, active, onPress, size = 'sm' }: Readonly<FilterPillProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn('justify-center rounded-full border active:opacity-70', size === 'md' ? 'h-[37px] flex-1 items-center' : 'h-7 px-3.5', active ? 'border-primary bg-primary' : 'border-skeleton bg-surface')}
    >
      <AppText variant="caption" tone={active ? 'inverse' : 'default'} className="text-[13px]">
        {label}
      </AppText>
    </Pressable>
  );
}
