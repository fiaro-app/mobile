import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchCollectorsToday } from '@/features/collectors-today/api/collectors-today-api';
import { buildRouteProgress, type RouteProgressModel } from '@/features/collectors-today/lib/collectors-today-view-model';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/**
 * «Rutas de hoy» del Resumen. Es un complemento: si no carga, el Resumen se muestra igual y `model` queda en `null`
 * (nunca bloquea la pantalla). `refresh` vuelve a pedirlo.
 */
export function useCollectorsToday(): { readonly model: RouteProgressModel | null; readonly refresh: () => void } {
  const query = useQuery({
    queryKey: ['admin', 'collectors-today'],
    queryFn: async () => {
      const result = await fetchCollectorsToday();
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 30_000,
  });
  const model = useMemo(() => (query.data ? buildRouteProgress(query.data) : null), [query.data]);
  return {
    model,
    refresh: () => {
      void query.refetch();
    },
  };
}
