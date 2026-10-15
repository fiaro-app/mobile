import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchClients, type ClientsPage } from '@/features/clients/api/clients-api';
import { matchesFilter, toClientRow, type ClientFilter, type ClientRowModel } from '@/features/clients/lib/client-view-model';
import { useClientsRisk } from '@/features/risk/hooks/use-clients-risk';
import { useDebouncedValue } from '@/lib/hooks/use-debounced-value';
import { failureOf, unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Por qué la lista no tiene filas. */
export type ClientsEmpty = 'none' | 'no-clients' | 'no-results' | 'error';

/** Todo lo que el listado de clientes dibuja y puede hacer. */
export interface ClientsScreen {
  readonly rows: ClientRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly empty: ClientsEmpty;
  readonly search: string;
  readonly filter: ClientFilter;
  readonly setSearch: (text: string) => void;
  readonly setFilter: (filter: ClientFilter) => void;
  readonly refresh: () => void;
  readonly loadMore: () => void;
}

/**
 * Lógica del listado de clientes. La búsqueda por nombre o cédula la hace el API (con 350 ms de espera tras la última
 * letra); la lista crece por páginas al llegar al final. El filtro "Al día / En mora" se aplica a lo ya cargado porque
 * el API no lo ofrece: por eso un filtro activo puede mostrar menos filas hasta que se carguen más páginas.
 */
export function useClientsScreen(): ClientsScreen {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const term = useDebouncedValue(search.trim());
  const query = useInfiniteQuery<ClientsPage, Error, { pages: ClientsPage[] }, readonly unknown[], number>({
    queryKey: ['admin', 'clients', term],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const result = await fetchClients(pageParam, term);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    getNextPageParam: (last, all) => (all.reduce((sum, page) => sum + page.items.length, 0) < last.total ? all.length + 1 : undefined),
    staleTime: 30_000,
  });
  const loaded = useMemo(() => (query.data?.pages ?? []).flatMap((page) => page.items), [query.data]);
  const risks = useClientsRisk(useMemo(() => loaded.map((client) => client.id), [loaded]));
  const rows = useMemo(
    () =>
      loaded
        .filter((client) => matchesFilter(client, filter))
        .map((client) => {
          const row = toClientRow(client);
          const risk = risks.get(client.id);
          return risk && risk.level !== 'LOW' && risk.hasHistory ? { ...row, detail: `${row.detail} · Riesgo ${risk.levelLabel}` } : row;
        }),
    [loaded, filter, risks],
  );

  let empty: ClientsEmpty = 'none';
  if (query.data === undefined && failureOf(query.error)) empty = 'error';
  else if (query.data && rows.length === 0) empty = term === '' && filter === 'all' ? 'no-clients' : 'no-results';

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
