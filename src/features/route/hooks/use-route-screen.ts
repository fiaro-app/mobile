import { useMemo, useState } from 'react';
import { emptyContentFor, type EmptyContent } from '@/features/route/content/empty-content';
import { ROUTE_COPY } from '@/features/route/content/messages';
import { useRoute } from '@/features/route/hooks/use-route';
import { applyRouteView, countByFilter, type RouteFilter, type RouteSort } from '@/features/route/lib/route-filters';
import { toRowViewModel, type RowViewModel } from '@/features/route/lib/row-view-model';
import { initials } from '@/features/auth/lib/names';
import { useSessionStore } from '@/features/auth/store/session-store';

/** Todo lo que la pantalla "Ruta de hoy" dibuja. */
export interface RouteScreen {
  readonly rows: RowViewModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly refresh: () => void;
  readonly empty: EmptyContent;
  readonly userInitials: string;
  /** Las pastillas con su conteo y cuál está activa. */
  readonly filters: readonly { readonly value: RouteFilter; readonly label: string }[];
  readonly filter: RouteFilter;
  readonly setFilter: (filter: RouteFilter) => void;
  readonly sort: RouteSort;
  readonly sortLabel: string;
  readonly setSort: (sort: RouteSort) => void;
  readonly sortSheetOpen: boolean;
  readonly openSortSheet: () => void;
  readonly closeSortSheet: () => void;
}

/**
 * Une la ruta cargada con la persona de la sesión, los filtros (Por cobrar, Mora, Atraso, Al día, Cobrados) y el orden.
 * Filtro y orden son estado de la pantalla: se reinician al salir, a propósito (el día siguiente empieza de cero).
 */
export function useRouteScreen(): RouteScreen {
  const route = useRoute();
  const user = useSessionStore((state) => state.user);
  const [filter, setFilter] = useState<RouteFilter>('all');
  const [sort, setSort] = useState<RouteSort>('urgent');
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const counts = useMemo(() => countByFilter(route.entries), [route.entries]);
  const rows = useMemo(() => applyRouteView(route.entries, filter, sort).map(toRowViewModel), [route.entries, filter, sort]);
  const chosen = ROUTE_COPY.sortOptions.find((option) => option.value === sort);
  return {
    rows,
    loading: route.state === 'loading',
    refreshing: route.refreshing,
    refresh: route.refresh,
    empty: emptyContentFor(route.state, filter !== 'all'),
    userInitials: initials(user?.fullName ?? ''),
    filters: ROUTE_COPY.routeFilters.map((option) => ({ value: option.value, label: `${option.label} (${String(counts[option.value])})` })),
    filter,
    setFilter,
    sort,
    sortLabel: `Orden: ${chosen?.label ?? ''}`,
    setSort,
    sortSheetOpen,
    openSortSheet: () => {
      setSortSheetOpen(true);
    },
    closeSortSheet: () => {
      setSortSheetOpen(false);
    },
  };
}
