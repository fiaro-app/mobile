import { Pressable } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface FilterPillProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

/** Pastilla de filtro (28 px de alto): activa en color de marca, inactiva blanca con borde. */
export function FilterPill({ label, active, onPress }: Readonly<FilterPillProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={cn('h-7 justify-center rounded-full border px-3.5 active:opacity-70', active ? 'border-primary bg-primary' : 'border-skeleton bg-surface')}
    >
      <AppText variant="caption" tone={active ? 'inverse' : 'default'} className="text-[13px]">
        {label}
      </AppText>
    </Pressable>
  );
}
