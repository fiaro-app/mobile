import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchSettlements, type SettlementsPage } from '@/features/settlement-review/api/review-api';
import { toReviewRow, type ReviewRowModel } from '@/features/settlement-review/lib/review-view-model';
import type { SettlementStatus } from '@/features/settlement/lib/settlement-schemas';
import { useMembers } from '@/features/team/hooks/use-members';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que la lista de cuadres dibuja y puede hacer. */
export interface ReviewScreen {
  readonly rows: ReviewRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly failed: boolean;
  readonly status: SettlementStatus;
  readonly setStatus: (status: SettlementStatus) => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/** Lógica de la lista de cuadres del administrador: por estado (los pendientes primero), con nombres de cobradores y carga por páginas. */
export function useReviewScreen(): ReviewScreen {
  const [status, setStatus] = useState<SettlementStatus>('PENDING');
  const members = useMembers();
  const query = useInfiniteQuery<SettlementsPage, Error, { pages: SettlementsPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'settlements', status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchSettlements(pageParam, status);
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
    refresh: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
