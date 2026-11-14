import { useState } from 'react';
import { businessDateOf } from '@/lib/business-date';
import { EMPTY_RANGE, pickRangeDate, type DateRangeLimits, type DateRangeValue, type RangeEdge } from '@/lib/date-range';

/** Estado de un filtro «desde / hasta» con su calendario. */
export interface DateRangeFilter {
  readonly range: DateRangeValue;
  /** El rango a pedir a la API, o `null` sin filtro. */
  readonly applied: DateRangeValue | null;
  /** Qué extremo tiene el calendario abierto, o `null`. */
  readonly editing: RangeEdge | null;
  readonly today: string;
  /** El valor del extremo que se edita (para marcarlo en el calendario). */
  readonly editingValue: string;
  readonly open: (edge: RangeEdge) => void;
  readonly close: () => void;
  readonly pick: (value: string) => void;
  readonly clear: () => void;
}

/**
 * Lógica de un filtro de fechas: abre el calendario de un extremo y corrige el otro para que el rango siempre sea válido
 * (ver `pickRangeDate`). Las fechas futuras no se ofrecen: los filtros son de historial.
 *
 * @param limits - El tope de días de la consulta.
 */
export function useDateRange(limits: DateRangeLimits): DateRangeFilter {
  const [range, setRange] = useState<DateRangeValue>(EMPTY_RANGE);
  const [editing, setEditing] = useState<RangeEdge | null>(null);
  return {
    range,
    applied: range.from === '' ? null : range,
    editing,
    today: businessDateOf(),
    editingValue: editing === null ? '' : range[editing],
    open: setEditing,
    close: () => {
      setEditing(null);
    },
    pick: (value) => {
      if (editing !== null) setRange((current) => pickRangeDate(current, editing, value, limits));
    },
    clear: () => {
      setRange(EMPTY_RANGE);
    },
  };
}
