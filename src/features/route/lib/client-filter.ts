import { classifyEntry, type EntryStatus } from '@/features/route/lib/entry-status';
import type { RouteEntry } from '@/features/route/lib/route-entry';

/** Opciones de las pastillas de "Mis clientes". `all` no filtra; `paid` no tiene pastilla en el diseño. */
export type StatusFilter = 'all' | Exclude<EntryStatus, 'paid'>;

/** Rangos de días de mora del selector (los mismos buckets que el dashboard del Lender, D-100). */
export type OverdueRange = 'any' | '0-7' | '8-15' | '16-30' | '30+';

export interface ClientFilters {
  readonly search: string;
  readonly status: StatusFilter;
  readonly range: OverdueRange;
}

export const NO_FILTERS: ClientFilters = { search: '', status: 'all', range: 'any' };

const RANGE_LIMITS: Record<Exclude<OverdueRange, 'any'>, readonly [number, number]> = {
  '0-7': [0, 7],
  '8-15': [8, 15],
  '16-30': [16, 30],
  '30+': [31, Number.POSITIVE_INFINITY],
};

/** Minúsculas y sin tildes, para que "Perez" encuentre a "Pérez". */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

function matchesRange(days: number, range: OverdueRange): boolean {
  if (range === 'any') return true;
  const [min, max] = RANGE_LIMITS[range];
  return days >= min && days <= max;
}

/**
 * Filtra las filas de la ruta. "Mis clientes" no es otra consulta: el API no tiene un listado de
 * clientes para el cobrador (solo su ruta, D-88), así que se busca y filtra en el dispositivo sobre
 * esa misma lista. Los tres criterios se combinan con "y".
 */
export function filterEntries(entries: readonly RouteEntry[], filters: ClientFilters): RouteEntry[] {
  const needle = normalizeText(filters.search);
  return entries.filter((entry) => {
    if (needle && !normalizeText(entry.clientFullName).includes(needle)) return false;
    if (filters.status !== 'all' && classifyEntry(entry) !== filters.status) return false;
    return matchesRange(entry.overdueDays, filters.range);
  });
}

/** `true` si algún criterio está activo (para distinguir "sin resultados" de "sin clientes"). */
export function hasActiveFilters(filters: ClientFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== 'all' || filters.range !== 'any';
}
