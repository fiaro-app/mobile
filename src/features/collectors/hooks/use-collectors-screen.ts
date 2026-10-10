import { useMemo, useState } from 'react';
import { usePortfolios } from '@/features/collectors/hooks/use-portfolios';
import { toCollectorRows, type CollectorRowModel, type CollectorStatusFilter } from '@/features/collectors/lib/collector-view-model';
import { useMembers } from '@/features/team/hooks/use-members';
import { failureOf } from '@/lib/http/api-failure-error';

/** Por qué la lista no tiene filas. */
export type CollectorsEmpty = 'none' | 'no-collectors' | 'no-results' | 'forbidden' | 'error';

/** Todo lo que el listado de cobradores dibuja y puede hacer. */
export interface CollectorsScreen {
  readonly rows: CollectorRowModel[];
  readonly loading: boolean;
  readonly refreshing: boolean;
  readonly empty: CollectorsEmpty;
  readonly search: string;
  readonly status: CollectorStatusFilter;
  readonly setSearch: (text: string) => void;
  readonly setStatus: (status: CollectorStatusFilter) => void;
  readonly refresh: () => void;
}

/**
 * Lógica del listado de cobradores: colaboradores con rol de cobrador, con búsqueda y filtro por estado. Un 403 (la
 * persona no administra) y un fallo de red se distinguen del "no hay cobradores" para mostrar el mensaje correcto.
 */
export function useCollectorsScreen(): CollectorsScreen {
  const members = useMembers();
  const portfolios = usePortfolios();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CollectorStatusFilter>('all');
  const rows = useMemo(() => toCollectorRows(members.data ?? [], portfolios.data ?? [], status, search), [members.data, portfolios.data, status, search]);

  let empty: CollectorsEmpty = 'none';
  const failure = failureOf(members.error);
  if (members.data === undefined && failure) empty = failure.kind === 'http' && failure.status === 403 ? 'forbidden' : 'error';
  else if (members.data && rows.length === 0) empty = search.trim() === '' && status === 'all' ? 'no-collectors' : 'no-results';

  return {
    rows,
    loading: members.isPending,
    refreshing: members.isFetching && members.data !== undefined,
    empty,
    search,
    status,
    setSearch,
    setStatus,
    refresh: () => {
      void members.refetch();
      void portfolios.refetch();
    },
  };
}
