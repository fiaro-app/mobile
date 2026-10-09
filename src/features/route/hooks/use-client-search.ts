import { useMemo, useState } from 'react';
import {
  filterEntries,
  hasActiveFilters,
  NO_FILTERS,
  type ClientFilters,
  type OverdueRange,
  type StatusFilter,
} from '@/features/route/lib/client-filter';
import type { RouteEntry } from '@/features/route/lib/route-entry';

/** Lo que "Mis clientes" necesita: filtros actuales, sus setters y el resultado. */
export interface ClientSearch {
  readonly filters: ClientFilters;
  readonly results: RouteEntry[];
  readonly filtered: boolean;
  readonly setSearch: (search: string) => void;
  readonly setStatus: (status: StatusFilter) => void;
  readonly setRange: (range: OverdueRange) => void;
  readonly clear: () => void;
}

/**
 * Estado de la búsqueda y los filtros de "Mis clientes" sobre las filas de la ruta. Los filtros son
 * estado de la pantalla (se pierden al salir, a propósito): por eso `useState` y no Zustand.
 *
 * @param entries - Filas de la ruta ya cargadas.
 */
export function useClientSearch(entries: RouteEntry[]): ClientSearch {
  const [filters, setFilters] = useState<ClientFilters>(NO_FILTERS);
  const results = useMemo(() => filterEntries(entries, filters), [entries, filters]);
  return {
    filters,
    results,
    filtered: hasActiveFilters(filters),
    setSearch: (search) => {
      setFilters((current) => ({ ...current, search }));
    },
    setStatus: (status) => {
      setFilters((current) => ({ ...current, status }));
    },
    setRange: (range) => {
      setFilters((current) => ({ ...current, range }));
    },
    clear: () => {
      setFilters(NO_FILTERS);
    },
  };
}
