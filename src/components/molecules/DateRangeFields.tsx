import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/atoms/AppText';
import { TextLink } from '@/components/atoms/TextLink';
import { formatDisplayDate } from '@/lib/calendar';
import { cn } from '@/lib/cn';
import type { DateRangeValue, RangeEdge } from '@/lib/date-range';

export interface DateRangeFieldsProps {
  readonly range: DateRangeValue;
  readonly onOpen: (edge: RangeEdge) => void;
  readonly onClear: () => void;
  /** Lo que se ve sin fechas (p. ej. «Hoy» o «Este mes»). */
  readonly emptyHint: string;
}

/** Par «Desde / Hasta» de un filtro: cada uno abre el calendario; «Limpiar» vuelve al período por defecto. Solo presentación. */
export function DateRangeFields({ range, onOpen, onClear, emptyHint }: Readonly<DateRangeFieldsProps>) {
  const filtered = range.from !== '';
  return (
    <View className="gap-1.5">
      <View className="flex-row gap-2">
        <DateButton label="Desde" value={range.from} onPress={() => { onOpen('from'); }} />
        <DateButton label="Hasta" value={range.to} onPress={() => { onOpen('to'); }} />
      </View>
      {filtered ? <TextLink label="Limpiar fechas" onPress={onClear} className="self-start" /> : (
        <AppText variant="caption" tone="muted">
          {emptyHint}
        </AppText>
      )}
    </View>
  );
}

function DateButton({ label, value, onPress }: Readonly<{ label: string; value: string; onPress: () => void }>) {
  const shown = formatDisplayDate(value);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={shown === '' ? `${label}: sin fecha` : `${label}: ${shown}`}
      onPress={onPress}
      className={cn('h-11 flex-1 flex-row items-center justify-between rounded-md border bg-surface px-3 active:opacity-70', shown === '' ? 'border-skeleton' : 'border-primary')}
    >
      <View>
        <AppText variant="caption" tone="muted" className="text-[11px]">
          {label}
        </AppText>
        <AppText variant="caption" className="font-sans text-[13px]">
          {shown === '' ? 'dd/mm/aaaa' : shown}
        </AppText>
      </View>
      <Ionicons name="calendar-outline" size={18} color="#1C1B2E" />
    </Pressable>
  );
}
