import { addDays, daysInRange } from '@/lib/calendar';

/** Cuántos días puede abarcar un filtro de fechas (los mismos topes que la API, D-117). */
export interface DateRangeLimits {
  readonly maxDays: number;
}

/** Topes por consulta: el reporte de cobros llega a un trimestre; el resto (cuadres, estadísticas, resumen), a un año. */
export const DATE_RANGE_LIMITS = {
  visits: { maxDays: 93 },
  history: { maxDays: 366 },
} as const satisfies Record<string, DateRangeLimits>;

/** Un rango «desde / hasta» en fechas ISO; los dos vacíos es «sin filtro». */
export interface DateRangeValue {
  readonly from: string;
  readonly to: string;
}

export type RangeEdge = 'from' | 'to';

export const EMPTY_RANGE: DateRangeValue = { from: '', to: '' };

/**
 * Pone una fecha en un extremo del rango y corrige el otro para que el rango siempre sea válido: nunca queda «hasta»
 * antes de «desde» ni un rango más largo que el tope (se mueve el otro extremo). Así la pantalla nunca muestra un
 * filtro que la API rechazaría ni deja a la persona adivinando qué corregir. Con un solo extremo elegido, es ese día.
 *
 * @param range - El rango actual.
 * @param edge - El extremo que se eligió.
 * @param value - La fecha elegida (`AAAA-MM-DD`).
 * @param limits - El tope de días.
 */
export function pickRangeDate(range: DateRangeValue, edge: RangeEdge, value: string, limits: DateRangeLimits): DateRangeValue {
  const span = limits.maxDays - 1;
  if (edge === 'from') {
    let to = range.to === '' || range.to < value ? value : range.to;
    if (daysInRange(value, to) > limits.maxDays) to = addDays(value, span);
    return { from: value, to };
  }
  let from = range.from === '' || range.from > value ? value : range.from;
  if (daysInRange(from, value) > limits.maxDays) from = addDays(value, -span);
  return { from, to: value };
}
