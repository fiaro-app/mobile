import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { signOutIfSessionExpired } from '@/features/auth/store/session-actions';
import { fetchClientsRisk } from '@/features/risk/api/risk-api';
import { toRiskView, type RiskView } from '@/features/risk/lib/risk-view';
import { unwrapOrThrow } from '@/lib/http/api-failure-error';

/** El API puntúa hasta 50 clientes por consulta. */
const CHUNK_SIZE = 50;

/**
 * El riesgo de los clientes dados, por `id`. Pide de a 50 y es un complemento: si una consulta falla (o la persona no es
 * Owner/Lender) esos clientes quedan fuera del mapa y la pantalla se dibuja sin medidor.
 *
 * @param ids - Los clientes a puntuar; vacío no pide nada.
 * @param enabled - `false` para no pedir todavía.
 */
export function useClientsRisk(ids: readonly string[], enabled = true): ReadonlyMap<string, RiskView> {
  const key = ids.join(',');
  const unique = useMemo(() => (key === '' ? [] : [...new Set(key.split(','))]), [key]);
  const chunks = useMemo(() => Array.from({ length: Math.ceil(unique.length / CHUNK_SIZE) }, (_, index) => unique.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)), [unique]);
  const results = useQueries({
    queries: chunks.map((chunk) => ({
      queryKey: ['admin', 'risk', ...chunk],
      enabled,
      staleTime: 60_000,
      retry: false,
      queryFn: async () => {
        const result = await fetchClientsRisk(chunk);
        if (!result.ok) signOutIfSessionExpired(result.failure);
        return unwrapOrThrow(result);
      },
    })),
  });
  return useMemo(() => new Map(results.flatMap((result) => (result.data ?? []).map((risk) => [risk.clientId, toRiskView(risk)] as const))), [results]);
}
