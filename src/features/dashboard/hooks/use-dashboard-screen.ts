import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchDashboard } from '@/features/dashboard/api/dashboard-api';
import { buildDashboardModel, type DashboardModel } from '@/features/dashboard/lib/dashboard-view-model';
import type { Dashboard } from '@/features/dashboard/lib/dashboard-schemas';
import { useMembers } from '@/features/team/hooks/use-members';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que el Resumen del administrador dibuja y puede hacer. */
export interface DashboardScreen {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly model: DashboardModel | null;
  readonly refresh: () => void;
}

/**
 * Lógica del Resumen: pide el resumen del negocio y los colaboradores (para poner nombre a cada cuadre). Si los
 * colaboradores no llegan igual se muestra el resumen, con "Cobrador sin nombre" en lugar de bloquear la pantalla.
 */
export function useDashboardScreen(): DashboardScreen {
  const query = useQuery<Dashboard>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const result = await fetchDashboard();
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 30_000,
  });
  const members = useMembers();
  const names = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.fullName])), [members.data]);
  const model = useMemo(() => (query.data ? buildDashboardModel(query.data, names) : null), [query.data, names]);
  return {
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isFetching && query.data !== undefined,
    model,
    refresh: () => {
      void query.refetch();
      void members.refetch();
    },
  };
}
