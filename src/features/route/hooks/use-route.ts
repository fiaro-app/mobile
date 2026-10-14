import { useQuery } from '@tanstack/react-query';
import { fetchRoute } from '@/features/route/api/route-api';
import { resolveRouteView, type RouteViewState } from '@/features/route/lib/route-view';
import type { RouteEntry } from '@/features/route/lib/route-entry';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { failureOf, unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Lo que la pantalla de la ruta necesita. */
export interface RouteData {
  readonly state: RouteViewState;
  readonly entries: RouteEntry[];
  /** `true` mientras se refresca con datos ya visibles (el indicador del jalar-para-actualizar). */
  readonly refreshing: boolean;
  readonly refresh: () => void;
}

async function loadRoute(): Promise<RouteEntry[]> {
  const result = await fetchRoute();
  if (!result.ok) signOutIfSessionExpired(result.failure);
  return unwrapOrThrow(result);
}

/**
 * Carga la ruta del día. Se lanza un error cuando el servicio falla (en vez de guardar el fallo como
 * dato) para que TanStack Query CONSERVE la última ruta buena en `data` si un refresco falla: el
 * cobrador sigue viendo su lista sin conexión. Un 401 (la sesión murió en el servidor) cierra la
 * sesión local y el estado de acceso lleva al login. `staleTime` de 30 s evita repetir la consulta al
 * volver rápido a la pantalla; el cobrador puede forzarla jalando la lista.
 */
export function useRoute(): RouteData {
  const query = useQuery({ queryKey: ['collector', 'route'], queryFn: loadRoute, staleTime: 30_000 });
  const failure = failureOf(query.error);
  return {
    state: resolveRouteView(query.data, failure),
    entries: query.data ?? [],
    refreshing: query.isFetching && query.data !== undefined,
    refresh: () => {
      void query.refetch();
    },
  };
}
