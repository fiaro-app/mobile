import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchLoanRequests, type RequestsPage } from '@/features/loan-requests/api/requests-api';
import type { RequestStatusFilter } from '@/features/loan-requests/content/messages';
import { toRequestRow, type RequestRowModel } from '@/features/loan-requests/lib/request-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que la lista de solicitudes dibuja y puede hacer. */
export interface RequestsScreen {
  readonly rows: RequestRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly failed: boolean;
  readonly status: RequestStatusFilter;
  readonly setStatus: (status: RequestStatusFilter) => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/** Lógica de la lista de solicitudes del administrador: abre en pendientes (lo que hay que resolver), con nombres de cobradores y carga por páginas. */
export function useRequestsScreen(): RequestsScreen {
  const [status, setStatus] = useState<RequestStatusFilter>('PENDING');
  const members = useMembers();
  const query = useInfiniteQuery<RequestsPage, Error, { pages: RequestsPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'loan-requests', status],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchLoanRequests(pageParam, status === 'ALL' ? null : status);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 15_000,
  });
  const names = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.fullName])), [members.data]);
  const rows = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items).map((item) => toRequestRow(item, names)), [query.data, names]);
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
