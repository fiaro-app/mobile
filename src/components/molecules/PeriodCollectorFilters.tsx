import { View } from 'react-native';
import { SelectButton } from '@/components/atoms/SelectButton';
import { DateRangeFields } from '@/components/molecules/DateRangeFields';
import type { DateRangeFilter } from '@/lib/hooks/use-date-range';

export interface PeriodCollectorFiltersProps {
  readonly dates: DateRangeFilter;
  /** Lo que se ve sin fechas (p. ej. «Sin fechas se ve solo hoy»). */
  readonly periodHint: string;
  readonly collectorLabel: string;
  readonly collectorActive: boolean;
  readonly onOpenCollector: () => void;
}

/** Filtros de período («desde / hasta») y cobrador de las listas del administrador. Solo presentación. */
export function PeriodCollectorFilters({ dates, periodHint, collectorLabel, collectorActive, onOpenCollector }: Readonly<PeriodCollectorFiltersProps>) {
  return (
    <View className="gap-3 bg-surface px-5 pb-4">
      <DateRangeFields range={dates.range} onOpen={dates.open} onClear={dates.clear} emptyHint={periodHint} />
      <SelectButton label={collectorLabel} active={collectorActive} onPress={onOpenCollector} />
    </View>
  );
}
