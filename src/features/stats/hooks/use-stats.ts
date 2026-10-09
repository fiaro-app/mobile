import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchPeriodStats } from '@/features/stats/api/stats-api';
import type { DateRange, PeriodStats } from '@/features/stats/lib/stats-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/**
 * Estadísticas de un rango. Se lanza el error para que la caché conserve el último dato bueno si un refresco
 * falla; un 401 cierra la sesión local. Cada rango tiene su propia clave, así cambiar de período no mezcla datos.
 */
export function usePeriodStats(range: DateRange) {
  return useQuery<PeriodStats>({
    queryKey: ['collector', 'stats', range.from, range.to],
    queryFn: async () => {
      const result = await fetchPeriodStats(range);
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 30_000,
  });
}
