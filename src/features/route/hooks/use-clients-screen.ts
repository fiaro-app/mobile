import { useMemo, useState } from 'react';
import { emptyContentFor, type EmptyContent } from '@/features/route/content/empty-content';
import { ROUTE_COPY } from '@/features/route/content/messages';
import { useClientSearch, type ClientSearch } from '@/features/route/hooks/use-client-search';
import { useRoute } from '@/features/route/hooks/use-route';
import { toRowViewModel, type RowViewModel } from '@/features/route/lib/row-view-model';

/** Todo lo que la pantalla "Mis clientes" dibuja. */
export interface ClientsScreen {
  readonly search: ClientSearch;
  readonly rows: RowViewModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly refresh: () => void;
  readonly empty: EmptyContent;
  readonly rangeLabel: string;
  readonly rangeSheetOpen: boolean;
  readonly openRangeSheet: () => void;
  readonly closeRangeSheet: () => void;
}

/**
 * Une la ruta cargada con la búsqueda y los filtros. El selector de rango muestra el rango elegido
 * (o el nombre del filtro si no hay ninguno) y su hoja de opciones se abre y cierra aquí.
 */
export function useClientsScreen(): ClientsScreen {
  const route = useRoute();
  const search = useClientSearch(route.entries);
  const [rangeSheetOpen, setRangeSheetOpen] = useState(false);
  const rows = useMemo(() => search.results.map(toRowViewModel), [search.results]);
  const chosen = ROUTE_COPY.rangeOptions.find((option) => option.value === search.filters.range);
  return {
    search,
    rows,
    loading: route.state === 'loading',
    refreshing: route.refreshing,
    refresh: route.refresh,
    empty: emptyContentFor(route.state, search.filtered),
    rangeLabel: search.filters.range === 'any' ? ROUTE_COPY.rangeTitle : (chosen?.label ?? ROUTE_COPY.rangeTitle),
    rangeSheetOpen,
    openRangeSheet: () => {
      setRangeSheetOpen(true);
    },
    closeRangeSheet: () => {
      setRangeSheetOpen(false);
    },
  };
}
