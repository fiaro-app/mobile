import { useQuery } from '@tanstack/react-query';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchPortfolios } from '@/features/collectors/api/collectors-api';
import type { Portfolio } from '@/features/collectors/lib/collector-schemas';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Carteras del prestamista (se usan para asignar cobradores y para mostrar su nombre). Cambian poco: `staleTime` de 1 minuto. */
export function usePortfolios() {
  return useQuery<Portfolio[]>({
    queryKey: ['portfolios'],
    queryFn: async () => {
      const result = await fetchPortfolios();
      if (!result.ok) signOutIfSessionExpired(result.failure);
      return unwrapOrThrow(result);
    },
    staleTime: 60_000,
  });
}
