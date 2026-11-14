import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchDashboard } from '@/features/dashboard/api/dashboard-api';
import { buildDashboardModel, type DashboardModel } from '@/features/dashboard/lib/dashboard-view-model';
import type { Dashboard } from '@/features/dashboard/lib/dashboard-schemas';
import { useSubscription } from '@/features/settings/hooks/use-settings-data';
import { subscriptionNotice, type SubscriptionNotice } from '@/features/settings/lib/subscription-view';
import { useMembers } from '@/features/team/hooks/use-members';
import { DATE_RANGE_LIMITS } from '@/lib/date-range';
import { useDateRange, type DateRangeFilter } from '@/lib/hooks/use-date-range';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Todo lo que el Resumen del administrador dibuja y puede hacer. */
export interface DashboardScreen {
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly refreshing: boolean;
  readonly model: DashboardModel | null;
  /** Aviso del plan (prueba por vencer, en gracia o solo lectura), o `null`. */
  readonly banner: SubscriptionNotice | null;
  /** Período de lo cobrado y la efectividad; sin fechas, hoy. */
  readonly dates: DateRangeFilter;
  readonly refresh: () => void;
}

/**
 * Lógica del Resumen: pide el resumen del negocio y los colaboradores (para poner nombre a cada cuadre). Si los
 * colaboradores no llegan igual se muestra el resumen, con "Cobrador sin nombre" en lugar de bloquear la pantalla.
 */
export function useDashboardScreen(): DashboardScreen {
  const dates = useDateRange(DATE_RANGE_LIMITS.history);
  const range = dates.applied;
  const query = useQuery<Dashboard>({
    queryKey: ['admin', 'dashboard', range?.from ?? '', range?.to ?? ''],
    queryFn: async () => {
      const result = await fetchDashboard(range);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 30_000,
  });
  const members = useMembers();
  const subscription = useSubscription();
  const names = useMemo(() => new Map((members.data ?? []).map((member) => [member.id, member.fullName])), [members.data]);
  const model = useMemo(() => (query.data ? buildDashboardModel(query.data, names, range !== null) : null), [query.data, names, range]);
  return {
    loading: query.isPending,
    loadFailed: query.data === undefined && query.isError,
    refreshing: query.isFetching && query.data !== undefined,
    model,
    banner: subscription.data ? subscriptionNotice(subscription.data) : null,
    dates,
    refresh: () => {
      void query.refetch();
      void members.refetch();
    },
  };
}
