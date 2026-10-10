import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { useClientNames } from '@/features/clients/hooks/use-client-names';
import { fetchLoans, type LoansPage } from '@/features/loans/api/loans-api';
import { apiStatusOf, matchesLoanFilter, matchesSearch, type LoanFilter } from '@/features/loans/lib/loan-list';
import { toLoanRow, type LoanRowModel } from '@/features/loans/lib/loan-view-model';
import { failureOf, unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Por qué la lista no tiene filas. */
export type LoansEmpty = 'none' | 'no-loans' | 'no-results' | 'error';

/** Todo lo que el listado de préstamos dibuja y puede hacer. */
export interface LoansScreen {
  readonly rows: LoanRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly empty: LoansEmpty;
  readonly search: string;
  readonly filter: LoanFilter;
  readonly setSearch: (text: string) => void;
  readonly setFilter: (filter: LoanFilter) => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/**
 * Lógica del listado de préstamos. El estado (activos, pagados, anulados) lo filtra el API; "En mora" y la búsqueda por
 * nombre de cliente se aplican a lo ya cargado (la lista solo trae el `clientId`, así que el nombre sale de
 * `useClientNames`). Crece por páginas al llegar al final.
 */
export function useLoansScreen(): LoansScreen {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LoanFilter>('all');
  const status = apiStatusOf(filter);
  const query = useInfiniteQuery<LoansPage, Error, { pages: LoansPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'loans', status ?? 'all'],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchLoans(pageParam, status);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 30_000,
  });
  const loaded = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items).filter((loan) => matchesLoanFilter(loan, filter)), [query.data, filter]);
  const names = useClientNames(useMemo(() => loaded.map((loan) => loan.clientId), [loaded]));
  const rows = useMemo(
    () => loaded.filter((loan) => matchesSearch(names.get(loan.clientId) ?? '', search)).map((loan) => toLoanRow(loan, names.get(loan.clientId) ?? 'Cliente')),
    [loaded, names, search],
  );

  let empty: LoansEmpty = 'none';
  if (query.data === undefined && failureOf(query.error)) empty = 'error';
  else if (query.data && rows.length === 0) empty = search.trim() === '' && filter === 'all' ? 'no-loans' : 'no-results';

  return {
    rows,
    loading: query.isPending,
    refreshing: query.isRefetching && !query.isFetchingNextPage,
    loadingMore: query.isFetchingNextPage,
    empty,
    search,
    filter,
    setSearch,
    setFilter,
    refresh: () => {
      void query.refetch();
    },
    loadMore: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
    },
  };
}
