import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchReport, type ReportPage } from '@/features/collections-report/api/report-api';
import { matchesReport, toReportRow, totalCollected, type ReportFilter, type ReportRowModel } from '@/features/collections-report/lib/report-view-model';
import { startDateOptions } from '@/features/loans/lib/start-dates';
import { businessDateOf, formatShortDate } from '@/lib/business-date';
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
  readonly dateLabel: string;
  readonly dateOptions: readonly { value: string; label: string }[];
  readonly date: string;
  readonly summary: string;
  readonly sheetOpen: boolean;
  readonly setFilter: (filter: ReportFilter) => void;
  readonly setDate: (date: string) => void;
  readonly openSheet: () => void;
  readonly closeSheet: () => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/**
 * Lógica de "Cobros del día": las visitas de todo el negocio de un día (hoy por defecto; se puede mirar cualquiera de los
 * últimos 14). "Pagos" filtra en el API; "Sin pago" se aplica a lo cargado. El total cobrado suma lo ya cargado (si hay más
 * páginas, crece al bajar), y por eso el resumen lo dice.
 */
export function useReportScreen(): ReportScreen {
  const today = businessDateOf();
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<ReportFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);
  const dateOptions = useMemo(() => startDateOptions(today, 14, 0).toReversed(), [today]);
  const query = useInfiniteQuery<ReportPage, Error, { pages: ReportPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'report', date, filter === 'paid'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchReport(pageParam, date, filter === 'paid');
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 15_000,
  });
  const entries = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items), [query.data]);
  const total = query.data?.pages[0]?.total ?? 0;
  const rows = useMemo(() => entries.filter((entry) => matchesReport(entry, filter)).map(toReportRow), [entries, filter]);
  const more = entries.length < total;
  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    failed: query.data === undefined && query.isError,
    filter,
    date,
    dateLabel: date === today ? `Hoy · ${formatShortDate(date)}` : formatShortDate(date),
    dateOptions,
    summary: `${String(total)} ${total === 1 ? 'visita' : 'visitas'} · Cobrado ${formatCop(totalCollected(entries))}${more ? ' (hasta ahora)' : ''}`,
    sheetOpen,
    setFilter,
    setDate: (value) => {
      setDate(value);
      setSheetOpen(false);
    },
    openSheet: () => {
      setSheetOpen(true);
    },
    closeSheet: () => {
      setSheetOpen(false);
    },
    refresh: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
