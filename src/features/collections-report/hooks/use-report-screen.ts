import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchReport, type ReportPage } from '@/features/collections-report/api/report-api';
import { toReportRow, totalCollected, type ReportFilter, type ReportRowModel } from '@/features/collections-report/lib/report-view-model';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useCollectorFilter, type CollectorFilter } from '@/lib/hooks/use-collector-filter';
import { useDateRange, type DateRangeFilter } from '@/lib/hooks/use-date-range';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';
import { formatCop } from '@/lib/format-cop';

/** Todo lo que "Cobros del día" dibuja y puede hacer. */
export interface ReportScreen {
  readonly rows: ReportRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly failed: boolean;
  readonly filter: ReportFilter;
  readonly dates: DateRangeFilter;
  readonly collector: CollectorFilter;
  readonly summary: string;
  readonly setFilter: (filter: ReportFilter) => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/**
 * Lógica de "Cobros del día": las visitas de todo el negocio, hoy por defecto o en un rango de hasta 93 días, con filtros
 * por resultado y cobrador (los aplica la API, como en la web). El total cobrado suma lo ya cargado (si hay más páginas,
 * crece al bajar), y por eso el resumen lo dice.
 */
export function useReportScreen(): ReportScreen {
  const dates = useDateRange(DATE_RANGE_LIMITS.visits);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const collector = useCollectorFilter();
  const range = dates.applied;
  const query = useInfiniteQuery<ReportPage, Error, { pages: ReportPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'report', range?.from ?? '', range?.to ?? '', filter, collector.id],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchReport(pageParam, { range, outcome: filter === 'all' ? null : filter, collectorId: collector.applied });
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 15_000,
  });
  const entries = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items), [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const rows = useMemo(() => entries.map(toReportRow), [entries]);
  const more = entries.length < total;
  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    failed: query.data === undefined && query.isError,
    filter,
    dates,
    collector,
    summary: `${String(total)} ${total === 1 ? 'visita' : 'visitas'} · Cobrado ${formatCop(totalCollected(entries))}${more ? ' (hasta ahora)' : ''}`,
    setFilter,
    refresh: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
