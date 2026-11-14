import type { FilterOption } from '@/components/molecules/FilterBar';
import { DatePickerSheet } from '@/components/organisms/DatePickerSheet';
import { OptionSheet } from '@/components/organisms/OptionSheet';
import type { DateRangeFilter } from '@/lib/hooks/use-date-range';

export interface PeriodCollectorSheetsProps {
  readonly dates: DateRangeFilter;
  readonly collector: {
    readonly open: boolean;
    readonly options: readonly FilterOption<string>[];
    readonly selected: string;
    readonly onSelect: (id: string) => void;
    readonly onClose: () => void;
  };
}

/**
 * Las hojas de `PeriodCollectorFilters`: el calendario del extremo que se edita (sin fechas futuras) y la lista de
 * cobradores. Van al final de la pantalla, fuera de la lista, para cubrirla entera.
 */
export function PeriodCollectorSheets({ dates, collector }: Readonly<PeriodCollectorSheetsProps>) {
  return (
    <>
      <OptionSheet visible={collector.open} title="Cobrador" options={collector.options} selected={collector.selected} onSelect={collector.onSelect} onClose={collector.onClose} />
      <DatePickerSheet
        visible={dates.editing !== null}
        title={dates.editing === 'to' ? 'Hasta' : 'Desde'}
        value={dates.editingValue}
        today={dates.today}
        max={dates.today}
        onSelect={dates.pick}
        onClose={dates.close}
      />
    </>
  );
}
