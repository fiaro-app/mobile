import { useQuery } from '@tanstack/react-query';
import { fetchLender, type Lender } from '@/features/workspace/api/workspace-api';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** Datos del prestamista de la sesión (nombre y logo para el menú). Cambian casi nunca: `staleTime` de 5 minutos. */
export function useLender() {
  return useQuery<Lender>({ queryKey: ['lender'], queryFn: async () => unwrapOrThrow(await fetchLender()), staleTime: 300_000 });
}
