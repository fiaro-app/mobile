import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchSettlements, type SettlementsPage } from '@/features/settlement-review/api/review-api';
import { toReviewRow, type ReviewRowModel } from '@/features/settlement-review/lib/review-view-model';
import type { ReviewStatusFilter } from '@/features/settlement-review/content/messages';
import { useMembers } from '@/features/team/hooks/use-members';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useCollectorFilter, type CollectorFilter } from '@/lib/hooks/use-collector-filter';
import { useDateRange, type DateRangeFilter } from '@/lib/hooks/use-date-range';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que la lista de cuadres dibuja y puede hacer. */
export interface ReviewScreen {
  readonly rows: ReviewRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly failed: boolean;
  readonly status: ReviewStatusFilter;
  readonly setStatus: (status: ReviewStatusFilter) => void;
  readonly dates: DateRangeFilter;
  readonly collector: CollectorFilter;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/**
 * Lógica de la lista de cuadres del administrador: por estado (abre en pendientes, que es lo que hay que revisar), fechas y
 * cobrador, con nombres de cobradores y carga por páginas. Los filtros los aplica la API, como en la web.
 */
export function useReviewScreen(): ReviewScreen {
  const [status, setStatus] = useState<ReviewStatusFilter>('PENDING');
  const dates = useDateRange(DATE_RANGE_LIMITS.history);
  const collector = useCollectorFilter();
  const members = useMembers();
  const query = useInfiniteQuery<SettlementsPage, Error, { pages: SettlementsPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'settlements', status, dates.applied?.from ?? '', dates.applied?.to ?? '', collector.id],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchSettlements(pageParam, { status: status === 'ALL' ? null : status, range: dates.applied, collectorId: collector.applied });
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 15_000,
  });
  const names = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.fullName])), [members.data]);
  const rows = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items).map((item) => toReviewRow(item, names)), [query.data, names]);
  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    failed: query.data === undefined && query.isError,
    status,
    setStatus,
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
