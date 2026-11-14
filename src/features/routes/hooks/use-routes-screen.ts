import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchRoutes, type RoutesPage } from '@/features/routes/api/routes-api';
import { toRouteRow, type RouteRowModel } from '@/features/routes/lib/route-view-model';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useCollectorFilter, type CollectorFilter } from '@/lib/hooks/use-collector-filter';
import { useDateRange, type DateRangeFilter } from '@/lib/hooks/use-date-range';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que el registro de rutas dibuja y puede hacer. */
export interface RoutesScreen {
  readonly rows: RouteRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly failed: boolean;
  readonly dates: DateRangeFilter;
  readonly collector: CollectorFilter;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/** Lógica del registro de rutas: hoy por defecto o un rango de hasta 93 días, y un cobrador; los filtros los aplica la API, como en la web. */
export function useRoutesScreen(): RoutesScreen {
  const dates = useDateRange(DATE_RANGE_LIMITS.visits);
  const collector = useCollectorFilter();
  const range = dates.applied;
  const query = useInfiniteQuery<RoutesPage, Error, { pages: RoutesPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'routes', range?.from ?? '', range?.to ?? '', collector.id],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchRoutes(pageParam, { range, collectorId: collector.applied });
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 15_000,
  });
  const rows = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items).map(toRouteRow), [query.data]);
  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    failed: query.data === undefined && query.isError,
    dates,
    collector,
    refresh: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
