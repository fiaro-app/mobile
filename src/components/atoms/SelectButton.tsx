import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { cn } from '@/lib/cn';

export interface SelectButtonProps {
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

/** Botón con forma de selector (36 px) que abre una lista de opciones; resalta cuando hay una elegida. */
export function SelectButton({ label, active, onPress }: Readonly<SelectButtonProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn('h-9 flex-row items-center justify-between rounded-md border bg-surface px-3.5 active:opacity-70', active ? 'border-primary' : 'border-skeleton')}
    >
      <AppText variant="caption" className="font-sans text-[13px]">
        {label}
      </AppText>
      <Ionicons name="chevron-down" size={16} color="#1C1B2E" />
    </Pressable>
  );
}
